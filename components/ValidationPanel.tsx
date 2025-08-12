import { ValidationError } from "@/types/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Props {
  errors: ValidationError[];
}

export const ValidationPanel = ({ errors }: Props) => {
  const counts = errors.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case "warning":
        return (
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        );
      case "info":
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Validation Summary</CardTitle>
        <CardDescription>Immediate feedback on data quality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getSeverityColor("error")}>
            Errors: {counts["error"] || 0}
          </Badge>
          <Badge variant={getSeverityColor("warning")}>
            Warnings: {counts["warning"] || 0}
          </Badge>
          <Badge variant={getSeverityColor("info")}>
            Info: {counts["info"] || 0}
          </Badge>
        </div>

        {/* Error list */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No validation issues found</p>
            </div>
          ) : (
            errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Severity icon */}
                {getSeverityIcon(error.severity)}

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Header with entity and ID */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal capitalize"
                    >
                      {error.entity}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {error.id}
                    </span>
                    {error.field && (
                      <span className="text-muted-foreground">
                        • {error.field}
                      </span>
                    )}
                  </div>

                  {/* Error message */}
                  <p className="text-sm text-foreground leading-relaxed break-words">
                    {error.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {errors.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground text-center">
            Total: {errors.length} validation issue
            {errors.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
