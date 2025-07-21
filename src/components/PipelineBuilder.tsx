import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ModelMetadata, Pipeline } from '@/types';
import { ModelRegistry, PipelineManager, ExecutionEngine } from '@/lib/api';
import { Play, Save, Plus, Cpu, Eye, ChatCircle, Waveform, Database, Gear } from '@phosphor-icons/react';
import { ModelNode } from './PipelineNodes';
import toast from 'sonner';

const MODEL_TYPE_ICONS = {
  llm: ChatCircle,
  vision: Eye,
  tabular: Database,
  audio: Waveform,
  embedding: Cpu,
  custom: Gear,
};

const nodeTypes: NodeTypes = {
  modelNode: ModelNode,
};

interface PipelineBuilderProps {
  models: ModelMetadata[];
}

export function PipelineBuilder({ models }: PipelineBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedModel, setSelectedModel] = useState<ModelMetadata | null>(null);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPipelines, setSavedPipelines] = useState<Pipeline[]>([]);

  useEffect(() => {
    loadSavedPipelines();
  }, []);

  const loadSavedPipelines = async () => {
    try {
      const pipelines = await PipelineManager.getAllPipelines();
      setSavedPipelines(pipelines);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addModelNode = (model: ModelMetadata) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const newNode: Node = {
      id: `${model.id}-${Date.now()}`,
      type: 'modelNode',
      position,
      data: {
        model,
        onConfigChange: (nodeId: string, config: any) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, config } }
                : node
            )
          );
        },
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const savePipeline = async () => {
    if (!pipelineName.trim()) {
      toast.error('Pipeline name is required');
      return;
    }

    try {
      setIsSaving(true);
      
      const user = await spark.user();
      const pipeline = await PipelineManager.savePipeline({
        name: pipelineName,
        description: pipelineDescription,
        nodes: nodes.map(node => ({
          id: node.id,
          modelId: node.data.model.id,
          position: node.position,
          config: node.data.config || {},
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
        owner: user.login,
        isPublic: true,
      });

      toast.success('Pipeline saved successfully');
      setSavedPipelines(prev => [...prev, pipeline]);
      setPipelineName('');
      setPipelineDescription('');
    } catch (error) {
      toast.error('Failed to save pipeline');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const executePipeline = async () => {
    if (nodes.length === 0) {
      toast.error('No models in pipeline');
      return;
    }

    const testInput = {
      prompt: "Hello, this is a test input for the pipeline execution."
    };

    try {
      setIsExecuting(true);
      
      // Create a temporary pipeline for execution
      const user = await spark.user();
      const tempPipeline: Pipeline = {
        id: `temp-${Date.now()}`,
        name: 'Test Execution',
        nodes: nodes.map(node => ({
          id: node.id,
          modelId: node.data.model.id,
          position: node.position,
          config: node.data.config || {},
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: user.login,
        isPublic: false,
      };

      const execution = await ExecutionEngine.executePipeline(tempPipeline, testInput);
      
      if (execution.status === 'completed') {
        toast.success('Pipeline executed successfully');
      } else {
        toast.error('Pipeline execution failed');
      }
    } catch (error) {
      toast.error('Failed to execute pipeline');
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const loadPipeline = (pipeline: Pipeline) => {
    const loadedNodes: Node[] = pipeline.nodes.map(pipelineNode => {
      const model = models.find(m => m.id === pipelineNode.modelId);
      if (!model) return null;

      return {
        id: pipelineNode.id,
        type: 'modelNode',
        position: pipelineNode.position,
        data: {
          model,
          config: pipelineNode.config,
          onConfigChange: (nodeId: string, config: any) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, config } }
                  : node
              )
            );
          },
        },
      };
    }).filter(Boolean) as Node[];

    const loadedEdges: Edge[] = pipeline.edges.map(pipelineEdge => ({
      id: pipelineEdge.id,
      source: pipelineEdge.source,
      target: pipelineEdge.target,
      sourceHandle: pipelineEdge.sourceHandle,
      targetHandle: pipelineEdge.targetHandle,
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setPipelineName(pipeline.name);
    setPipelineDescription(pipeline.description || '');
  };

  const clearPipeline = () => {
    setNodes([]);
    setEdges([]);
    setPipelineName('');
    setPipelineDescription('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline Builder</h1>
            <p className="text-muted-foreground">
              Create AI workflows by connecting models visually
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={clearPipeline}
              variant="outline"
              disabled={nodes.length === 0}
            >
              Clear
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Load Pipeline</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Saved Pipeline</DialogTitle>
                  <DialogDescription>
                    Select a pipeline to load into the builder
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedPipelines.map((pipeline) => (
                    <Card
                      key={pipeline.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => loadPipeline(pipeline)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{pipeline.name}</CardTitle>
                        {pipeline.description && (
                          <p className="text-sm text-muted-foreground">
                            {pipeline.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          {pipeline.nodes.length} nodes • Created {new Date(pipeline.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {savedPipelines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No saved pipelines
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={nodes.length === 0 || isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Pipeline</DialogTitle>
                  <DialogDescription>
                    Save this pipeline for reuse
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pipeline Name</Label>
                    <Input
                      id="name"
                      value={pipelineName}
                      onChange={(e) => setPipelineName(e.target.value)}
                      placeholder="My AI Pipeline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={pipelineDescription}
                      onChange={(e) => setPipelineDescription(e.target.value)}
                      placeholder="What does this pipeline do..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={savePipeline} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Pipeline'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={executePipeline}
              disabled={nodes.length === 0 || isExecuting}
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Model Panel */}
        <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Available Models</h3>
          <div className="space-y-2">
            {models.filter(m => m.status === 'online').map((model) => {
              const IconComponent = MODEL_TYPE_ICONS[model.modelType];
              return (
                <Card
                  key={model.id}
                  className="cursor-pointer hover:bg-background transition-colors"
                  onClick={() => addModelNode(model)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.modelType} • {model.latency}ms
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {models.filter(m => m.status === 'online').length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No online models available
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-muted-foreground text-lg mb-2">
                  Start building your pipeline
                </div>
                <div className="text-sm text-muted-foreground">
                  Click on models from the sidebar to add them to the canvas
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}