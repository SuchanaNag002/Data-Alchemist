export type ClientRow = {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number; // 1-5
  RequestedTaskIDs: string[];
  GroupTag?: string;
  AttributesJSON?: Record<string, any> | null;
};

export type WorkerRow = {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[]; // e.g., [1,3,5]
  MaxLoadPerPhase: number;
  WorkerGroup?: string;
  QualificationLevel?: number;
};

export type TaskRow = {
  TaskID: string;
  TaskName: string;
  Category?: string;
  Duration: number; // >= 1
  RequiredSkills: string[];
  PreferredPhases: number[]; // normalized list
  MaxConcurrent: number;
};

export type EntityKind = 'clients' | 'workers' | 'tasks';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationError = {
  id: string; // row id if applicable
  entity: EntityKind | 'rules' | 'global';
  field?: string;
  message: string;
  severity: ValidationSeverity;
};

export type RuleCoRun = { type: 'coRun'; tasks: string[] };
export type RuleSlotRestriction = { type: 'slotRestriction'; target: { kind: 'ClientGroup' | 'WorkerGroup'; value: string }; minCommonSlots: number };
export type RuleLoadLimit = { type: 'loadLimit'; target: { kind: 'WorkerGroup'; value: string }; maxSlotsPerPhase: number };
export type RulePhaseWindow = { type: 'phaseWindow'; taskId: string; allowedPhases: number[] };
export type RulePatternMatch = { type: 'patternMatch'; regex: string; template: string; params?: Record<string, any> };
export type RulePrecedence = { type: 'precedence'; scope: 'global' | 'specific'; priority: number };

export type Rule = RuleCoRun | RuleSlotRestriction | RuleLoadLimit | RulePhaseWindow | RulePatternMatch | RulePrecedence;

export type Weights = {
  priorityLevel: number;
  requestedTaskFulfillment: number;
  fairness: number;
  cost?: number;
  speed?: number;
};

export type Datasets = {
  clients: ClientRow[];
  workers: WorkerRow[];
  tasks: TaskRow[];
};

export type ErrorIndex = Record<string, ValidationError[]>;