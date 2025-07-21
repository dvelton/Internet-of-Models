import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ModelMetadata } from '@/types';
import { ModelRegistry } from '@/lib/api';
import { Cpu, Eye, ChatCircle, Waveform, Database, Gear, Plus, MagnifyingGlass, Play } from '@phosphor-icons/react';
import { ModelRegistrationForm } from './ModelRegistrationForm';
import { ModelTestDialog } from './ModelTestDialog';
import { cn } from '@/lib/utils';

const MODEL_TYPE_ICONS = {
  llm: ChatCircle,
  vision: Eye,
  tabular: Database,
  audio: Waveform,
  embedding: Cpu,
  custom: Gear,
};

const STATUS_COLORS = {
  online: 'bg-green-100 text-green-800 border-green-200',
  offline: 'bg-gray-100 text-gray-800 border-gray-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

interface ModelRegistryProps {
  onModelSelect?: (model: ModelMetadata) => void;
  selectedModel?: string;
}

export function ModelRegistry({ onModelSelect, selectedModel }: ModelRegistryProps) {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    filterModels();
  }, [models, searchQuery, typeFilter, statusFilter]);

  const loadModels = async () => {
    try {
      const allModels = await ModelRegistry.getAllModels();
      setModels(allModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterModels = () => {
    let filtered = models;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(model => model.modelType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(model => model.status === statusFilter);
    }

    setFilteredModels(filtered);
  };

  const handleModelRegistered = (newModel: ModelMetadata) => {
    setModels(prev => [...prev, newModel]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Model Registry</h1>
          <p className="text-muted-foreground">
            Discover and manage AI models in your service mesh
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Register Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Model</DialogTitle>
              <DialogDescription>
                Add a new AI model to the service registry
              </DialogDescription>
            </DialogHeader>
            <ModelRegistrationForm onSuccess={handleModelRegistered} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="llm">Language Model</SelectItem>
            <SelectItem value="vision">Vision</SelectItem>
            <SelectItem value="tabular">Tabular</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="embedding">Embedding</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No models found</div>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or register a new model
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => {
            const IconComponent = MODEL_TYPE_ICONS[model.modelType];
            return (
              <Card 
                key={model.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedModel === model.id && "ring-2 ring-primary"
                )}
                onClick={() => onModelSelect?.(model)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", STATUS_COLORS[model.status])}
                    >
                      {model.status}
                    </Badge>
                  </div>
                  {model.description && (
                    <CardDescription className="line-clamp-2">
                      {model.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="font-mono">{model.latency}ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Owner</span>
                      <span>{model.owner}</span>
                    </div>
                    {model.costPerToken && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost/Token</span>
                        <span className="font-mono">${model.costPerToken.toFixed(6)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {model.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {model.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{model.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <ModelTestDialog model={model}>
                        <Button size="sm" variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      </ModelTestDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}