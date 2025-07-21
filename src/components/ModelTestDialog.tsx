import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModelMetadata } from '@/types';
import { ExecutionEngine } from '@/lib/api';
import { Play, Clock, DollarSign, CheckCircle, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ModelTestDialogProps {
  model: ModelMetadata;
  children: React.ReactNode;
}

export function ModelTestDialog({ model, children }: ModelTestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState(JSON.stringify({
    prompt: "Hello, how are you?"
  }, null, 2));
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionStats, setExecutionStats] = useState<{
    latency: number;
    timestamp: string;
  } | null>(null);

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setOutput(null);
      setExecutionStats(null);

      const parsedInput = JSON.parse(input);
      const startTime = Date.now();
      
      const result = await ExecutionEngine.invokeSingleModel(model.id, parsedInput);
      const endTime = Date.now();
      
      setOutput(result);
      setExecutionStats({
        latency: endTime - startTime,
        timestamp: new Date().toISOString(),
      });
      
      toast.success('Model invocation successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Model invocation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setOutput(null);
    setError(null);
    setExecutionStats(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test {model.name}
          </DialogTitle>
          <DialogDescription>
            Send a test request to validate the model integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Model Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium">Type</div>
              <div className="text-sm text-muted-foreground capitalize">{model.modelType}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Status</div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  model.status === 'online' ? 'border-green-500 text-green-700' :
                  model.status === 'offline' ? 'border-gray-500 text-gray-700' :
                  'border-red-500 text-red-700'
                }`}
              >
                {model.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Latency</div>
              <div className="text-sm text-muted-foreground font-mono">{model.latency}ms</div>
            </div>
            <div>
              <div className="text-sm font-medium">Security</div>
              <div className="text-sm text-muted-foreground capitalize">{model.securityPolicy}</div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-2">
            <Label>Input Data (JSON)</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter JSON input..."
              rows={8}
              className="font-mono text-sm"
              disabled={isLoading}
            />
            <div className="text-xs text-muted-foreground">
              Expected schema: <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {JSON.stringify(model.inputSchema, null, 2)}
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={resetTest}
              variant="outline"
              disabled={isLoading || (!output && !error)}
            >
              Clear Results
            </Button>
            <Button
              onClick={handleTest}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Results Section */}
          {(output || error || executionStats) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Results</h3>
                {executionStats && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {executionStats.latency}ms
                    </div>
                    <div>{new Date(executionStats.timestamp).toLocaleTimeString()}</div>
                  </div>
                )}
              </div>

              {/* Success Output */}
              {output && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Success</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Output */}
              {error && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                </div>
              )}

              {/* Cost Estimation */}
              {model.costPerToken && executionStats && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Cost Estimate</span>
                  </div>
                  <div className="text-sm text-amber-700">
                    Estimated cost: ${(model.costPerToken * 100).toFixed(6)} (based on ~100 tokens)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}