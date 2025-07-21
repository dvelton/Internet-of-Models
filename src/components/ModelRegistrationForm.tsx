import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelMetadata } from '@/types';
import { ModelRegistry } from '@/lib/api';
import { X, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ModelRegistrationFormProps {
  onSuccess: (model: ModelMetadata) => void;
}

export function ModelRegistrationForm({ onSuccess }: ModelRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [inputSchema, setInputSchema] = useState('{\n  "type": "object",\n  "properties": {\n    "prompt": {\n      "type": "string"\n    }\n  },\n  "required": ["prompt"]\n}');
  const [outputSchema, setOutputSchema] = useState('{\n  "type": "object",\n  "properties": {\n    "response": {\n      "type": "string"\n    }\n  }\n}');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      endpoint: '',
      modelType: 'llm',
      owner: '',
      latency: 1000,
      costPerToken: 0,
      securityPolicy: 'public',
      apiKey: '',
      healthCheckUrl: '',
    }
  });

  const securityPolicy = watch('securityPolicy');
  const modelType = watch('modelType');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateJSON = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const onSubmit = async (data: any) => {
    if (!validateJSON(inputSchema)) {
      toast.error('Invalid input schema JSON');
      return;
    }

    if (!validateJSON(outputSchema)) {
      toast.error('Invalid output schema JSON');
      return;
    }

    setIsLoading(true);

    try {
      const modelData = {
        ...data,
        inputSchema: JSON.parse(inputSchema),
        outputSchema: JSON.parse(outputSchema),
        tags,
        status: 'offline' as const,
        costPerToken: data.costPerToken || undefined,
        apiKey: data.apiKey || undefined,
        healthCheckUrl: data.healthCheckUrl || undefined,
      };

      const newModel = await ModelRegistry.registerModel(modelData);
      toast.success('Model registered successfully');
      onSuccess(newModel);
      reset();
      setTags([]);
      setInputSchema('{\n  "type": "object",\n  "properties": {\n    "prompt": {\n      "type": "string"\n    }\n  },\n  "required": ["prompt"]\n}');
      setOutputSchema('{\n  "type": "object",\n  "properties": {\n    "response": {\n      "type": "string"\n    }\n  }\n}');
    } catch (error) {
      toast.error('Failed to register model');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (preset: string) => {
    switch (preset) {
      case 'openai':
        setValue('name', 'GPT-4 Model');
        setValue('endpoint', 'https://api.openai.com/v1/chat/completions');
        setValue('modelType', 'llm');
        setValue('latency', 2000);
        setValue('costPerToken', 0.00003);
        setInputSchema('{\n  "type": "object",\n  "properties": {\n    "messages": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "role": {"type": "string"},\n          "content": {"type": "string"}\n        }\n      }\n    },\n    "model": {"type": "string"},\n    "temperature": {"type": "number"}\n  },\n  "required": ["messages", "model"]\n}');
        setOutputSchema('{\n  "type": "object",\n  "properties": {\n    "choices": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "message": {\n            "type": "object",\n            "properties": {\n              "content": {"type": "string"}\n            }\n          }\n        }\n      }\n    }\n  }\n}');
        setTags(['openai', 'gpt-4', 'language-model']);
        break;
      case 'huggingface':
        setValue('name', 'HuggingFace Model');
        setValue('endpoint', 'https://api-inference.huggingface.co/models/');
        setValue('modelType', 'llm');
        setValue('latency', 3000);
        setTags(['huggingface', 'inference-api']);
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="schemas">Schemas</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Model Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Model name is required' })}
                placeholder="My AI Model"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                {...register('owner', { required: 'Owner is required' })}
                placeholder="team@company.com"
              />
              {errors.owner && (
                <p className="text-sm text-destructive">{errors.owner.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this model does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modelType">Model Type</Label>
              <Select onValueChange={(value) => setValue('modelType', value)} defaultValue="llm">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llm">Language Model</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                  <SelectItem value="tabular">Tabular</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="embedding">Embedding</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityPolicy">Security Policy</Label>
              <Select onValueChange={(value) => setValue('securityPolicy', value)} defaultValue="public">
                <SelectTrigger>
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="org-only">Organization Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint URL *</Label>
            <Input
              id="endpoint"
              {...register('endpoint', { required: 'Endpoint URL is required' })}
              placeholder="https://api.example.com/v1/generate"
            />
            {errors.endpoint && (
              <p className="text-sm text-destructive">{errors.endpoint.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthCheckUrl">Health Check URL</Label>
            <Input
              id="healthCheckUrl"
              {...register('healthCheckUrl')}
              placeholder="https://api.example.com/health"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latency">Expected Latency (ms)</Label>
              <Input
                id="latency"
                type="number"
                {...register('latency', { valueAsNumber: true, min: 0 })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerToken">Cost per Token ($)</Label>
              <Input
                id="costPerToken"
                type="number"
                step="0.000001"
                {...register('costPerToken', { valueAsNumber: true, min: 0 })}
                placeholder="0.00003"
              />
            </div>
          </div>

          {securityPolicy !== 'public' && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                {...register('apiKey')}
                placeholder="sk-..."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="schemas" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inputSchema">Input Schema (JSON Schema)</Label>
            <Textarea
              id="inputSchema"
              value={inputSchema}
              onChange={(e) => setInputSchema(e.target.value)}
              placeholder="Input JSON Schema..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputSchema">Output Schema (JSON Schema)</Label>
            <Textarea
              id="outputSchema"
              value={outputSchema}
              onChange={(e) => setOutputSchema(e.target.value)}
              placeholder="Output JSON Schema..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Load common model configurations to get started quickly
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => loadPreset('openai')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">OpenAI GPT-4</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  OpenAI Chat Completions API configuration
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50" onClick={() => loadPreset('huggingface')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">HuggingFace Inference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  HuggingFace Inference API configuration
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register Model'}
        </Button>
      </div>
    </form>
  );
}