# REST API Documentation

The Internet of Models (IoM) OS provides a comprehensive JavaScript/TypeScript API for programmatic model management and pipeline orchestration. All APIs are built on the Spark KV persistence layer.

## 🏗️ Core APIs

### ModelRegistry Class

#### `registerModel(modelData)`
Register a new model in the service registry.

**Parameters:**
```typescript
interface ModelRegistrationData {
  name: string;                    // Display name for the model
  description?: string;            // Optional description
  endpoint: string;               // HTTP endpoint for model invocation
  modelType: 'llm' | 'vision' | 'tabular' | 'audio' | 'embedding' | 'custom';
  owner: string;                  // Model owner/maintainer
  latency: number;               // Expected latency in milliseconds  
  costPerToken?: number;         // Cost per token (optional)
  securityPolicy: 'public' | 'org-only' | 'private';
  apiKey?: string;               // API key for authenticated models
  healthCheckUrl?: string;       // Health check endpoint
  inputSchema: Record<string, any>;   // JSON Schema for input validation
  outputSchema: Record<string, any>;  // JSON Schema for output validation
  tags: string[];                // Searchable tags
}
```

**Returns:** `Promise<ModelMetadata>` - Complete model object with generated ID

**Example:**
```typescript
import { ModelRegistry } from './lib/api';

const newModel = await ModelRegistry.registerModel({
  name: "Custom GPT Model",
  endpoint: "https://api.openai.com/v1/chat/completions",
  modelType: "llm",
  owner: "team@company.com",
  latency: 2000,
  costPerToken: 0.00003,
  securityPolicy: "public",
  inputSchema: {
    type: "object",
    properties: {
      messages: { type: "array" },
      temperature: { type: "number", minimum: 0, maximum: 2 }
    },
    required: ["messages"]
  },
  outputSchema: {
    type: "object", 
    properties: {
      choices: { type: "array" }
    }
  },
  tags: ["openai", "gpt", "language-model"],
  apiKey: "sk-your-key-here"
});
```

#### `getAllModels()`
Retrieve all registered models.

**Returns:** `Promise<ModelMetadata[]>`

**Example:**
```typescript
const models = await ModelRegistry.getAllModels();
console.log(`Found ${models.length} registered models`);
```

#### `getModelById(id)`
Get a specific model by ID.

**Parameters:**
- `id: string` - Model ID

**Returns:** `Promise<ModelMetadata | null>`

**Example:**
```typescript
const model = await ModelRegistry.getModelById("model_123");
if (model) {
  console.log(`Model: ${model.name}, Status: ${model.status}`);
}
```

#### `updateModel(id, updates)`
Update model metadata.

**Parameters:**
- `id: string` - Model ID
- `updates: Partial<ModelMetadata>` - Fields to update

**Returns:** `Promise<ModelMetadata | null>`

**Example:**
```typescript
const updatedModel = await ModelRegistry.updateModel("model_123", {
  status: "online",
  latency: 1800,
  lastChecked: new Date().toISOString()
});
```

#### `deleteModel(id)`
Remove a model from the registry.

**Parameters:**
- `id: string` - Model ID

**Returns:** `Promise<boolean>` - True if deleted successfully

**Example:**
```typescript
const deleted = await ModelRegistry.deleteModel("model_123");
if (deleted) {
  console.log("Model deleted successfully");
}
```

#### `searchModels(query)`
Search models with filters.

**Parameters:**
```typescript
interface SearchQuery {
  type?: string;        // Model type filter
  tags?: string[];      // Must include all tags
  status?: string;      // Status filter  
  maxLatency?: number;  // Maximum latency in ms
}
```

**Returns:** `Promise<ModelMetadata[]>`

**Example:**
```typescript
const fastLLMs = await ModelRegistry.searchModels({
  type: "llm",
  status: "online", 
  maxLatency: 2000,
  tags: ["gpt"]
});
```

### PipelineManager Class

#### `savePipeline(pipelineData)`
Save a pipeline definition.

**Parameters:**
```typescript
interface PipelineData {
  name: string;
  description?: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  owner: string;
  isPublic: boolean;
}
```

**Returns:** `Promise<Pipeline>` - Complete pipeline with generated ID

**Example:**
```typescript
import { PipelineManager } from './lib/api';

const pipeline = await PipelineManager.savePipeline({
  name: "Content Generation Flow",
  description: "Generate and enhance content using multiple models",
  nodes: [
    {
      id: "node1",
      modelId: "model_123", 
      position: { x: 100, y: 100 },
      config: { temperature: 0.7 }
    },
    {
      id: "node2",
      modelId: "model_456",
      position: { x: 300, y: 100 },
      config: { maxTokens: 500 }
    }
  ],
  edges: [
    {
      id: "edge1",
      source: "node1",
      target: "node2"
    }
  ],
  owner: "user@company.com",
  isPublic: true
});
```

#### `getAllPipelines()`
Get all saved pipelines.

**Returns:** `Promise<Pipeline[]>`

#### `getPipelineById(id)`
Get a specific pipeline.

**Parameters:**
- `id: string` - Pipeline ID

**Returns:** `Promise<Pipeline | null>`

#### `updatePipeline(id, updates)`
Update pipeline definition.

**Parameters:**
- `id: string` - Pipeline ID  
- `updates: Partial<Pipeline>` - Fields to update

**Returns:** `Promise<Pipeline | null>`

#### `deletePipeline(id)`
Delete a pipeline.

**Parameters:**
- `id: string` - Pipeline ID

**Returns:** `Promise<boolean>`

### ExecutionEngine Class

#### `invokeSingleModel(modelId, input)`
Execute a single model with the provided input.

