import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Weights } from '@/types/page';

interface Props {
  onChange: (w: Weights) => void;
}

export const PrioritizationPanel = ({ onChange }: Props) => {
  const [w, setW] = useState<Weights>({ priorityLevel: 50, requestedTaskFulfillment: 50, fairness: 50, cost: 50, speed: 50 });

  const set = (k: keyof Weights, v: number) => {
    const next = { ...w, [k]: v };
    setW(next);
    onChange(next);
  };

  const preset = (name: 'fulfillment' | 'fair' | 'fast') => {
    if (name === 'fulfillment') setWAndNotify({ priorityLevel: 70, requestedTaskFulfillment: 90, fairness: 40, cost: 50, speed: 40 });
    if (name === 'fair') setWAndNotify({ priorityLevel: 50, requestedTaskFulfillment: 60, fairness: 90, cost: 50, speed: 50 });
    if (name === 'fast') setWAndNotify({ priorityLevel: 60, requestedTaskFulfillment: 50, fairness: 40, cost: 50, speed: 90 });
  };

  const setWAndNotify = (nw: Weights) => { setW(nw); onChange(nw); };

  const Row = ({ label, k }: { label: string; k: keyof Weights }) => (
    <div className="grid grid-cols-3 gap-3 items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="col-span-2"><Slider value={[w[k] as number]} onValueChange={(val) => set(k, val[0] as number)} max={100} step={1} /></div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prioritization & Weights</CardTitle>
        <CardDescription>Adjust relative importance of criteria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Priority Level" k="priorityLevel" />
        <Row label="Requested Task Fulfillment" k="requestedTaskFulfillment" />
        <Row label="Fairness" k="fairness" />
        <Row label="Cost" k="cost" />
        <Row label="Speed" k="speed" />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => preset('fulfillment')}>Maximize Fulfillment</Button>
          <Button variant="secondary" onClick={() => preset('fair')}>Fair Distribution</Button>
          <Button variant="secondary" onClick={() => preset('fast')}>Minimize Time</Button>
        </div>
      </CardContent>
    </Card>
  );
};