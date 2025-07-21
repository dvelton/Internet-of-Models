import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelMetadata, PipelineExecution } from '@/types';
import { ModelRegistry } from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendUp, Clock, DollarSign, Cpu, CheckCircle, XCircle, AlertTriangle } from '@phosphor-icons/react';

interface AnalyticsProps {
  models: ModelMetadata[];
}

export function Analytics({ models }: AnalyticsProps) {
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const executionData = (await spark.kv.get<PipelineExecution[]>('executions')) || [];
      setExecutions(executionData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalModels = models.length;
  const onlineModels = models.filter(m => m.status === 'online').length;
  const offlineModels = models.filter(m => m.status === 'offline').length;
  const errorModels = models.filter(m => m.status === 'error').length;
  
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  const failedExecutions = executions.filter(e => e.status === 'failed').length;
  
  const avgLatency = models.length > 0 
    ? Math.round(models.reduce((sum, m) => sum + m.latency, 0) / models.length)
    : 0;
  
  const totalCost = executions.reduce((sum, e) => sum + (e.totalCost || 0), 0);

  // Chart data
  const modelTypeData = models.reduce((acc, model) => {
    const type = model.modelType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modelTypeChartData = Object.entries(modelTypeData).map(([type, count]) => ({
    type: type.toUpperCase(),
    count,
  }));

  const latencyData = models.map(model => ({
    name: model.name.substring(0, 20),
    latency: model.latency,
  }));

  const statusData = [
    { name: 'Online', value: onlineModels, color: '#10b981' },
    { name: 'Offline', value: offlineModels, color: '#6b7280' },
    { name: 'Error', value: errorModels, color: '#ef4444' },
  ];

  const executionTrend = executions
    .slice(-30)
    .map((exec, index) => ({
      day: `Day ${index + 1}`,
      executions: 1,
      success: exec.status === 'completed' ? 1 : 0,
      failed: exec.status === 'failed' ? 1 : 0,
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor model performance and system health
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModels}</div>
            <p className="text-xs text-muted-foreground">
              {onlineModels} online, {offlineModels + errorModels} unavailable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              Across all registered models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {successfulExecutions} successful, {failedExecutions} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated usage cost
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Model Types</CardTitle>
                <CardDescription>Distribution of registered model types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={modelTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Status */}
            <Card>
              <CardHeader>
                <CardTitle>Model Status</CardTitle>
                <CardDescription>Health status of all models</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {statusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Latencies */}
          <Card>
            <CardHeader>
              <CardTitle>Model Latencies</CardTitle>
              <CardDescription>Response times across all models</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="latency" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Registry</CardTitle>
              <CardDescription>Detailed view of all registered models</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Cost/Token</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{model.modelType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {model.status === 'online' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {model.status === 'offline' && (
                            <AlertTriangle className="w-4 h-4 text-gray-600" />
                          )}
                          {model.status === 'error' && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="capitalize">{model.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{model.latency}ms</TableCell>
                      <TableCell className="font-mono">
                        {model.costPerToken ? `$${model.costPerToken.toFixed(6)}` : '-'}
                      </TableCell>
                      <TableCell>{model.owner}</TableCell>
                      <TableCell>
                        {model.lastChecked 
                          ? new Date(model.lastChecked).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent pipeline and model executions</CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pipeline ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.slice(-10).reverse().map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell className="font-mono text-sm">
                          {execution.pipelineId.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              execution.status === 'completed' ? 'default' :
                              execution.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {execution.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(execution.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          {execution.totalLatency ? `${execution.totalLatency}ms` : '-'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {execution.totalCost ? `$${execution.totalCost.toFixed(6)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No executions recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}