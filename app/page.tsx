"use client"

import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataUploader } from '@/components/DataUploader';
import { Datasets, ClientRow, WorkerRow, TaskRow, Rule, Weights } from '@/types/page';
import { download } from '@/lib/utils/exporters';
import { serializeClients, serializeWorkers, serializeTasks } from '@/lib/utils/parse';
import { validateDatasets, buildErrorIndex } from '@/lib/utils/validation';
import { FileText, Users, CheckSquare, TrendingUp, Settings, BarChart3 } from 'lucide-react';

const Page = () => {
  const [datasets, setDatasets] = useState<Datasets>({ clients: [], workers: [], tasks: [] });
  const [rules, setRules] = useState<Rule[]>([]);
  const [weights, setWeights] = useState<Weights>({ priorityLevel: 50, requestedTaskFulfillment: 50, fairness: 50 });

  const errors = useMemo(() => validateDatasets(datasets, rules), [datasets, rules]);
  const errorIndex = useMemo(() => buildErrorIndex(errors), [errors]);

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
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="data" className="w-full">
            <div className="flex justify-center mb-6 sm:mb-8">
              <TabsList className="bg-white/70 backdrop-blur-sm shadow-lg border gradient-brand-border rounded-xl p-1">
                <TabsTrigger 
                  value="data" 
                  className="data-[state=active]:gradient-brand data-[state=active]:text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                >
                  Data
                </TabsTrigger>
                <TabsTrigger 
                  value="tools" 
                  className="data-[state=active]:gradient-brand data-[state=active]:text-white px-6 py-2 rounded-lg font-medium transition-all duration-300"
                >
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
              
              {datasets.clients.length > 0 && (
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg gradient-brand">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text">
                        Clients Data Loaded
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">
                      {datasets.clients.length} records ready for processing and validation.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {datasets.workers.length > 0 && (
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg gradient-brand">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text">
                        Workers Data Loaded
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">
                      {datasets.workers.length} records ready for processing and validation.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {datasets.tasks.length > 0 && (
                <Card className="gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg gradient-brand">
                        <CheckSquare className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold gradient-brand-text">
                        Tasks Data Loaded
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">
                      {datasets.tasks.length} records ready for processing and validation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="tools" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <Card className="group gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="p-3 rounded-lg gradient-brand mx-auto w-fit">
                        <CheckSquare className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold gradient-brand-text mb-2 text-lg">
                      Validation Tools
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Validate your data integrity and consistency with advanced rules.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="p-3 rounded-lg gradient-brand mx-auto w-fit">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold gradient-brand-text mb-2 text-lg">
                      Rule Builder
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create complex allocation rules using plain English syntax.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group gradient-brand-bg gradient-brand-bg-hover gradient-brand-border border-2 hover:shadow-xl transition-all duration-300 md:col-span-2 xl:col-span-1">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="p-3 rounded-lg gradient-brand mx-auto w-fit">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold gradient-brand-text mb-2 text-lg">
                      Analytics Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze resource allocation patterns and optimization metrics.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default Page;