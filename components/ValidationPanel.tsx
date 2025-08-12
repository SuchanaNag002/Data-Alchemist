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
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">
            Errors: {counts["error"] || 0}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Warnings: {counts["warning"] || 0}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Info: {counts["info"] || 0}
          </Badge>
        </div>

        <div className="max-h-64 overflow-auto space-y-3 text-sm">
          {errors.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No validation issues found
            </div>
          ) : (
            errors.map((e, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-3 py-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize font-medium">
                      {e.entity}
                    </span>
                    <span className="font-semibold text-gray-900 truncate">
                      {e.id}
                    </span>
                  </div>
                  {e.field && (
                    <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                      {e.field}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-gray-700 leading-relaxed break-words">
                  {e.message}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
