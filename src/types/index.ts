export interface ModelMetadata {
  id: string;
  name: string;
  owner: string;
  endpoint: string;
  modelType: 'llm' | 'vision' | 'tabular' | 'audio' | 'embedding' | 'custom';
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  latency: number; // ms
  costPerToken?: number;
  securityPolicy: 'public' | 'org-only' | 'private';
  apiKey?: string;
  status: 'online' | 'offline' | 'error';
  healthCheckUrl?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  lastChecked?: string;
}

export interface PipelineNode {
  id: string;
  modelId: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
  owner: string;
  isPublic: boolean;
}

export interface ModelInvocation {
  id: string;
  modelId: string;
  input: any;
  output?: any;
  error?: string;
  latency: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  timestamp: string;
  status: 'pending' | 'success' | 'error';
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  invocations: ModelInvocation[];
  totalLatency?: number;
  totalCost?: number;
}

export interface User {
  id: string;
  login: string;
  email: string;
  avatarUrl: string;
  isOwner: boolean;
}