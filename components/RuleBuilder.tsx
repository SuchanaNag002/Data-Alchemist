import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Rule } from '@/types/page';

interface Props {
  onRulesChange: (rules: Rule[]) => void;
}

export const RuleBuilder = ({ onRulesChange }: Props) => {
  const [rules, setRules] = useState<Rule[]>([]);

  const add = (r: Rule) => {
    const next = [...rules, r];
    setRules(next);
    onRulesChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>Create co-run, load limits, phase windows and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Co-run</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="TaskIDs comma separated (e.g. T1,T2)" id="corun" />
            <Button onClick={() => {
              const el = document.getElementById('corun') as HTMLInputElement;
              const tasks = (el.value || '').split(',').map((s) => s.trim()).filter(Boolean);
              if (tasks.length >= 2) add({ type: 'coRun', tasks });
              el.value = '';
            }}>Add</Button>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-medium mb-2">Load-limit</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="WorkerGroup" id="ll-group" />
            <Input placeholder="maxSlotsPerPhase" id="ll-max" />
            <Button onClick={() => {
              const g = (document.getElementById('ll-group') as HTMLInputElement).value.trim();
              const m = Number((document.getElementById('ll-max') as HTMLInputElement).value);
              if (g && m > 0) add({ type: 'loadLimit', target: { kind: 'WorkerGroup', value: g }, maxSlotsPerPhase: m });
              (document.getElementById('ll-group') as HTMLInputElement).value = '';
              (document.getElementById('ll-max') as HTMLInputElement).value = '';
            }}>Add</Button>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-medium mb-2">Phase-window</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="TaskID" id="pw-id" />
            <Input placeholder="allowed phases (e.g. 1-3 or 1,3,5)" id="pw-phases" />
            <Button onClick={() => {
              const id = (document.getElementById('pw-id') as HTMLInputElement).value.trim();
              const val = (document.getElementById('pw-phases') as HTMLInputElement).value.trim();
              const phases = val.includes('-') ? (()=>{ const [a,b]=val.split('-').map(Number); const s=Math.min(a,b), e=Math.max(a,b); return Array.from({length:e-s+1},(_,i)=>s+i); })() : val.split(',').map((x)=>Number(x.trim())).filter(Number.isFinite);
              if (id && phases.length) add({ type: 'phaseWindow', taskId: id, allowedPhases: phases });
              (document.getElementById('pw-id') as HTMLInputElement).value = '';
              (document.getElementById('pw-phases') as HTMLInputElement).value = '';
            }}>Add</Button>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-medium mb-2">Slot-restriction</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="ClientGroup or WorkerGroup" id="sr-group" />
            <Input placeholder="minCommonSlots" id="sr-min" />
            <Button onClick={() => {
              const g = (document.getElementById('sr-group') as HTMLInputElement).value.trim();
              const m = Number((document.getElementById('sr-min') as HTMLInputElement).value);
              if (g && m >= 0) add({ type: 'slotRestriction', target: { kind: 'WorkerGroup', value: g }, minCommonSlots: m });
              (document.getElementById('sr-group') as HTMLInputElement).value = '';
              (document.getElementById('sr-min') as HTMLInputElement).value = '';
            }}>Add</Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Rules added: {rules.length}</div>
      </CardContent>
    </Card>
  );
};