import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Weights } from "@/types/page";

interface Props {
  onChange: (w: Weights) => void;
}

export const PrioritizationPanel = ({ onChange }: Props) => {
  const [w, setW] = useState<Weights>({
    priorityLevel: 50,
    requestedTaskFulfillment: 50,
    fairness: 50,
    cost: 50,
    speed: 50,
  });

  const set = (k: keyof Weights, v: number) => {
    const next = { ...w, [k]: v };
    setW(next);
    onChange(next);
  };

  const setWAndNotify = (nw: Weights) => {
    setW(nw);
    onChange(nw);
  };

  const preset = (name: "fulfillment" | "fair" | "fast") => {
    if (name === "fulfillment") {
      setWAndNotify({
        priorityLevel: 70,
        requestedTaskFulfillment: 90,
        fairness: 40,
        cost: 50,
        speed: 40,
      });
    }
    if (name === "fair") {
      setWAndNotify({
        priorityLevel: 50,
        requestedTaskFulfillment: 60,
        fairness: 90,
        cost: 50,
        speed: 50,
      });
    }
    if (name === "fast") {
      setWAndNotify({
        priorityLevel: 60,
        requestedTaskFulfillment: 50,
        fairness: 40,
        cost: 50,
        speed: 90,
      });
    }
  };

  const Row = ({ label, k }: { label: string; k: keyof Weights }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md min-w-[3rem] text-center">
          {w[k]}
        </span>
      </div>
      <div className="px-1">
        <Slider
          value={[w[k] as number]}
          onValueChange={(val) => set(k, val[0] as number)}
          max={100}
          min={0}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Row label="Priority Level" k="priorityLevel" />
        <Row label="Task Fulfillment" k="requestedTaskFulfillment" />
        <Row label="Fairness" k="fairness" />
        <Row label="Cost" k="cost" />
        <Row label="Speed" k="speed" />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Quick Presets
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => preset("fulfillment")}
            className="text-xs px-2 py-1 h-8 flex-1 min-w-0"
          >
            <span className="truncate">Maximize Fulfillment</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => preset("fair")}
            className="text-xs px-2 py-1 h-8 flex-1 min-w-0"
          >
            <span className="truncate">Fair Distribution</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => preset("fast")}
            className="text-xs px-2 py-1 h-8 flex-1 min-w-0"
          >
            <span className="truncate">Minimize Time</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
