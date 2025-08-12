import { ValidationError } from "@/types/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  errors: ValidationError[];
}

export const ValidationPanel = ({ errors }: Props) => {
  const counts = errors.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Summary</CardTitle>
        <CardDescription>Immediate feedback on data quality</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary">Errors: {counts["error"] || 0}</Badge>
          <Badge variant="secondary">Warnings: {counts["warning"] || 0}</Badge>
          <Badge variant="secondary">Info: {counts["info"] || 0}</Badge>
        </div>
        <div className="max-h-102 overflow-auto space-y-2 text-sm">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="min-w-16 text-muted-foreground capitalize">
                {e.entity}
              </span>
              <span className="font-medium">{e.id}</span>
              {e.field && (
                <span className="text-muted-foreground">· {e.field}</span>
              )}
              <span>— {e.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
