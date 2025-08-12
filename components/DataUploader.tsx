import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';
import { parseCSV, parseXLSX, toClients, toWorkers, toTasks } from '@/lib/utils/parse';
import { ClientRow, WorkerRow, TaskRow, EntityKind } from '@/types/page';
import { Upload } from 'lucide-react';

interface Props {
  entity: EntityKind;
  onData: (rows: ClientRow[] | WorkerRow[] | TaskRow[]) => void;
}

export const DataUploader = ({ entity, onData }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      const text = await file.text();
      const rows = parseCSV(text);
      emit(rows);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const rows = parseXLSX(buf);
      emit(rows);
    }
  };

  const emit = (rows: any[]) => {
    switch (entity) {
      case 'clients':
        onData(toClients(rows));
        break;
      case 'workers':
        onData(toWorkers(rows));
        break;
      case 'tasks':
        onData(toTasks(rows));
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 capitalize">{entity} Upload</CardTitle>
        <CardDescription>Upload CSV or XLSX. Smart header mapping is applied.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
        <Button variant="secondary" onClick={() => fileRef.current?.click()} className="flex items-center gap-2"><Upload className="w-4 h-4"/>Choose</Button>
      </CardContent>
    </Card>
  );
};