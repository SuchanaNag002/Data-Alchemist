import { useMemo, useState } from "react";
import { Datasets, Rule, ValidationError } from "@/types/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseRulesFromText } from "@/lib/utils/ruleNLP";
import { validateDatasets } from "@/lib/utils/validation";
import { toast } from "sonner";

interface Props {
  datasets: Datasets;
  existingRules: Rule[];
  onAdd: (rules: Rule[]) => void;
}

export const NLRules = ({ datasets, existingRules, onAdd }: Props) => {
  const [text, setText] = useState(
    "T1 and T2 run together.\nLimit WorkerGroup Sales to 2 per phase.\nTask T3 only in phases 1-3."
  );
  const [parsed, setParsed] = useState<Rule[]>([]);
  const [notes, setNotes] = useState<string[]>([]);

  const previewErrors: ValidationError[] = useMemo(() => {
    if (!parsed.length) return [];
    return validateDatasets(datasets, [...existingRules, ...parsed]).filter(
      (e) => e.entity === "rules" || e.entity === "global"
    );
  }, [datasets, existingRules, parsed]);

  const onParse = () => {
    const { rules, notes } = parseRulesFromText(text, datasets);
    setParsed(rules);
    setNotes(notes);
  };

  const onConfirm = () => {
    if (!parsed.length) return;
    onAdd(parsed);
    toast.success("Rules added", {
      description: `${parsed.length} rule(s) merged into your set.`,
    });
    setParsed([]);
    setNotes([]);
    setText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Natural Language Rules</CardTitle>
        <CardDescription>
          Type rules in plain English. Parse, preview, and add.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            "Examples:\n- T1 and T2 run together\n- Limit WorkerGroup Sales to 2 per phase\n- ClientGroup VIP at least 1 common slots\n- Task QA-7 allowed phases [1,3,5]"
          }
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onParse}>
            Parse
          </Button>
          <Button onClick={onConfirm} disabled={!parsed.length}>
            Add to Rules
          </Button>
        </div>

        {!!notes.length && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {notes.map((n, i) => (
              <div key={i}>• {n}</div>
            ))}
          </div>
        )}

        {!!parsed.length && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Parsed rules preview ({parsed.length}):
            </div>
            {parsed.map((r, i) => (
              <div key={i} className="text-sm rounded-md border p-2 bg-card/50">
                <Badge variant="secondary" className="mr-2">
                  {r.type}
                </Badge>
                <code className="break-words">{JSON.stringify(r)}</code>
              </div>
            ))}
          </div>
        )}

        {!!previewErrors.length && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Validation preview:</div>
            {previewErrors.map((e, i) => (
              <div key={i} className="text-sm flex items-start gap-2">
                <Badge variant="secondary">{e.severity}</Badge>
                <span>{e.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
