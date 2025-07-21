import { ModelMetadata, Pipeline, PipelineExecution } from '../types';

export class ModelRegistry {
  static async registerModel(model: Omit<ModelMetadata, 'id' | 'createdAt' | 'lastChecked'>): Promise<ModelMetadata> {
    const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newModel: ModelMetadata = {
      ...model,
      id,
      createdAt: new Date().toISOString(),
    };
    
    const models = await this.getAllModels();
    models.push(newModel);
    await spark.kv.set('models', models);
    
    return newModel;
  }

  static async getAllModels(): Promise<ModelMetadata[]> {
    return (await spark.kv.get<ModelMetadata[]>('models')) || [];
  }

  static async getModelById(id: string): Promise<ModelMetadata | null> {
    const models = await this.getAllModels();
    return models.find(m => m.id === id) || null;
  }

  static async updateModel(id: string, updates: Partial<ModelMetadata>): Promise<ModelMetadata | null> {
    const models = await this.getAllModels();
    const index = models.findIndex(m => m.id === id);
    
    if (index === -1) return null;
    
    models[index] = { ...models[index], ...updates };
    await spark.kv.set('models', models);
    
    return models[index];
  }

  static async deleteModel(id: string): Promise<boolean> {
    const models = await this.getAllModels();
    const filtered = models.filter(m => m.id !== id);
    
    if (filtered.length === models.length) return false;
    
    await spark.kv.set('models', filtered);
    return true;
  }

  static async searchModels(query: {
    type?: string;
    tags?: string[];
    status?: string;
    maxLatency?: number;
  }): Promise<ModelMetadata[]> {
    const models = await this.getAllModels();
    
    return models.filter(model => {
      if (query.type && model.modelType !== query.type) return false;
      if (query.status && model.status !== query.status) return false;
      if (query.maxLatency && model.latency > query.maxLatency) return false;
      if (query.tags && !query.tags.every(tag => model.tags.includes(tag))) return false;
      return true;
    });
  }
}

export class PipelineManager {
  static async savePipeline(pipeline: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pipeline> {
    const id = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newPipeline: Pipeline = {
      ...pipeline,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    const pipelines = await this.getAllPipelines();
    pipelines.push(newPipeline);
    await spark.kv.set('pipelines', pipelines);
    
    return newPipeline;
  }

  static async getAllPipelines(): Promise<Pipeline[]> {
    return (await spark.kv.get<Pipeline[]>('pipelines')) || [];
  }

  static async getPipelineById(id: string): Promise<Pipeline | null> {
    const pipelines = await this.getAllPipelines();
    return pipelines.find(p => p.id === id) || null;
  }

  static async updatePipeline(id: string, updates: Partial<Pipeline>): Promise<Pipeline | null> {
    const pipelines = await this.getAllPipelines();
    const index = pipelines.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    pipelines[index] = { ...pipelines[index], ...updates, updatedAt: new Date().toISOString() };
    await spark.kv.set('pipelines', pipelines);
    
    return pipelines[index];
  }

  static async deletePipeline(id: string): Promise<boolean> {
    const pipelines = await this.getAllPipelines();
    const filtered = pipelines.filter(p => p.id !== id);
    
    if (filtered.length === pipelines.length) return false;
    
    await spark.kv.set('pipelines', filtered);
    return true;
  }
}

export class ExecutionEngine {
  static async invokeSingleModel(modelId: string, input: any): Promise<any> {
    const model = await ModelRegistry.getModelById(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (model.apiKey) {
        headers['Authorization'] = `Bearer ${model.apiKey}`;
      }
      
      const response = await fetch(model.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`Model invocation failed: ${response.statusText}`);
      }
      
      const output = await response.json();
      const latency = Date.now() - startTime;
      
      // Update model latency (rolling average)
      const updatedLatency = Math.round((model.latency + latency) / 2);
      await ModelRegistry.updateModel(modelId, { 
        latency: updatedLatency, 
        status: 'online',
        lastChecked: new Date().toISOString()
      });
      
      return output;
    } catch (error) {
      await ModelRegistry.updateModel(modelId, { 
        status: 'error',
        lastChecked: new Date().toISOString()
      });
      throw error;
    }
  }

  static async executePipeline(pipeline: Pipeline, initialInput: any): Promise<PipelineExecution> {
    const execution: PipelineExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pipelineId: pipeline.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      invocations: [],
    };

    try {
      // Simple sequential execution for now
      // In production, this would need proper DAG traversal
      let currentOutput = initialInput;
      
      for (const node of pipeline.nodes) {
        const invocation = await this.invokeSingleModel(node.modelId, currentOutput);
        currentOutput = invocation;
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.totalLatency = Date.now() - new Date(execution.startedAt).getTime();
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
    }

    // Save execution history
    const executions = (await spark.kv.get<PipelineExecution[]>('executions')) || [];
    executions.push(execution);
    await spark.kv.set('executions', executions);

    return execution;
  }
}