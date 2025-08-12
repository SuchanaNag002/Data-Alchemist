import { ValidationError, Rule, Datasets } from '@/types/page';

function key(entity: string, id: string, field?: string) {
  return `${entity}:${id}${field ? ':' + field : ''}`;
}

export function validateDatasets(d: Datasets, rules: Rule[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // a. Missing required columns (post-parse: required fields empty)
  d.clients.forEach((c) => {
    if (!c.ClientID) errors.push({ id: c.ClientID || '(row)', entity: 'clients', field: 'ClientID', message: 'Missing ClientID', severity: 'error' });
    if (!c.ClientName) errors.push({ id: c.ClientID || '(row)', entity: 'clients', field: 'ClientName', message: 'Missing ClientName', severity: 'error' });
  });
  d.workers.forEach((w) => {
    if (!w.WorkerID) errors.push({ id: w.WorkerID || '(row)', entity: 'workers', field: 'WorkerID', message: 'Missing WorkerID', severity: 'error' });
    if (!w.WorkerName) errors.push({ id: w.WorkerID || '(row)', entity: 'workers', field: 'WorkerName', message: 'Missing WorkerName', severity: 'error' });
  });
  d.tasks.forEach((t) => {
    if (!t.TaskID) errors.push({ id: t.TaskID || '(row)', entity: 'tasks', field: 'TaskID', message: 'Missing TaskID', severity: 'error' });
    if (!t.TaskName) errors.push({ id: t.TaskID || '(row)', entity: 'tasks', field: 'TaskName', message: 'Missing TaskName', severity: 'error' });
  });

  // b. Duplicate IDs
  function dupCheck<T>(arr: T[], idSel: (r: T) => string, entity: 'clients'|'workers'|'tasks') {
    const seen = new Map<string, number>();
    arr.forEach((r) => {
      const id = idSel(r);
      if (!id) return;
      seen.set(id, (seen.get(id) || 0) + 1);
    });
    for (const [id, count] of seen) if (count > 1) errors.push({ id, entity, message: `Duplicate ID (${count}x)`, severity: 'error' });
  }
  dupCheck(d.clients, (r) => r.ClientID, 'clients');
  dupCheck(d.workers, (r) => r.WorkerID, 'workers');
  dupCheck(d.tasks, (r) => r.TaskID, 'tasks');

  // c. Malformed lists
  d.workers.forEach((w) => {
    if (!Array.isArray(w.AvailableSlots) || w.AvailableSlots.some((x) => !Number.isFinite(x))) {
      errors.push({ id: w.WorkerID, entity: 'workers', field: 'AvailableSlots', message: 'AvailableSlots must be numeric list', severity: 'error' });
    }
  });

  // d. Out-of-range values
  d.clients.forEach((c) => {
    if (!(c.PriorityLevel >= 1 && c.PriorityLevel <= 5)) {
      errors.push({ id: c.ClientID, entity: 'clients', field: 'PriorityLevel', message: 'PriorityLevel must be 1-5', severity: 'error' });
    }
  });
  d.tasks.forEach((t) => {
    if (t.Duration < 1) errors.push({ id: t.TaskID, entity: 'tasks', field: 'Duration', message: 'Duration must be >= 1', severity: 'error' });
  });

  // e. Broken JSON in AttributesJSON (already parsed to null if broken) — warn if original had value but parse failed would be caught earlier; treat null ok

  // f. Unknown references (clients.RequestedTaskIDs not in tasks)
  const taskIds = new Set(d.tasks.map((t) => t.TaskID));
  d.clients.forEach((c) => {
    (c.RequestedTaskIDs || []).forEach((tid) => {
      if (!taskIds.has(tid)) errors.push({ id: c.ClientID, entity: 'clients', field: 'RequestedTaskIDs', message: `Unknown TaskID: ${tid}`, severity: 'error' });
    });
  });

  // k. Skill-coverage matrix
  const workersBySkill = new Map<string, number>();
  d.workers.forEach((w) => w.Skills.forEach((s) => workersBySkill.set(s, (workersBySkill.get(s) || 0) + 1)));
  d.tasks.forEach((t) => {
    t.RequiredSkills.forEach((s) => {
      if (!workersBySkill.has(s)) errors.push({ id: t.TaskID, entity: 'tasks', field: 'RequiredSkills', message: `No workers with skill: ${s}`, severity: 'error' });
    });
  });

  // i. Overloaded workers (AvailableSlots.length < MaxLoadPerPhase)
  d.workers.forEach((w) => {
    if (w.MaxLoadPerPhase > w.AvailableSlots.length) {
      errors.push({ id: w.WorkerID, entity: 'workers', field: 'MaxLoadPerPhase', message: 'MaxLoadPerPhase exceeds available slots', severity: 'warning' });
    }
  });

  // j. Phase-slot saturation
  const phases = new Set<number>();
  d.workers.forEach((w) => w.AvailableSlots.forEach((p) => phases.add(p)));
  const phaseCapacity = new Map<number, number>();
  phases.forEach((p) => phaseCapacity.set(p, 0));
  d.workers.forEach((w) => w.AvailableSlots.forEach((p) => phaseCapacity.set(p, (phaseCapacity.get(p) || 0) + w.MaxLoadPerPhase)));

  const phaseDemand = new Map<number, number>();
  phases.forEach((p) => phaseDemand.set(p, 0));
  d.tasks.forEach((t) => {
    t.PreferredPhases.forEach((p) => phaseDemand.set(p, (phaseDemand.get(p) || 0) + t.Duration));
  });
  for (const [p, demand] of phaseDemand) {
    const cap = phaseCapacity.get(p) || 0;
    if (demand > cap) errors.push({ id: String(p), entity: 'global', field: 'Phase', message: `Phase ${p}: demand ${demand} > capacity ${cap}`, severity: 'warning' });
  }

  // l. Max-concurrency feasibility
  d.tasks.forEach((t) => {
    const qualified = d.workers.filter((w) => t.RequiredSkills.every((s) => w.Skills.includes(s)));
    if (qualified.length < t.MaxConcurrent) {
      errors.push({ id: t.TaskID, entity: 'tasks', field: 'MaxConcurrent', message: `MaxConcurrent ${t.MaxConcurrent} > qualified workers ${qualified.length}` , severity: 'warning' });
    }
  });

  // g. Circular co-run groups from rules
  const coRuns = rules.filter((r) => r.type === 'coRun') as any[];
  if (coRuns.length) {
    // Build graph
    const graph = new Map<string, Set<string>>();
    coRuns.forEach((r) => {
      for (const a of r.tasks) for (const b of r.tasks) if (a !== b) {
        if (!graph.has(a)) graph.set(a, new Set());
        graph.get(a)!.add(b);
      }
    });
    const visited = new Set<string>();
    const stack = new Set<string>();
    const hasCycle = (v: string): boolean => {
      if (stack.has(v)) return true;
      if (visited.has(v)) return false;
      visited.add(v);
      stack.add(v);
      for (const n of graph.get(v) || []) if (hasCycle(n)) return true;
      stack.delete(v);
      return false;
    };
    for (const v of graph.keys()) if (hasCycle(v)) {
      errors.push({ id: v, entity: 'rules', message: 'Circular co-run detected', severity: 'error' });
      break;
    }
  }

  // h. Conflicting rules vs phase-window constraints (basic check)
  rules.forEach((r) => {
    if (r.type === 'phaseWindow') {
      const t = d.tasks.find((x) => x.TaskID === r.taskId);
      if (t) {
        const overlap = r.allowedPhases.filter((p) => t.PreferredPhases.includes(p));
        if (!overlap.length) {
          errors.push({ id: t.TaskID, entity: 'rules', field: 'phaseWindow', message: 'Phase window has no overlap with PreferredPhases', severity: 'warning' });
        }
      }
    }
  });

  return errors;
}

export function buildErrorIndex(errors: ValidationError[]) {
  const idx: Record<string, ValidationError[]> = {};
  for (const e of errors) {
    const k = key(e.entity, e.id, e.field);
    (idx[k] ||= []).push(e);
  }
  return idx;
}