**Parameters:**
- `modelId: string` - Registered model ID
- `input: any` - Input data (will be validated against model's input schema)

**Returns:** `Promise<any>` - Model output

**Example:**
```typescript
import { ExecutionEngine } from './lib/api';

try {
  const result = await ExecutionEngine.invokeSingleModel(
    "model_123",
    {
      messages: [
        { role: "user", content: "Hello, how are you?" }
      ],
      temperature: 0.7
    }
  );
  
  console.log("Model response:", result.choices[0].message.content);
} catch (error) {
  console.error("Model invocation failed:", error.message);
}
```

#### `executePipeline(pipeline, initialInput)`
Execute a complete pipeline.

**Parameters:**
- `pipeline: Pipeline` - Pipeline definition
- `initialInput: any` - Starting input for the pipeline

**Returns:** `Promise<PipelineExecution>` - Execution result with full trace

**Example:**
```typescript
const execution = await ExecutionEngine.executePipeline(
  pipeline,
  { prompt: "Write a blog post about AI" }
);

console.log(`Pipeline ${execution.status}`);
console.log(`Total latency: ${execution.totalLatency}ms`);
console.log(`Cost: $${execution.totalCost}`);
```

## 🔧 Utility Functions

### Schema Validation

```typescript
// Validate input against model schema
function validateInput(input: any, schema: Record<string, any>): boolean {
  // Returns true if input matches schema
}

// Validate output against model schema  
function validateOutput(output: any, schema: Record<string, any>): boolean {
  // Returns true if output matches schema
}
```

### Model Health Checking

```typescript
// Check if a model is responding
async function healthCheck(model: ModelMetadata): Promise<boolean> {
  try {
    const response = await fetch(model.healthCheckUrl || model.endpoint, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Cost Estimation

```typescript
// Estimate cost for a model invocation
function estimateCost(model: ModelMetadata, tokenCount: number): number {
  return (model.costPerToken || 0) * tokenCount;
}

// Calculate total pipeline cost
function calculatePipelineCost(execution: PipelineExecution): number {
  return execution.invocations.reduce((total, inv) => {
    return total + (inv.tokenUsage ? inv.tokenUsage.total * 0.00001 : 0);
  }, 0);
}
```

## 🎯 Usage Patterns

### Model Registration Workflow

```typescript
// 1. Register model
const model = await ModelRegistry.registerModel({
  name: "Custom Model",
  endpoint: "https://api.example.com/predict",
  modelType: "custom",
  // ... other config
});

// 2. Test model
try {
  const testResult = await ExecutionEngine.invokeSingleModel(
    model.id,
    { test: "input" }
  );
  console.log("Model test successful:", testResult);
  
  // 3. Update status to online
  await ModelRegistry.updateModel(model.id, { status: "online" });
} catch (error) {
  // 4. Mark as error if test fails
  await ModelRegistry.updateModel(model.id, { status: "error" });
}
```

### Pipeline Building Workflow

```typescript
// 1. Get available models
const models = await ModelRegistry.getAllModels();
const onlineModels = models.filter(m => m.status === 'online');

// 2. Create pipeline
const pipeline = await PipelineManager.savePipeline({
  name: "Multi-step Analysis",
  nodes: onlineModels.slice(0, 3).map((model, index) => ({
    id: `node${index}`,
    modelId: model.id,
    position: { x: index * 200, y: 100 },
    config: {}
  })),
  edges: [
    { id: "e1", source: "node0", target: "node1" },
    { id: "e2", source: "node1", target: "node2" }
  ],
  owner: "system",
  isPublic: false
});

// 3. Execute pipeline
const execution = await ExecutionEngine.executePipeline(
  pipeline,
  { input: "Initial data" }
);
```

### Analytics and Monitoring

```typescript
// Get execution history
const executions = await spark.kv.get('executions') || [];

// Calculate metrics
const totalExecutions = executions.length;
const successRate = executions.filter(e => e.status === 'completed').length / totalExecutions;
const averageLatency = executions.reduce((sum, e) => sum + (e.totalLatency || 0), 0) / totalExecutions;

// Model performance analysis
const models = await ModelRegistry.getAllModels();
const modelPerformance = models.map(model => ({
  id: model.id,
  name: model.name,
  avgLatency: model.latency,
  status: model.status,
  lastChecked: model.lastChecked
}));
```

## 🚦 Error Handling

### Common Error Types

```typescript
// Model not found
try {
  await ModelRegistry.getModelById("invalid_id");
} catch (error) {
  // Returns null, no exception thrown
}

// Model invocation failure
try {
  await ExecutionEngine.invokeSingleModel("model_id", invalidInput);
} catch (error) {
  console.error("Invocation failed:", error.message);
  // Possible causes: model offline, invalid input, network error
}

// Schema validation error  
try {
  await ModelRegistry.registerModel({
    // Missing required fields
  });
} catch (error) {
  console.error("Registration failed:", error.message);
}
```

### Retry Logic

```typescript
async function invokeWithRetry(modelId: string, input: any, maxRetries = 3): Promise<any> {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await ExecutionEngine.invokeSingleModel(modelId, input);
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
}
```

## 📊 Event System

### Model Events

```typescript
// Listen for model status changes
const handleModelUpdate = (model: ModelMetadata) => {
  console.log(`Model ${model.name} status: ${model.status}`);
};

// Pipeline execution events  
const handleExecutionComplete = (execution: PipelineExecution) => {
  console.log(`Pipeline completed in ${execution.totalLatency}ms`);
};
```

This API documentation provides comprehensive coverage of all available functionality for integrating with and extending the Internet of Models platform.