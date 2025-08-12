import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ValidationError } from '@/types/page';

export type ColumnDef<T> = {
  key: keyof T;
  label: string;
  type?: 'string' | 'number' | 'list' | 'json';
};

interface DataGridProps<T> {
  rows: T[];
  setRows: (rows: T[]) => void;
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  entity: 'clients' | 'workers' | 'tasks';
  errorIndex?: Record<string, ValidationError[]>; // key: `${entity}:${id}:${field}`
}

export function DataGrid<T extends Record<string, unknown>>({ rows, setRows, columns, getRowId, entity, errorIndex }: DataGridProps<T>) {
  const handleChange = (rowIndex: number, key: keyof T, value: string) => {
    const next = [...rows];
    const row = { ...next[rowIndex] };
    const col = columns.find((c) => c.key === key);
    
    let parsedValue: string | number | string[] | object | null = value;

    switch (col?.type) {
      case 'number':
        // Ensure that an empty string becomes NaN, which can be handled downstream
        parsedValue = value === '' ? NaN : Number(value);
        break;
      case 'list':
        parsedValue = value.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case 'json':
        try { 
          parsedValue = value ? JSON.parse(value) : null; 
        } catch { 
          // If JSON is invalid, you might want to keep the invalid string
          // for the user to correct, or set it to a specific error state.
          // For now, setting to null.
          parsedValue = null; 
        }
        break;
      default:
        parsedValue = value;
    }
    
    next[rowIndex] = { ...row, [key]: parsedValue };
    setRows(next);
  };

  const errorFor = (id: string, field: string) => errorIndex?.[`${entity}:${id}:${field}`] ?? [];

  const header = useMemo(() => (
    <TableHeader>
      <TableRow>
        {columns.map((c) => (
          <TableHead key={String(c.key)} className="whitespace-nowrap">{c.label}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
  ), [columns]);

  return (
    <div className="rounded-md border">
      <Table>
        {header}
        <TableBody>
          {rows.map((row, i) => {
            const id = getRowId(row);
            return (
              <TableRow key={id || i}>
                {columns.map((c) => {
                  const cellErrors = errorFor(id, String(c.key));
                  const hasError = cellErrors.length > 0;
                  const value = row[c.key];
                  const display = c.type === 'list' ? (Array.isArray(value) ? value.join(',') : '')
                    : c.type === 'json' ? (value ? JSON.stringify(value) : '')
                    : String(value ?? '');
                  return (
                    <TableCell key={String(c.key)} className={cn(hasError && 'bg-destructive/10')}>
                      {c.type === 'json' ? (
                        <Textarea value={display} onChange={(e) => handleChange(i, c.key, e.target.value)} />
                      ) : (
                        <Input value={display} onChange={(e) => handleChange(i, c.key, e.target.value)} />
                      )}
                      {hasError && (
                        <div className="mt-1 text-xs text-destructive">
                          {cellErrors.map((e, idx) => (<div key={idx}>{e.message}</div>))}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
