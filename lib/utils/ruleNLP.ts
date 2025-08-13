import { Datasets, Rule } from "@/types/page";

export type ParseResult = { rules: Rule[]; notes: string[] };

function splitStatements(input: string): string[] {
  return input
    .split(/\n+|;|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumberListLocal(input: unknown): number[] {
  if (Array.isArray(input))
    return input.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  const s = String(input ?? "").trim();
  if (!s) return [];
  if (s.includes("-") && !s.includes("[")) {
    const [a, b] = s.split("-").map((x) => Number(x));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr))
        return arr.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    } catch {}
  }
  return s
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

export function parseRulesFromText(
  input: string,
  datasets: Datasets
): ParseResult {
  const statements = splitStatements(input);
  const taskIds = new Set(datasets.tasks.map((t) => String(t.TaskID)));
  const workerGroups = new Set(
    datasets.workers.map((w) => w.WorkerGroup).filter((g): g is string => !!g)
  );
  const clientGroups = new Set(
    datasets.clients.map((c) => c.GroupTag).filter((g): g is string => !!g)
  );

  const rules: Rule[] = [];
  const notes: string[] = [];

  for (const raw of statements) {
    const s = raw.trim();
    if (!s) continue;

    // 1) co-run / together
    if (/\b(co[-\s]?run|together|concurrently)\b/i.test(s)) {
      const mentioned = Array.from(taskIds).filter((id) =>
        new RegExp(`(?<![A-Za-z0-9_%-])${id}(?![A-Za-z0-9_%-])`).test(s)
      );
      if (mentioned.length >= 2) {
        rules.push({ type: "coRun", tasks: Array.from(new Set(mentioned)) });
      } else {
        notes.push(`Co-run statement skipped (need >=2 known TaskIDs): "${s}"`);
      }
      continue;
    }

    // 2) load limit for WorkerGroup
    {
      const m = s.match(
        /(?:limit|max)\s+WorkerGroup\s+([A-Za-z0-9_-]+)\s*(?:to|=)?\s*(\d+)/i
      );
      if (m) {
        const grp = m[1];
        const num = Number(m[2]);
        if (!workerGroups.has(grp))
          notes.push(`Unknown WorkerGroup "${grp}" referenced.`);
        if (Number.isFinite(num) && num > 0) {
          rules.push({
            type: "loadLimit",
            target: { kind: "WorkerGroup", value: grp },
            maxSlotsPerPhase: num,
          });
        } else {
          notes.push(`Invalid number in load-limit: "${s}"`);
        }
        continue;
      }
    }

    // 3) slot restriction (min common slots) for ClientGroup/WorkerGroup
    {
      let m = s.match(
        /\b(ClientGroup|WorkerGroup)\s+([A-Za-z0-9_-]+).*?(?:min(?:imum)?|at\s+least)\s*(\d+)\s*(?:common\s+slots?)/i
      );
      if (!m)
        m = s.match(
          /(?:require|needs?)\s*(?:at\s+least\s*)?(\d+)\s*(?:common\s+slots?).*\b(ClientGroup|WorkerGroup)\s+([A-Za-z0-9_-]+)/i
        );
      if (m) {
        let kind: "ClientGroup" | "WorkerGroup";
        let group: string;
        let num: number;
        if (m.length === 4 && /ClientGroup|WorkerGroup/i.test(m[1])) {
          kind = m[1] as "ClientGroup" | "WorkerGroup";
          group = m[2];
          num = Number(m[3]);
        } else {
          num = Number(m[1]);
          kind = m[2] as "ClientGroup" | "WorkerGroup";
          group = m[3];
        }
        if (kind === "ClientGroup" && !clientGroups.has(group))
          notes.push(`Unknown ClientGroup "${group}" referenced.`);
        if (kind === "WorkerGroup" && !workerGroups.has(group))
          notes.push(`Unknown WorkerGroup "${group}" referenced.`);
        if (Number.isFinite(num) && num >= 0) {
          rules.push({
            type: "slotRestriction",
            target: { kind, value: group },
            minCommonSlots: num,
          });
        } else {
          notes.push(`Invalid number in slot-restriction: "${s}"`);
        }
        continue;
      }
    }

    // 4) phase window for a Task
    {
      // capture TaskID first, then phases expression
      const taskMention = Array.from(taskIds).find((id) =>
        new RegExp(`(?<![A-Za-z0-9_%-])${id}(?![A-Za-z0-9_%-])`).test(s)
      );
      if (taskMention) {
        const m = s.match(
          /(?:only\s+in\s+phases|allowed\s+phases|phases)\s+([^.;]+)/i
        );
        if (m) {
          const phaseText = m[1];
          try {
            const phases = parseNumberListLocal(phaseText);
            if (phases.length > 0) {
              rules.push({
                type: "phaseWindow",
                taskId: taskMention,
                allowedPhases: Array.from(new Set(phases)).sort(
                  (a, b) => a - b
                ),
              });
            } else {
              notes.push(`No phases parsed for: "${s}"`);
            }
          } catch (e) {
            notes.push(`Failed to parse phases from: "${s}"`);
          }
          continue;
        }
      }
    }

    // 5) precedence (global)
    {
      const m = s.match(/\bglobal\s+precedence\s+(\d+)/i);
      if (m) {
        const pr = Number(m[1]);
        if (Number.isFinite(pr)) {
          rules.push({ type: "precedence", scope: "global", priority: pr });
        } else {
          notes.push(`Invalid precedence number: "${s}"`);
        }
        continue;
      }
    }

    // 6) pattern match
    {
      const m = s.match(
        /pattern\s+\/(.+?)\/\s*->\s*template\s+([A-Za-z0-9_-]+)(?:\s*params\s*(\{[\s\S]*\}))?/i
      );
      if (m) {
        const regex = `/${m[1]}/`;
        const template = m[2];
        let params: Record<string, any> | undefined;
        if (m[3]) {
          try {
            params = JSON.parse(m[3]);
          } catch {
            notes.push(`Invalid JSON params in pattern: "${s}"`);
          }
        }
        rules.push({ type: "patternMatch", regex, template, params });
        continue;
      }
    }

    // no rule parsed
    notes.push(`Unrecognized statement: "${s}"`);
  }

  return { rules, notes };
}
