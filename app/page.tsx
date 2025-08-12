"use client"

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataUploader } from '@/components/DataUploader';
import { DataGrid, ColumnDef } from '@/components/DataGrid';
// import { PrioritizationPanel } from '@/components/PrioritizationPanel';
// import { RuleBuilder } from '@/components/RuleBuilder';
// import { ValidationPanel } from '@/components/ValidationPanel';
// import { NLQuery } from '@/components/NLQuery';
import { Datasets, ClientRow, WorkerRow, TaskRow, Rule, Weights } from '@/types/page';
import { download } from '@/lib/utils/exporters';
import { serializeClients, serializeWorkers, serializeTasks } from '@/lib/utils/parse';
import { validateDatasets, buildErrorIndex } from '@/lib/utils/validation';
import { FileText, Users, CheckSquare, TrendingUp, Settings, Database, MessageSquare, AlertCircle } from 'lucide-react';

const Page = () => {
  const [datasets, setDatasets] = useState<Datasets>({ clients: [], workers: [], tasks: [] });
  const [rules, setRules] = useState<Rule[]>([]);
  const [weights, setWeights] = useState<Weights>({ priorityLevel: 50, requestedTaskFulfillment: 50, fairness: 50 });
  const [activeDataTab, setActiveDataTab] = useState<string>('clients');

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

  const heroTitle = 'Resource Allocation Configurator';
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

  const availableTabs = [
    { key: 'clients', label: 'Clients', icon: Users, hasData: datasets.clients.length > 0 },
    { key: 'workers', label: 'Workers', icon: FileText, hasData: datasets.workers.length > 0 },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, hasData: datasets.tasks.length > 0 },
  ].filter(tab => tab.hasData);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.key === activeDataTab)) {
      setActiveDataTab(availableTabs[0].key);
    }
  }, [availableTabs, activeDataTab]);

  return (
    <main className="min-h-screen gradient-brand-bg">
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 to-yellow-100/20" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight gradient-brand-text leading-tight">
              {heroTitle}
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              {heroSubtitle}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4">
              <Button 
                onClick={exportAll}
                className="gradient-brand text-white border-0 hover:from-orange-800 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl px-6 py-3 text-lg font-medium"
              >
                Export Clean Data + rules.json
              </Button>
              <div className="text-sm text-muted-foreground flex flex-wrap justify-center gap-3 sm:gap-4">
                <a href="/samples/clients.csv" className="underline hover:text-orange-700 transition-colors">clients.csv</a>
                <a href="/samples/workers.csv" className="underline hover:text-orange-700 transition-colors">workers.csv</a>
                <a href="/samples/tasks.csv" className="underline hover:text-orange-700 transition-colors">tasks.csv</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="data" className="w-full">
            <div className="flex justify-center mb-6 sm:mb-8">
              <TabsList className="bg-white/70 backdrop-blur-sm shadow-lg border gradient-brand-border rounded-xl p-1">
                <TabsTrigger 
                  value="data" 
                  className="data-[state=active]:gradient-brand data-[state=active]:text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Data
                </TabsTrigger>
                <TabsTrigger 
                  value="tools" 
                  className="data-[state=active]:gradient-brand data-[state=active]:text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Tools
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="data" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <DataUploader 
                  entity="clients" 
                  onData={(rows) => setDatasets((d) => ({ ...d, clients: rows as ClientRow[] }))} 
                />
                <DataUploader 
                  entity="workers" 
                  onData={(rows) => setDatasets((d) => ({ ...d, workers: rows as WorkerRow[] }))} 
                />
                <DataUploader 
                  entity="tasks" 
                  onData={(rows) => setDatasets((d) => ({ ...d, tasks: rows as TaskRow[] }))} 
                />
              </div>
              
              {availableTabs.length > 0 && (
                <>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-lg p-1 border shadow-sm">
                      {availableTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeDataTab === tab.key;
                        const errorCount = errors.filter(e => e.entity === tab.key).length;
                        
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveDataTab(tab.key)}
                            className={`
                              px-4 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-2
                              ${isActive 
                                ? 'bg-gray-200 text-gray-900 border-b-2 border-orange-500' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }
                            `}
                          >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {errorCount > 0 && (
                              <div className="flex items-center ml-1">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border shadow-lg">
                    <CardContent className="pt-6">
                      {activeDataTab === 'clients' && datasets.clients.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg gradient-brand">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold gradient-brand-text text-lg">
                                Clients ({datasets.clients.length} records)
                              </h3>
                            </div>
                            {errors.filter(e => e.entity === 'clients').length > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errors.filter(e => e.entity === 'clients').length} issues</span>
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden rounded-lg">
                            <DataGrid 
                              rows={datasets.clients} 
                              setRows={(rows) => setDatasets((d) => ({ ...d, clients: rows as ClientRow[] }))} 
                              columns={clientCols} 
                              getRowId={(r) => r.ClientID} 
                              entity="clients" 
                              errorIndex={errorIndex} 
                            />
                          </div>
                        </>
                      )}
                      
                      {activeDataTab === 'workers' && datasets.workers.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg gradient-brand">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold gradient-brand-text text-lg">
                                Workers ({datasets.workers.length} records)
                              </h3>
                            </div>
                            {errors.filter(e => e.entity === 'workers').length > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errors.filter(e => e.entity === 'workers').length} issues</span>
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden rounded-lg">
                            <DataGrid 
                              rows={datasets.workers} 
                              setRows={(rows) => setDatasets((d) => ({ ...d, workers: rows as WorkerRow[] }))} 
                              columns={workerCols} 
                              getRowId={(r) => r.WorkerID} 
                              entity="workers" 
                              errorIndex={errorIndex} 
                            />
                          </div>
                        </>
                      )}
                      
                      {activeDataTab === 'tasks' && datasets.tasks.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg gradient-brand">
                                <CheckSquare className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold gradient-brand-text text-lg">
                                Tasks ({datasets.tasks.length} records)
                              </h3>
                            </div>
                            {errors.filter(e => e.entity === 'tasks').length > 0 && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errors.filter(e => e.entity === 'tasks').length} issues</span>
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden rounded-lg">
                            <DataGrid 
                              rows={datasets.tasks} 
                              setRows={(rows) => setDatasets((d) => ({ ...d, tasks: rows as TaskRow[] }))} 
                              columns={taskCols} 
                              getRowId={(r) => r.TaskID} 
                              entity="tasks" 
                              errorIndex={errorIndex} 
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="tools" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg gradient-brand">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text text-lg">
                        Rule Builder
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {/* <RuleBuilder onRulesChange={setRules} /> */}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg gradient-brand">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text text-lg">
                        Prioritization
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {/* <PrioritizationPanel onChange={setWeights} /> */}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-2 xl:col-span-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg gradient-brand">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text text-lg">
                        Validation
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {/* <ValidationPanel errors={errors} /> */}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg gradient-brand">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold gradient-brand-text text-xl">
                        Natural Language Query
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ask questions about your data or request modifications in plain English
                      </p>
                    </div>
                  </div>
                  {/* <NLQuery 
                    datasets={datasets} 
                    setDatasets={setDatasets} 
                    errorIndex={errorIndex} 
                  /> */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default Page;