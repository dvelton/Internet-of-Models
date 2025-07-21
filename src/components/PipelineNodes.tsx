import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ModelMetadata } from '@/types';
import { Cpu, Eye, ChatCircle, Waveform, Database, Gear, Settings } from '@phosphor-icons/react';

const MODEL_TYPE_ICONS = {
  llm: ChatCircle,
  vision: Eye,
  tabular: Database,
  audio: Waveform,
  embedding: Cpu,
  custom: Gear,
};

interface ModelNodeData {
  model: ModelMetadata;
  config?: Record<string, any>;
  onConfigChange: (nodeId: string, config: Record<string, any>) => void;
}

export function ModelNode({ data, id }: NodeProps<ModelNodeData>) {
  const { model, config = {}, onConfigChange } = data;
  const [localConfig, setLocalConfig] = useState(config);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const IconComponent = MODEL_TYPE_ICONS[model.modelType];

  const handleConfigSave = () => {
    onConfigChange(id, localConfig);
    setIsConfigOpen(false);
  };

  const updateConfig = (key: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary border-2 border-white"
      />
      
      <Card className="w-64 shadow-lg border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4 text-primary" />
              <div className="font-medium text-sm truncate">{model.name}</div>
            </div>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                  <Settings className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure {model.name}</DialogTitle>
                  <DialogDescription>
                    Adjust parameters for this model in the pipeline
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Common configuration options */}
                  {model.modelType === 'llm' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={localConfig.temperature || 0.7}
                          onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxTokens">Max Tokens</Label>
                        <Input
                          id="maxTokens"
                          type="number"
                          min="1"
                          value={localConfig.maxTokens || 1000}
                          onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea
                          id="systemPrompt"
                          value={localConfig.systemPrompt || ''}
                          onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                          placeholder="You are a helpful assistant..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                  
                  {model.modelType === 'vision' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="imageFormat">Expected Image Format</Label>
                        <Input
                          id="imageFormat"
                          value={localConfig.imageFormat || 'base64'}
                          onChange={(e) => updateConfig('imageFormat', e.target.value)}
                          placeholder="base64, url, binary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxImageSize">Max Image Size (MB)</Label>
                        <Input
                          id="maxImageSize"
                          type="number"
                          min="1"
                          value={localConfig.maxImageSize || 10}
                          onChange={(e) => updateConfig('maxImageSize', parseInt(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  {/* Generic timeout setting for all models */}
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="1000"
                      value={localConfig.timeout || 30000}
                      onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                    />
                  </div>

                  {/* Retry configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="retries">Max Retries</Label>
                    <Input
                      id="retries"
                      type="number"
                      min="0"
                      max="5"
                      value={localConfig.retries || 2}
                      onChange={(e) => updateConfig('retries', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfigSave}>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="secondary" className="text-xs">
                {model.modelType}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-mono">{model.latency}ms</span>
            </div>
            {model.costPerToken && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cost/Token</span>
                <span className="font-mono">${model.costPerToken.toFixed(6)}</span>
              </div>
            )}
            {Object.keys(config).length > 0 && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                {Object.keys(config).length} parameter{Object.keys(config).length !== 1 ? 's' : ''} configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary border-2 border-white"
      />
    </>
  );
}