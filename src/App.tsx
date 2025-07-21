import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { ModelRegistry } from './components/ModelRegistry';
import { PipelineBuilder } from './components/PipelineBuilder';
import { Analytics } from './components/Analytics';
import { ModelMetadata } from './types';
import { ModelRegistry as ModelRegistryAPI } from './lib/api';
import { Database, GitBranch, ChartBar, Cpu } from '@phosphor-icons/react';
import { toast } from 'sonner';

function App() {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registry');

  useEffect(() => {
    loadModels();
    // Initialize with sample models if none exist
    initializeSampleModels();
  }, []);

  const loadModels = async () => {
    try {
      const allModels = await ModelRegistryAPI.getAllModels();
      setModels(allModels);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSampleModels = async () => {
    const existingModels = await ModelRegistryAPI.getAllModels();
    if (existingModels.length === 0) {
      // Add sample models for demonstration
      const sampleModels = [
        {
          name: 'GPT-4 Turbo',
          description: 'Advanced language model for complex reasoning tasks',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          modelType: 'llm' as const,
          owner: 'OpenAI',
          latency: 2000,
          costPerToken: 0.00003,
          securityPolicy: 'public' as const,
          status: 'online' as const,
          inputSchema: {
            type: 'object',
            properties: {
              messages: { type: 'array' },
              temperature: { type: 'number' }
            }
          },
          outputSchema: {
            type: 'object',
            properties: {
              choices: { type: 'array' }
            }
          },
          tags: ['openai', 'gpt-4', 'language-model'],
        },
        {
          name: 'CLIP Vision',
          description: 'Multi-modal vision and language understanding',
          endpoint: 'https://api.openai.com/v1/embeddings',
          modelType: 'vision' as const,
          owner: 'OpenAI',
          latency: 1500,
          costPerToken: 0.00002,
          securityPolicy: 'public' as const,
          status: 'online' as const,
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string' },
              model: { type: 'string' }
            }
          },
          outputSchema: {
            type: 'object',
            properties: {
              data: { type: 'array' }
            }
          },
          tags: ['openai', 'vision', 'embedding'],
        },
        {
          name: 'Local Whisper',
          description: 'Speech-to-text transcription model',
          endpoint: 'http://localhost:8000/transcribe',
          modelType: 'audio' as const,
          owner: 'Local',
          latency: 3000,
          securityPolicy: 'private' as const,
          status: 'offline' as const,
          inputSchema: {
            type: 'object',
            properties: {
              audio: { type: 'string' },
              format: { type: 'string' }
            }
          },
          outputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              confidence: { type: 'number' }
            }
          },
          tags: ['whisper', 'audio', 'transcription'],
        }
      ];

      for (const model of sampleModels) {
        await ModelRegistryAPI.registerModel(model);
      }

      // Reload models after adding samples
      loadModels();
      toast.success('Sample models added to get you started!');
    }
  };

  const handleModelSelect = (model: ModelMetadata) => {
    setSelectedModel(model.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-muted-foreground">Initializing Internet of Models...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Internet of Models</h1>
                <p className="text-sm text-muted-foreground">
                  Service mesh for AI model orchestration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{models.filter(m => m.status === 'online').length} online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>{models.filter(m => m.status !== 'online').length} offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="registry" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Registry
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Pipeline Builder
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registry">
            <ModelRegistry 
              onModelSelect={handleModelSelect}
              selectedModel={selectedModel}
            />
          </TabsContent>

          <TabsContent value="builder" className="h-[calc(100vh-200px)]">
            <PipelineBuilder models={models} />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics models={models} />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}

export default App;