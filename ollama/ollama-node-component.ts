// components/nodes/OllamaNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { OllamaNodeData, OllamaModel } from '@/types/ollama';
import { OllamaService } from '@/services/ollamaService';

interface OllamaNodeProps extends NodeProps {
  data: OllamaNodeData;
}

export const OllamaNode: React.FC<OllamaNodeProps> = ({ data, selected }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isExecuting, setIsExecuting] = useState(false);

  const ollamaService = OllamaService.getInstance();

  useEffect(() => {
    checkConnection();
  }, [data.config.endpoint]);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const status = await ollamaService.checkConnection(data.config.endpoint);
      if (status.connected) {
        setConnectionStatus('connected');
        setModels(status.models);
      } else {
        setConnectionStatus('disconnected');
        setModels([]);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setModels([]);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    // This would typically update the node data through your workflow state management
    // For now, showing the structure
    const updatedData = {
      ...data,
      config: {
        ...data.config,
        [field]: value
      }
    };
    // updateNodeData(data.id, updatedData);
  };

  const executeNode = async () => {
    if (!data.inputs.prompt) return;
    
    setIsExecuting(true);
    try {
      const response = await ollamaService.generateResponse({
        model: data.config.model,
        prompt: data.inputs.prompt,
        system: data.config.systemPrompt,
        options: {
          temperature: data.config.temperature,
          top_p: data.config.topP,
          top_k: data.config.topK,
          num_predict: data.config.maxTokens
        }
      }, data.config.endpoint);

      // Handle response - update node outputs
      console.log('Ollama response:', response);
    } catch (error) {
      console.error('Ollama execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4" />;
      default: return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
    }
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            {data.label || 'Ollama Node'}
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Model Info */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Model:</Label>
          <Badge variant="secondary" className="text-xs">
            {data.config.model || 'None selected'}
          </Badge>
        </div>

        {/* Configuration Panel */}
        {isConfigOpen && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Endpoint</Label>
              <Input
                value={data.config.endpoint}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                placeholder="http://localhost:11434"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Model</Label>
              <Select
                value={data.config.model}
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {model.details.parameter_size}
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
                value={data.config.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant..."
                className="min-h-[60px] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Temperature</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={data.config.temperature || 0.7}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Max Tokens</Label>
                <Input
                  type="number"
                  min="1"
                  max="4096"
                  value={data.config.maxTokens || 2048}
                  onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Button */}
        <Button
          onClick={executeNode}
          disabled={!data.config.model || connectionStatus !== 'connected' || isExecuting}
          className="w-full h-8"
          size="sm"
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="h-3 w-3" />
              Test Node
            </div>
          )}
        </Button>
      </CardContent>

      {/* Node Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </Card>
  );
};