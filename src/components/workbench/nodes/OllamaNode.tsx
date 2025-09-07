// OllamaNode component for FlameForge Nexus
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Settings, Play, AlertCircle, CheckCircle, Brain, Zap } from 'lucide-react';
import { OllamaNodeData } from '@/types/workbench';
import { OllamaModel } from '@/types/ollama';
import { useOllamaConnection, useOllamaModels, useOllamaNodeExecution } from '@/hooks/useOllama';
import { useOllamaContext, useBestOllamaInstance, useAllAvailableModels } from '@/contexts/OllamaContext';

interface OllamaNodeProps extends NodeProps {
  data: OllamaNodeData;
}

export const OllamaNode: React.FC<OllamaNodeProps> = ({ data, selected }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(data.config);

  // Ollama context and hooks
  const { connectionStatuses, refreshConnection, instances } = useOllamaContext();
  const bestInstance = useBestOllamaInstance();
  const allModels = useAllAvailableModels();
  const { executeNode, getNodeState } = useOllamaNodeExecution();

  // Get connection status for current endpoint
  const connectionStatus = connectionStatuses.get(localConfig.endpoint);
  const isCheckingConnection = false; // We'll handle this through context
  const models = allModels.filter(model => model.endpoint === localConfig.endpoint);
  const isLoadingModels = false;

  const nodeState = getNodeState(data.label); // Using label as nodeId for now
  const isExecuting = nodeState.isExecuting;

  const handleConfigChange = (field: string, value: any) => {
    const updatedConfig = {
      ...localConfig,
      [field]: value
    };
    setLocalConfig(updatedConfig);
    
    // Update the actual node data (this would be handled by your workflow state management)
    // For now, we'll just update local state
    data.config = updatedConfig;
  };

  const handleExecuteNode = async () => {
    if (!data.inputs.prompt || !localConfig.model) return;
    
    try {
      await executeNode({
        nodeId: data.label, // Using label as nodeId for now
        workflowId: 'current-workflow', // This should come from workflow context
        config: localConfig,
        inputs: data.inputs
      });
    } catch (error) {
      console.error('Ollama execution error:', error);
    }
  };

  const getStatusColor = () => {
    if (isCheckingConnection) return 'bg-yellow-500';
    if (connectionStatus?.connected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (isCheckingConnection) {
      return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
    }
    if (connectionStatus?.connected) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className={`min-w-[300px] bg-card border-node-agent/30 shadow-node hover:shadow-glow transition-all duration-300 group ${selected ? 'ring-2 ring-node-agent' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-purple-500" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()}`} />
            </div>
            <div>
              <div className="font-semibold text-foreground">{data.label || 'Ollama Node'}</div>
              <div className="text-xs text-muted-foreground">Local AI Model</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="h-8 w-8 p-0 hover:bg-purple-500/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Model Info */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Model:</Label>
          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
            {localConfig.model || 'None selected'}
          </Badge>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Status:</Label>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs">
              {isCheckingConnection ? 'Checking...' : connectionStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Configuration Panel */}
        {isConfigOpen && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="text-xs">Endpoint</Label>
              <Input
                value={localConfig.endpoint}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                placeholder="http://localhost:11434"
                className="h-8 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Model</Label>
              <Select
                value={localConfig.model}
                onValueChange={(value) => handleConfigChange('model', value)}
                disabled={isLoadingModels || !connectionStatus?.connected}
              >
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{model.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {model.details?.parameter_size || 'Unknown'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={localConfig.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant..."
                className="min-h-[60px] text-xs mt-1"
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Temperature: {localConfig.temperature || 0.7}</Label>
                <Slider
                  value={[localConfig.temperature || 0.7]}
                  onValueChange={([value]) => handleConfigChange('temperature', value)}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Max Tokens</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4096"
                    value={localConfig.maxTokens || 2048}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Top P</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localConfig.topP || 0.9}
                    onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Status */}
        {nodeState.result && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            ✓ Last execution: {nodeState.result.metadata?.tokens || 0} tokens in {nodeState.result.metadata?.executionTime || 0}ms
          </div>
        )}

        {nodeState.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ✗ Error: {nodeState.error}
          </div>
        )}

        {/* Test Button */}
        <Button
          onClick={handleExecuteNode}
          disabled={!localConfig.model || !connectionStatus?.connected || isExecuting || !data.inputs.prompt}
          className="w-full h-8 bg-purple-600 hover:bg-purple-700"
          size="sm"
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Execute Node
            </div>
          )}
        </Button>
      </CardContent>

      {/* Node Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-background"
      />
    </Card>
  );
};
