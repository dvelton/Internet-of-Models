Experimental - not for production use.

# Internet of Models (IoM) OS

A platform for AI model orchestration and composition - think of it as a "service mesh for AI models" that enables model-to-model communication through visual pipeline building and API integration.

## Features

### Core Functionality
- **Model Registration System**: Register any AI model with metadata, schemas, and performance metrics
- **Service Discovery**: Search and filter models by capabilities, latency, cost, and availability  
- **Dynamic Pipeline Orchestration**: Build complex AI workflows with automatic routing and fallback support
- **Visual Pipeline Builder**: Drag-and-drop interface for composing model chains
- **Real-time Testing**: One-click model testing with performance monitoring
- **Analytics Dashboard**: Monitor usage, performance, and costs across all models

### Key Benefits
- **Vendor Agnostic**: Works with OpenAI, HuggingFace, local models, or any HTTP API
- **Developer Focused**: Clean APIs, extensive documentation, and debugging tools
- **Production Ready**: Built-in retry logic, error handling, and security policies
- **Cost Aware**: Track token usage and costs across all model invocations
- **Extensible**: Plugin architecture for custom transformations and integrations

## Stack

- **Frontend**: React 19 + TypeScript, TailwindCSS, shadcn/ui components
- **State Management**: Spark KV store for persistence
- **Visualization**: React Flow for pipeline building, Recharts for analytics
- **Validation**: Zod for schema validation
- **Icons**: Phosphor Icons for consistent UI

## Quick Start

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for external model APIs (optional)

### Getting Started
1. **Launch the Application**: The app loads with sample models to get you started
2. **Register Your Models**: Go to Registry → Register Model to add your AI services
3. **Build Pipelines**: Use the Pipeline Builder to create multi-model workflows  
4. **Monitor Performance**: Check the Analytics dashboard for usage insights

### Sample Model Registration

```json
{
  "name": "GPT-4 Turbo",
  "description": "Advanced language model for complex reasoning",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "modelType": "llm",
  "owner": "OpenAI",
  "latency": 2000,
  "costPerToken": 0.00003,
  "securityPolicy": "public",
  "inputSchema": {
    "type": "object",
    "properties": {
      "messages": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "role": {"type": "string"},
            "content": {"type": "string"}
          }
        }
      },
      "temperature": {"type": "number", "minimum": 0, "maximum": 2}
    },
    "required": ["messages"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "choices": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "message": {
              "type": "object",
              "properties": {
                "content": {"type": "string"}
              }
            }
          }
        }
      }
    }
  },
  "tags": ["openai", "gpt-4", "language-model"],
  "apiKey": "sk-your-api-key-here"
}
```

## Architecture

### Component Structure
```
src/
├── components/
│   ├── ModelRegistry.tsx          # Browse and manage registered models
│   ├── ModelRegistrationForm.tsx  # Register new models with validation
│   ├── ModelTestDialog.tsx        # Test individual models
│   ├── PipelineBuilder.tsx        # Visual pipeline composition
│   ├── PipelineNodes.tsx          # Draggable model nodes
│   └── Analytics.tsx              # Usage metrics and monitoring
├── lib/
│   ├── api.ts                     # Core business logic and model management
│   └── utils.ts                   # Shared utilities
├── types/
│   └── index.ts                   # TypeScript definitions
└── App.tsx                        # Main application shell
```

### Data Model
- **ModelMetadata**: Complete model specification with schemas, performance, and security
- **Pipeline**: Visual workflow definition with nodes and connections  
- **PipelineExecution**: Execution history with performance metrics and costs
- **ModelInvocation**: Individual model call records with latency and token usage

## API Integration

### Model Registration
```typescript
import { ModelRegistry } from './lib/api';

const model = await ModelRegistry.registerModel({
  name: "My Custom Model",
  endpoint: "https://api.example.com/v1/predict",
  modelType: "custom",
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* JSON Schema */ },
  // ... other metadata
});
```

### Model Invocation
```typescript
import { ExecutionEngine } from './lib/api';

const result = await ExecutionEngine.invokeSingleModel(
  "model_123",
  { prompt: "Hello, AI!" }
);
```

### Pipeline Execution
```typescript
const execution = await ExecutionEngine.executePipeline(
  pipeline,
  initialInput
);
```

## Usage Examples

### Example 1: Content Generation Pipeline
1. **Input Processing**: Clean and validate user input
2. **Content Generation**: Generate initial content with GPT-4
3. **Enhancement**: Improve content with specialized model
4. **Quality Check**: Validate output meets requirements

### Example 2: Multi-Modal Analysis
1. **Image Analysis**: Extract features with vision model
2. **Text Generation**: Generate description from features
3. **Translation**: Convert to target language
4. **Summarization**: Create final summary

### Example 3: Data Processing Chain
1. **Data Ingestion**: Validate and clean input data
2. **Analysis**: Run statistical analysis
3. **Prediction**: Generate predictions with ML model  
4. **Reporting**: Format results for presentation

## Monitoring & Analytics

### Key Metrics Tracked
- **Model Performance**: Latency, success rates, error patterns
- **Usage Statistics**: Invocation counts, peak usage times
- **Cost Analysis**: Token usage, estimated costs per model/pipeline
- **Health Monitoring**: Model availability, response times

### Dashboard Features
- Real-time model status indicators
- Historical performance trends
- Cost breakdowns by model and time period
- Usage patterns and optimization recommendations

## Security & Access Control

### Security Policies
- **Public**: Accessible to all users
- **Organization**: Restricted to organization members
- **Private**: Owner-only access

### API Key Management
- Secure storage of model API keys
- Per-model authentication configuration
- CORS-aware request handling

## Contributing

This is an open platform designed for extensibility. Key areas for contribution:

1. **Custom Model Adapters**: Support for new AI service providers
2. **Pipeline Templates**: Pre-built workflows for common use cases
3. **Performance Optimizations**: Caching, batching, and parallelization
4. **UI/UX Improvements**: Better visualization and interaction patterns
5. **Documentation**: Guides, examples, and best practices

## Performance Considerations

### Optimization Strategies
- **Caching**: Intelligent response caching for repeated inputs
- **Load Balancing**: Distribute requests across model replicas
- **Circuit Breaking**: Protect against cascading failures
- **Async Processing**: Non-blocking pipeline execution

### Scaling Guidelines
- Monitor model latencies and adjust routing accordingly
- Use fallback models for high availability
- Implement request queuing for rate-limited APIs
- Consider local model deployment for high-volume use cases
