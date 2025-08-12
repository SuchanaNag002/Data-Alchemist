import {
  ValidationError,
  Rule,
  Datasets,
  ClientRow,
  WorkerRow,
  TaskRow,
} from "@/types/page";

function key(entity: string, id: string, field?: string) {
  return `${entity}:${id}${field ? ":" + field : ""}`;
}

// Define a more specific type for CoRun rules by extracting it from the main Rule union type
type CoRunRule = Extract<Rule, { type: "coRun" }>;

export function validateDatasets(
  d: Datasets,
  rules: Rule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // a. Missing required columns
  d.clients.forEach((c, index) => {
    const rowId = c.ClientID || `row-${index + 1}`;
    if (!c.ClientID)
      errors.push({
        id: rowId,
        entity: "clients",
        field: "ClientID",
        message: "Missing required ClientID",
        severity: "error",
      });
    if (!c.ClientName)
      errors.push({
        id: rowId,
        entity: "clients",
        field: "ClientName",
        message: "Missing required ClientName",
        severity: "error",
      });
    if (c.PriorityLevel === null || c.PriorityLevel === undefined)
      errors.push({
        id: rowId,
        entity: "clients",
        field: "PriorityLevel",
        message: "Missing required PriorityLevel",
        severity: "error",
      });
  });

  d.workers.forEach((w, index) => {
    const rowId = w.WorkerID || `row-${index + 1}`;
    if (!w.WorkerID)
      errors.push({
        id: rowId,
        entity: "workers",
        field: "WorkerID",
        message: "Missing required WorkerID",
        severity: "error",
      });
    if (!w.WorkerName)
      errors.push({
        id: rowId,
        entity: "workers",
        field: "WorkerName",
        message: "Missing required WorkerName",
        severity: "error",
      });
    if (!w.Skills || w.Skills.length === 0)
      errors.push({
        id: rowId,
        entity: "workers",
        field: "Skills",
        message: "Missing required Skills",
        severity: "error",
      });
    if (!w.AvailableSlots || w.AvailableSlots.length === 0)
      errors.push({
        id: rowId,
        entity: "workers",
        field: "AvailableSlots",
        message: "Missing required AvailableSlots",
        severity: "error",
      });
    if (w.MaxLoadPerPhase === null || w.MaxLoadPerPhase === undefined)
      errors.push({
        id: rowId,
        entity: "workers",
        field: "MaxLoadPerPhase",
        message: "Missing required MaxLoadPerPhase",
        severity: "error",
      });
  });

  d.tasks.forEach((t, index) => {
    const rowId = t.TaskID || `row-${index + 1}`;
    if (!t.TaskID)
      errors.push({
        id: rowId,
        entity: "tasks",
        field: "TaskID",
        message: "Missing required TaskID",
        severity: "error",
      });
    if (!t.TaskName)
      errors.push({
        id: rowId,
        entity: "tasks",
        field: "TaskName",
        message: "Missing required TaskName",
        severity: "error",
      });
    if (t.Duration === null || t.Duration === undefined)
      errors.push({
        id: rowId,
        entity: "tasks",
        field: "Duration",
        message: "Missing required Duration",
        severity: "error",
      });
    if (!t.RequiredSkills || t.RequiredSkills.length === 0)
      errors.push({
        id: rowId,
        entity: "tasks",
        field: "RequiredSkills",
        message: "Missing required RequiredSkills",
        severity: "error",
      });
    if (t.MaxConcurrent === null || t.MaxConcurrent === undefined)
      errors.push({
        id: rowId,
        entity: "tasks",
        field: "MaxConcurrent",
        message: "Missing required MaxConcurrent",
        severity: "error",
      });
  });

  // b. Duplicate IDs
  function dupCheck<
    T extends { ClientID: string } | { WorkerID: string } | { TaskID: string }
  >(
    arr: T[],
    idSel: (r: T) => string,
    entity: "clients" | "workers" | "tasks"
  ) {
    const seen = new Map<string, number>();
    arr.forEach((r) => {
      const id = idSel(r);
      if (!id) return;
      seen.set(id, (seen.get(id) || 0) + 1);
    });
    for (const [id, count] of seen) {
      if (count > 1) {
        errors.push({
          id,
          entity,
          message: `Duplicate ID found ${count} times`,
          severity: "error",
        });
      }
    }
  }
  dupCheck(d.clients, (r: ClientRow) => r.ClientID, "clients");
  dupCheck(d.workers, (r: WorkerRow) => r.WorkerID, "workers");
  dupCheck(d.tasks, (r: TaskRow) => r.TaskID, "tasks");

  // c. Malformed lists (non-numeric in AvailableSlots etc)
  d.workers.forEach((w) => {
    if (
      w.AvailableSlots &&
      (!Array.isArray(w.AvailableSlots) ||
        w.AvailableSlots.some((x) => !Number.isInteger(x) || x < 1))
    ) {
      errors.push({
        id: w.WorkerID,
        entity: "workers",
        field: "AvailableSlots",
        message: "AvailableSlots must be array of positive integers",
        severity: "error",
      });
    }
  });

  d.clients.forEach((c) => {
    if (c.RequestedTaskIDs && !Array.isArray(c.RequestedTaskIDs)) {
      errors.push({
        id: c.ClientID,
        entity: "clients",
        field: "RequestedTaskIDs",
        message: "RequestedTaskIDs must be an array",
        severity: "error",
      });
    }
  });

  d.tasks.forEach((t) => {
    if (
      t.RequiredSkills &&
      (!Array.isArray(t.RequiredSkills) ||
        t.RequiredSkills.some((s) => typeof s !== "string"))
    ) {
      errors.push({
        id: t.TaskID,
        entity: "tasks",
        field: "RequiredSkills",
        message: "RequiredSkills must be array of strings",
        severity: "error",
      });
    }
    if (
      t.PreferredPhases &&
      (!Array.isArray(t.PreferredPhases) ||
        t.PreferredPhases.some((x) => !Number.isInteger(x) || x < 1))
    ) {
      errors.push({
        id: t.TaskID,
        entity: "tasks",
        field: "PreferredPhases",
        message: "PreferredPhases must be array of positive integers",
        severity: "error",
      });
    }
  });

  // d. Out-of-range values
  d.clients.forEach((c) => {
    if (
      c.PriorityLevel !== null &&
      c.PriorityLevel !== undefined &&
      (c.PriorityLevel < 1 ||
        c.PriorityLevel > 5 ||
        !Number.isInteger(c.PriorityLevel))
    ) {
      errors.push({
        id: c.ClientID,
        entity: "clients",
        field: "PriorityLevel",
        message: "PriorityLevel must be integer between 1-5",
        severity: "error",
      });
    }
  });

  d.tasks.forEach((t) => {
    if (
      t.Duration !== null &&
      t.Duration !== undefined &&
      (t.Duration < 1 || !Number.isInteger(t.Duration))
    ) {
      errors.push({
        id: t.TaskID,
        entity: "tasks",
        field: "Duration",
        message: "Duration must be integer >= 1",
        severity: "error",
      });
    }
    if (
      t.MaxConcurrent !== null &&
      t.MaxConcurrent !== undefined &&
      (t.MaxConcurrent < 1 || !Number.isInteger(t.MaxConcurrent))
    ) {
      errors.push({
        id: t.TaskID,
        entity: "tasks",
        field: "MaxConcurrent",
        message: "MaxConcurrent must be integer >= 1",
        severity: "error",
      });
    }
  });

  d.workers.forEach((w) => {
    if (
      w.MaxLoadPerPhase !== null &&
      w.MaxLoadPerPhase !== undefined &&
      (w.MaxLoadPerPhase < 1 || !Number.isInteger(w.MaxLoadPerPhase))
    ) {
      errors.push({
        id: w.WorkerID,
        entity: "workers",
        field: "MaxLoadPerPhase",
        message: "MaxLoadPerPhase must be integer >= 1",
        severity: "error",
      });
    }
    if (
      w.QualificationLevel !== null &&
      w.QualificationLevel !== undefined &&
      (w.QualificationLevel < 1 ||
        w.QualificationLevel > 10 ||
        !Number.isInteger(w.QualificationLevel))
    ) {
      errors.push({
        id: w.WorkerID,
        entity: "workers",
        field: "QualificationLevel",
        message: "QualificationLevel must be integer between 1-10",
        severity: "error",
      });
    }
  });

  // e. Broken JSON in AttributesJSON
  d.clients.forEach((c) => {
    if (c.AttributesJSON && typeof c.AttributesJSON === "string") {
      try {
        JSON.parse(c.AttributesJSON);
      } catch {
        errors.push({
          id: c.ClientID,
          entity: "clients",
          field: "AttributesJSON",
          message: "AttributesJSON contains invalid JSON",
          severity: "error",
        });
      }
    }
  });

  // f. Unknown references (RequestedTaskIDs not in tasks; regex rules referencing missing TaskIDs)
  const taskIds = new Set(d.tasks.map((t) => t.TaskID));
  d.clients.forEach((c) => {
    if (c.RequestedTaskIDs && Array.isArray(c.RequestedTaskIDs)) {
      c.RequestedTaskIDs.forEach((tid) => {
        if (tid && !taskIds.has(tid)) {
          errors.push({
            id: c.ClientID,
            entity: "clients",
            field: "RequestedTaskIDs",
            message: `Unknown TaskID reference: ${tid}`,
            severity: "error",
          });
        }
      });
    }
  });

  // Check rule references
  rules.forEach((rule, index) => {
    if (
      rule.type === "phaseWindow" &&
      rule.taskId &&
      !taskIds.has(rule.taskId)
    ) {
      errors.push({
        id: `rule-${index}`,
        entity: "rules",
        field: "taskId",
        message: `Phase window rule references unknown TaskID: ${rule.taskId}`,
        severity: "error",
      });
    }
    if (rule.type === "coRun" && rule.tasks) {
      rule.tasks.forEach((taskId: string) => {
        if (!taskIds.has(taskId)) {
          errors.push({
            id: `rule-${index}`,
            entity: "rules",
            field: "tasks",
            message: `Co-run rule references unknown TaskID: ${taskId}`,
            severity: "error",
          });
        }
      });
    }
  });

  // g. Circular co-run groups (A→B→C→A)
  const coRuns = rules.filter((r): r is CoRunRule => r.type === "coRun");
  if (coRuns.length) {
    // Build graph of co-run relationships
    const graph = new Map<string, Set<string>>();
    coRuns.forEach((r) => {
      if (r.tasks && Array.isArray(r.tasks)) {
        for (const a of r.tasks) {
          for (const b of r.tasks) {
            if (a !== b) {
              if (!graph.has(a)) graph.set(a, new Set());
              graph.get(a)!.add(b);
            }
          }
        }
      }
    });

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, path: string[] = []): string[] | null => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        return path.slice(cycleStart).concat([node]);
      }
      if (visited.has(node)) return null;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const neighbor of graph.get(node) || []) {
        const cycle = hasCycle(neighbor, [...path]);
        if (cycle) return cycle;
      }

      recursionStack.delete(node);
      return null;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        const cycle = hasCycle(node);
        if (cycle) {
          errors.push({
            id: cycle.join("→"),
            entity: "rules",
            message: `Circular co-run dependency detected: ${cycle.join(
              " → "
            )}`,
            severity: "error",
          });
          break; // Report first cycle found
        }
      }
    }
  }

  // h. Conflicting rules vs. phase-window constraints
  rules.forEach((rule) => {
    if (rule.type === "phaseWindow" && rule.taskId && rule.allowedPhases) {
      const task = d.tasks.find((t) => t.TaskID === rule.taskId);
      if (task && task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
        const overlap = rule.allowedPhases.filter((p) =>
          task.PreferredPhases.includes(p)
        );
        if (overlap.length === 0) {
          errors.push({
            id: rule.taskId,
            entity: "rules",
            field: "phaseWindow",
            message: `Phase window rule has no overlap with task's PreferredPhases`,
            severity: "warning",
          });
        }
      }
    }
  });

  // i. Overloaded workers (AvailableSlots.length < MaxLoadPerPhase)
  d.workers.forEach((w) => {
    if (
      w.AvailableSlots &&
      w.MaxLoadPerPhase &&
      w.MaxLoadPerPhase > w.AvailableSlots.length
    ) {
      errors.push({
        id: w.WorkerID,
        entity: "workers",
        field: "MaxLoadPerPhase",
        message: `MaxLoadPerPhase (${w.MaxLoadPerPhase}) exceeds available slots (${w.AvailableSlots.length})`,
        severity: "warning",
      });
    }
  });

  // j. Phase-slot saturation: sum of task durations per Phase ≤ total worker slots
  const phases = new Set<number>();
  d.workers.forEach((w) => {
    if (w.AvailableSlots) {
      w.AvailableSlots.forEach((p) => phases.add(p));
    }
  });

  const phaseCapacity = new Map<number, number>();
  phases.forEach((p) => phaseCapacity.set(p, 0));

  d.workers.forEach((w) => {
    if (w.AvailableSlots && w.MaxLoadPerPhase) {
      w.AvailableSlots.forEach((p) => {
        phaseCapacity.set(p, (phaseCapacity.get(p) || 0) + w.MaxLoadPerPhase);
      });
    }
  });

  const phaseDemand = new Map<number, number>();
  phases.forEach((p) => phaseDemand.set(p, 0));

  d.tasks.forEach((t) => {
    if (t.PreferredPhases && t.Duration) {
      t.PreferredPhases.forEach((p) => {
        phaseDemand.set(p, (phaseDemand.get(p) || 0) + t.Duration);
      });
    }
  });

  for (const [phase, demand] of phaseDemand) {
    const capacity = phaseCapacity.get(phase) || 0;
    if (demand > capacity) {
      errors.push({
        id: `phase-${phase}`,
        entity: "global",
        field: "Phase",
        message: `Phase ${phase}: total task demand (${demand}) exceeds worker capacity (${capacity})`,
        severity: "warning",
      });
    }
  }

  // k. Skill-coverage matrix: every RequiredSkill maps to ≥1 worker
  const workerSkills = new Set<string>();
  d.workers.forEach((w) => {
    if (w.Skills) {
      w.Skills.forEach((skill) => workerSkills.add(skill));
    }
  });

  d.tasks.forEach((t) => {
    if (t.RequiredSkills) {
      t.RequiredSkills.forEach((skill) => {
        if (!workerSkills.has(skill)) {
          errors.push({
            id: t.TaskID,
            entity: "tasks",
            field: "RequiredSkills",
            message: `No workers have required skill: ${skill}`,
            severity: "error",
          });
        }
      });
    }
  });

  // l. Max-concurrency feasibility: MaxConcurrent ≤ count of qualified, available workers
  d.tasks.forEach((t) => {
    if (t.RequiredSkills && t.MaxConcurrent) {
      const qualifiedWorkers = d.workers.filter((w) => {
        if (!w.Skills) return false;
        return t.RequiredSkills.every((skill) => w.Skills.includes(skill));
      });

      if (qualifiedWorkers.length < t.MaxConcurrent) {
        errors.push({
          id: t.TaskID,
          entity: "tasks",
          field: "MaxConcurrent",
          message: `MaxConcurrent (${t.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          severity: "warning",
        });
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

// Helper function to validate individual field changes in real-time
export function validateField(
  entity: string,
  field: string,
  value: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];
  const id = "temp"; // Temporary ID for field validation

  switch (entity) {
    case "clients":
      if (field === "PriorityLevel") {
        if (
          value !== null &&
          value !== undefined &&
          (Number(value) < 1 ||
            Number(value) > 5 ||
            !Number.isInteger(Number(value)))
        ) {
          errors.push({
            id,
            entity,
            field,
            message: "PriorityLevel must be integer between 1-5",
            severity: "error",
          });
        }
      }
      if (field === "AttributesJSON" && value && typeof value === "string") {
        try {
          JSON.parse(value);
        } catch {
          errors.push({
            id,
            entity,
            field,
            message: "AttributesJSON contains invalid JSON",
            severity: "error",
          });
        }
      }
      break;

    case "workers":
      if (field === "MaxLoadPerPhase") {
        if (
          value !== null &&
          value !== undefined &&
          (Number(value) < 1 || !Number.isInteger(Number(value)))
        ) {
          errors.push({
            id,
            entity,
            field,
            message: "MaxLoadPerPhase must be integer >= 1",
            severity: "error",
          });
        }
      }
      if (field === "AvailableSlots") {
        if (
          value &&
          (!Array.isArray(value) ||
            value.some((x) => !Number.isInteger(x) || x < 1))
        ) {
          errors.push({
            id,
            entity,
            field,
            message: "AvailableSlots must be array of positive integers",
            severity: "error",
          });
        }
      }
      break;

    case "tasks":
      if (field === "Duration") {
        if (
          value !== null &&
          value !== undefined &&
          (Number(value) < 1 || !Number.isInteger(Number(value)))
        ) {
          errors.push({
            id,
            entity,
            field,
            message: "Duration must be integer >= 1",
            severity: "error",
          });
        }
      }
      if (field === "MaxConcurrent") {
        if (
          value !== null &&
          value !== undefined &&
          (Number(value) < 1 || !Number.isInteger(Number(value)))
        ) {
          errors.push({
            id,
            entity,
            field,
            message: "MaxConcurrent must be integer >= 1",
            severity: "error",
          });
        }
      }
      break;
  }

  return errors;
}
