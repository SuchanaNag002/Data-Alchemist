import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ClientRow, WorkerRow, TaskRow } from '@/types/page';

function parseList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  const s = String(input ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map(String).map((x) => x.trim()).filter(Boolean);
    } catch {}
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function parseNumberList(input: unknown): number[] {
  if (Array.isArray(input)) return input.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  const s = String(input ?? '').trim();
  if (!s) return [];
  if (s.includes('-') && !s.includes('[')) {
    // Range like "1-3"
    const [a, b] = s.split('-').map((x) => Number(x));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    } catch {}
  }
  return s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

function mapHeadersSmart<T extends Record<string, any>>(row: T, headerMap: Record<string, string>): any {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = (k || '').toLowerCase().replace(/\s+/g, '');
    const mapped = headerMap[key];
    if (mapped) out[mapped] = v;
    else out[k as string] = v; // fallback keep
  }
  return out;
}

const clientHeaderMap: Record<string, string> = {
  clientid: 'ClientID',
  clientname: 'ClientName',
  prioritylevel: 'PriorityLevel',
  requestedtaskids: 'RequestedTaskIDs',
  grouptag: 'GroupTag',
  attributesjson: 'AttributesJSON',
};

const workerHeaderMap: Record<string, string> = {
  workerid: 'WorkerID',
  workername: 'WorkerName',
  skills: 'Skills',
  availableslots: 'AvailableSlots',
  maxloadperphase: 'MaxLoadPerPhase',
  workergroup: 'WorkerGroup',
  qualificationlevel: 'QualificationLevel',
};

const taskHeaderMap: Record<string, string> = {
  taskid: 'TaskID',
  taskname: 'TaskName',
  category: 'Category',
  duration: 'Duration',
  requiredskills: 'RequiredSkills',
  preferredphases: 'PreferredPhases',
  maxconcurrent: 'MaxConcurrent',
};

export function parseCSV(content: string) {
  return Papa.parse(content, { header: true, skipEmptyLines: true }).data as any[];
}

export function parseXLSX(arrayBuffer: ArrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws) as any[];
}

export function toClients(rows: any[]): ClientRow[] {
  return rows.map((raw) => {
    const r = mapHeadersSmart(raw, clientHeaderMap);
    let attrs: Record<string, any> | null = null;
    const attrsRaw = r.AttributesJSON ?? r.attributesjson;
    if (attrsRaw != null && String(attrsRaw).trim() !== '') {
      try { attrs = typeof attrsRaw === 'string' ? JSON.parse(attrsRaw) : attrsRaw; } catch { attrs = null; }
    }
    return {
      ClientID: String(r.ClientID ?? r.clientid ?? '').trim(),
      ClientName: String(r.ClientName ?? r.clientname ?? '').trim(),
      PriorityLevel: Number(r.PriorityLevel ?? r.prioritylevel ?? 0) || 0,
      RequestedTaskIDs: parseList(r.RequestedTaskIDs ?? r.requestedtaskids),
      GroupTag: r.GroupTag ?? r.grouptag ?? undefined,
      AttributesJSON: attrs,
    } as ClientRow;
  });
}

export function toWorkers(rows: any[]): WorkerRow[] {
  return rows.map((raw) => {
    const r = mapHeadersSmart(raw, workerHeaderMap);
    return {
      WorkerID: String(r.WorkerID ?? r.workerid ?? '').trim(),
      WorkerName: String(r.WorkerName ?? r.workername ?? '').trim(),
      Skills: parseList(r.Skills),
      AvailableSlots: parseNumberList(r.AvailableSlots),
      MaxLoadPerPhase: Number(r.MaxLoadPerPhase ?? 0) || 0,
      WorkerGroup: r.WorkerGroup ?? undefined,
      QualificationLevel: r.QualificationLevel != null ? Number(r.QualificationLevel) : undefined,
    } as WorkerRow;
  });
}

export function toTasks(rows: any[]): TaskRow[] {
  return rows.map((raw) => {
    const r = mapHeadersSmart(raw, taskHeaderMap);
    return {
      TaskID: String(r.TaskID ?? '').trim(),
      TaskName: String(r.TaskName ?? '').trim(),
      Category: r.Category ?? undefined,
      Duration: Number(r.Duration ?? 0) || 0,
      RequiredSkills: parseList(r.RequiredSkills),
      PreferredPhases: parseNumberList(r.PreferredPhases),
      MaxConcurrent: Number(r.MaxConcurrent ?? 0) || 0,
    } as TaskRow;
  });
}

export function serializeClients(rows: ClientRow[]): string {
  return Papa.unparse(
    rows.map((r) => ({
      ClientID: r.ClientID,
      ClientName: r.ClientName,
      PriorityLevel: r.PriorityLevel,
      RequestedTaskIDs: r.RequestedTaskIDs.join(','),
      GroupTag: r.GroupTag ?? '',
      AttributesJSON: r.AttributesJSON ? JSON.stringify(r.AttributesJSON) : '',
    }))
  );
}

export function serializeWorkers(rows: WorkerRow[]): string {
  return Papa.unparse(
    rows.map((r) => ({
      WorkerID: r.WorkerID,
      WorkerName: r.WorkerName,
      Skills: r.Skills.join(','),
      AvailableSlots: `[${r.AvailableSlots.join(',')}]`,
      MaxLoadPerPhase: r.MaxLoadPerPhase,
      WorkerGroup: r.WorkerGroup ?? '',
      QualificationLevel: r.QualificationLevel ?? '',
    }))
  );
}

export function serializeTasks(rows: TaskRow[]): string {
  return Papa.unparse(
    rows.map((r) => ({
      TaskID: r.TaskID,
      TaskName: r.TaskName,
      Category: r.Category ?? '',
      Duration: r.Duration,
      RequiredSkills: r.RequiredSkills.join(','),
      PreferredPhases: `[${r.PreferredPhases.join(',')}]`,
      MaxConcurrent: r.MaxConcurrent,
    }))
  );
}
