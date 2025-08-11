import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataUploader } from '@/components/DataUploader';
import { DataGrid, ColumnDef } from '@/components/DataGrid';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { ValidationPanel } from '@/components/ValidationPanel';
import { NLQuery } from '@/components/NLQuery';
import { Datasets, ClientRow, WorkerRow, TaskRow, Rule, Weights } from '@/lib/types';
import { download } from '@/utils/exporters';
import { serializeClients, serializeWorkers, serializeTasks } from '@/utils/parse';
import { validateDatasets, buildErrorIndex } from '@/utils/validation';

const Index = () => {
  const [datasets, setDatasets] = useState<Datasets>({ clients: [], workers: [], tasks: [] });
  const [rules, setRules] = useState<Rule[]>([]);
  const [weights, setWeights] = useState<Weights>({ priorityLevel: 50, requestedTaskFulfillment: 50, fairness: 50 });

  const errors = useMemo(() => validateDatasets(datasets, rules), [datasets, rules]);
  const errorIndex = useMemo(() => buildErrorIndex(errors), [errors]);

  const clientCols: ColumnDef<ClientRow>[] = [
    { key: 'ClientID', label: 'ClientID' },
    { key: 'ClientName', label: 'ClientName' },
    { key: 'PriorityLevel', label: 'PriorityLevel', type: 'number' },
    { key: 'RequestedTaskIDs', label: 'RequestedTaskIDs', type: 'list' },
    { key: 'GroupTag', label: 'GroupTag' },
    { key: 'AttributesJSON', label: 'AttributesJSON', type: 'json' },
  ];
  const workerCols: ColumnDef<WorkerRow>[] = [
    { key: 'WorkerID', label: 'WorkerID' },
    { key: 'WorkerName', label: 'WorkerName' },
    { key: 'Skills', label: 'Skills', type: 'list' },
    { key: 'AvailableSlots', label: 'AvailableSlots', type: 'list' },
    { key: 'MaxLoadPerPhase', label: 'MaxLoadPerPhase', type: 'number' },
    { key: 'WorkerGroup', label: 'WorkerGroup' },
    { key: 'QualificationLevel', label: 'QualificationLevel', type: 'number' },
  ];
  const taskCols: ColumnDef<TaskRow>[] = [
    { key: 'TaskID', label: 'TaskID' },
    { key: 'TaskName', label: 'TaskName' },
    { key: 'Category', label: 'Category' },
    { key: 'Duration', label: 'Duration', type: 'number' },
    { key: 'RequiredSkills', label: 'RequiredSkills', type: 'list' },
    { key: 'PreferredPhases', label: 'PreferredPhases', type: 'list' },
    { key: 'MaxConcurrent', label: 'MaxConcurrent', type: 'number' },
  ];

  const heroTitle = 'Resource-Allocation Configurator';
  const heroSubtitle = 'Upload messy spreadsheets, validate instantly, build rules in plain English, and export a clean package.';

  useEffect(() => {
    document.title = 'Resource Allocation Configurator | Data Alchemist';
  }, []);

  const exportAll = () => {
    download('clients.cleaned.csv', serializeClients(datasets.clients), 'text/csv;charset=utf-8');
    download('workers.cleaned.csv', serializeWorkers(datasets.workers), 'text/csv;charset=utf-8');
    download('tasks.cleaned.csv', serializeTasks(datasets.tasks), 'text/csv;charset=utf-8');
    download('rules.json', JSON.stringify({ rules, weights }, null, 2), 'application/json');
  };

  return (
    <main>
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-70 pointer-events-none hero-bg" />
        <div className="container relative grid place-items-center text-center">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{heroTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{heroSubtitle}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={exportAll}>Export Clean Data + rules.json</Button>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                <a href="/samples/clients.csv" className="underline">clients.csv</a>
                <a href="/samples/workers.csv" className="underline">workers.csv</a>
                <a href="/samples/tasks.csv" className="underline">tasks.csv</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-20 space-y-10">
        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DataUploader entity="clients" onData={(rows)=> setDatasets((d)=> ({...d, clients: rows as ClientRow[]}))} />
              <DataUploader entity="workers" onData={(rows)=> setDatasets((d)=> ({...d, workers: rows as WorkerRow[]}))} />
              <DataUploader entity="tasks" onData={(rows)=> setDatasets((d)=> ({...d, tasks: rows as TaskRow[]}))} />
            </div>
            {datasets.clients.length > 0 && (
              <Card><CardContent className="pt-6"><h3 className="font-semibold mb-2">Clients</h3>
                <DataGrid rows={datasets.clients} setRows={(rows)=> setDatasets((d)=> ({...d, clients: rows as ClientRow[]}))} columns={clientCols} getRowId={(r)=>r.ClientID} entity="clients" errorIndex={errorIndex} />
              </CardContent></Card>
            )}
            {datasets.workers.length > 0 && (
              <Card><CardContent className="pt-6"><h3 className="font-semibold mb-2">Workers</h3>
                <DataGrid rows={datasets.workers} setRows={(rows)=> setDatasets((d)=> ({...d, workers: rows as WorkerRow[]}))} columns={workerCols} getRowId={(r)=>r.WorkerID} entity="workers" errorIndex={errorIndex} />
              </CardContent></Card>
            )}
            {datasets.tasks.length > 0 && (
              <Card><CardContent className="pt-6"><h3 className="font-semibold mb-2">Tasks</h3>
                <DataGrid rows={datasets.tasks} setRows={(rows)=> setDatasets((d)=> ({...d, tasks: rows as TaskRow[]}))} columns={taskCols} getRowId={(r)=>r.TaskID} entity="tasks" errorIndex={errorIndex} />
              </CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="tools" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <RuleBuilder onRulesChange={setRules} />
              <PrioritizationPanel onChange={setWeights} />
              <ValidationPanel errors={errors} />
            </div>
            <NLQuery datasets={datasets} setDatasets={setDatasets} errorIndex={errorIndex} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Index;
