import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Datasets,
  EntityKind,
  ClientRow,
  WorkerRow,
  TaskRow,
  ValidationError,
} from "@/types/page";
import { DataGrid, ColumnDef } from "@/components/DataGrid";

interface Props {
  datasets: Datasets;
  setDatasets: (d: Datasets) => void;
  errorIndex: Record<string, ValidationError[]>;
}

type EntityRow = ClientRow | WorkerRow | TaskRow;

export const NLQuery = ({ datasets, errorIndex }: Props) => {
  const [query, setQuery] = useState(
    "All tasks with Duration > 1 and Preferred Phases include 2"
  );
  const [target, setTarget] = useState<EntityKind>("tasks");
  const [results, setResults] = useState<EntityRow[]>([]);

  const columns = useMemo<ColumnDef<EntityRow>[]>(() => {
    const base = datasets[target][0];
    return base
      ? Object.keys(base).map((k) => ({
          key: k as keyof EntityRow,
          label: String(k),
        }))
      : [];
  }, [datasets, target]);

  const getRowId = (row: EntityRow) => {
    if ("ClientID" in row) return row.ClientID;
    if ("WorkerID" in row) return row.WorkerID;
    if ("TaskID" in row) return row.TaskID;
    return "";
  };

  function parseAndFilter() {
    const q = query.toLowerCase();
    let arr: EntityRow[] = datasets[target] as EntityRow[];

    const mGt = q.match(/duration\s*>\s*(\d+)/);
    if (mGt && target === "tasks") {
      arr = arr.filter(
        (t: EntityRow) => "Duration" in t && Number(t.Duration) > Number(mGt[1])
      );
    }

    const mLt = q.match(/duration\s*<\s*(\d+)/);
    if (mLt && target === "tasks") {
      arr = arr.filter(
        (t: EntityRow) => "Duration" in t && Number(t.Duration) < Number(mLt[1])
      );
    }

    const mInc = q.match(
      /preferred\s*phases?.*?(?:include|has|having).*?(\d+)/
    );
    if (mInc && target === "tasks") {
      arr = arr.filter(
        (t: EntityRow) =>
          "PreferredPhases" in t &&
          (t.PreferredPhases || []).includes(Number(mInc[1]))
      );
    }

    const mPrior = q.match(
      /priority\s*(?:level)?\s*(?:=|is|>=|>|<=|<)?\s*(\d+)/
    );
    if (mPrior && target === "clients") {
      arr = arr.filter(
        (c: EntityRow) =>
          "PriorityLevel" in c && Number(c.PriorityLevel) >= Number(mPrior[1])
      );
    }

    const mSkill = q.match(/skill\s*(\w+)/);
    if (mSkill && target === "workers") {
      arr = arr.filter(
        (w: EntityRow) => "Skills" in w && (w.Skills || []).includes(mSkill[1])
      );
    }

    setResults(arr);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Natural Language Search</CardTitle>
        <CardDescription>
          {
            'Type a plain-English query. Example: "tasks duration > 1 and preferred phases include 2"'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-3"
          />
          <select
            className="border rounded px-3 py-2 bg-background"
            value={target}
            onChange={(e) => setTarget(e.target.value as EntityKind)}
          >
            <option value="clients">Clients</option>
            <option value="workers">Workers</option>
            <option value="tasks">Tasks</option>
          </select>
        </div>
        <Button onClick={parseAndFilter}>Search</Button>
        {results.length > 0 && (
          <DataGrid
            rows={results}
            setRows={() => {}}
            columns={columns}
            getRowId={getRowId}
            entity={target}
            errorIndex={errorIndex}
          />
        )}
      </CardContent>
    </Card>
  );
};
