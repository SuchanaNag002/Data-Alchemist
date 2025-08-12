import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import {
  parseCSV,
  parseXLSX,
  toClients,
  toWorkers,
  toTasks,
} from "@/lib/utils/parse";
import { ClientRow, WorkerRow, TaskRow, EntityKind } from "@/types/page";
import { Upload, Users, FileText, CheckSquare } from "lucide-react";

interface Props {
  entity: EntityKind;
  onData: (rows: ClientRow[] | WorkerRow[] | TaskRow[]) => void;
}

export const DataUploader = ({ entity, onData }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      const text = await file.text();
      const rows = parseCSV(text);
      emit(rows);
    } else if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const rows = parseXLSX(buf);
      emit(rows);
    }
  };

  const emit = (rows: Record<string, string | number>[]) => {
    switch (entity) {
      case "clients":
        onData(toClients(rows));
        break;
      case "workers":
        onData(toWorkers(rows));
        break;
      case "tasks":
        onData(toTasks(rows));
        break;
    }
  };

  const getIcon = () => {
    switch (entity) {
      case "clients":
        return <Users className="w-5 h-5" />;
      case "workers":
        return <FileText className="w-5 h-5" />;
      case "tasks":
        return <CheckSquare className="w-5 h-5" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 capitalize">
          <div className="p-2 rounded-lg gradient-brand text-white">
            {getIcon()}
          </div>
          <span className="gradient-brand-text font-bold">{entity} Upload</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Upload CSV or XLSX. Smart header mapping is applied.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="w-full gradient-brand text-white border-0 hover:from-orange-800 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl relative z-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
