// components/nodes/index.ts - Node Type Registry
import React from 'react';
import { AgentNode } from './AgentNode';
import { ToolNode } from './ToolNode';
import { DecisionNode } from './DecisionNode';
import { OllamaNode } from './OllamaNode';

export interface NodeTypeDefinition {
  component: React.ComponentType<any>;
  category: string;
  displayName: string;
  description: string;
  defaultData: any;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
}

export const NODE_TYPES: Record<string, NodeTypeDefinition> = {
  agent: {
    component: AgentNode,
    category: 'AI',
    displayName: 'AI Agent',
    description: 'Execute AI tasks with OpenAI/Anthropic models',
    defaultData: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      prompt: '',
      apiKey: ''
    },
    inputs: [
      { name: 'prompt', type: 'string', required: true },
      { name: 'context', type: 'any', required: false }
    ],
    outputs: [
      { name: 'response', type: 'string' },
      { name: 'metadata', type: 'object' }
    ]
  },
  tool: {
    component: ToolNode,
    category: 'Integration',
    displayName: 'HTTP Tool',
    description: 'Make HTTP requests to external APIs',
    defaultData: {
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      timeout: 30000,
      retries: 3
    },
    inputs: [
      { name: 'url', type: 'string', required: true },
      { name: 'params', type: 'object', required: false }
    ],
    outputs: [
      { name: 'response', type: 'any' },
      { name: 'status', type: 'number' }
    ]
  },
  decision: {
    component: DecisionNode,
    category: 'Logic',
    displayName: 'Decision',
    description: 'Route workflow based on conditions',
    defaultData: {
      condition: 'true',
      operator: 'equals',
      value: '',
      compareWith: ''
    },
    inputs: [
      { name: 'input', type: 'any', required: true }
    ],
    outputs: [
      { name: 'true', type: 'any' },
      { name: 'false', type: 'any' }
    ]
  },
  ollama: {
    component: OllamaNode,
    category: 'Local AI',
    displayName: 'Ollama',
    description: 'Local AI inference with Ollama',
    defaultData: {
      endpoint: 'http://localhost:11434',
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      stream: false
    },
    inputs: [
      { name: 'prompt', type: 'string', required: true }
    ],
    outputs: [
      { name: 'response', type: 'string' },
      { name: 'metadata', type: 'object' }
    ]
  }
};

// Node Type Registry Class
export class NodeTypeRegistry {
  private static instance: NodeTypeRegistry;
  private nodeTypes: Map<string, NodeTypeDefinition> = new Map();
  private plugins: Map<string, any> = new Map();

  static getInstance(): NodeTypeRegistry {
    if (!NodeTypeRegistry.instance) {
      NodeTypeRegistry.instance = new NodeTypeRegistry();
    }
    return NodeTypeRegistry.instance;
  }

  constructor() {
    // Register default node types
    Object.entries(NODE_TYPES).forEach(([type, definition]) => {
      this.registerNodeType(type, definition);
    });
  }

  registerNodeType(type: string, definition: NodeTypeDefinition) {
    this.nodeTypes.set(type, definition);
  }

  getNodeType(type: string): NodeTypeDefinition | undefined {
    return this.nodeTypes.get(type);
  }

  getAllNodeTypes(): Map<string, NodeTypeDefinition> {
    return this.nodeTypes;
  }

  getNodeTypesByCategory(category: string): Array<[string, NodeTypeDefinition]> {
    return Array.from(this.nodeTypes.entries()).filter(
      ([_, definition]) => definition.category === category
    );
  }

  // Plugin system for extending node types
  registerPlugin(name: string, plugin: any) {
    this.plugins.set(name, plugin);
    if (plugin.nodeTypes) {
      Object.entries(plugin.nodeTypes).forEach(([type, definition]) => {
        this.registerNodeType(type, definition as NodeTypeDefinition);
      });
    }
  }

  getPlugin(name: string) {
    return this.plugins.get(name);
  }
}

// AgentNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Brain, Settings, Play, AlertCircle } from 'lucide-react';

export const AgentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'huggingface', label: 'Hugging Face' }
  ];

  const models = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    huggingface: ['microsoft/DialoGPT-medium', 'facebook/blenderbot-400M']
  };

  return (
    <Card className={`min-w-[300px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            AI Agent
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Operator:</Label>
          <Badge variant="secondary">{data.operator || 'equals'}</Badge>
        </div>

        {isConfigOpen && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Condition Variable</Label>
              <Input
                value={data.compareWith || ''}
                onChange={(e) => {/* update data */}}
                placeholder="${node_123_output}"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Operator</Label>
              <Select value={data.operator} onValueChange={(value) => {/* update data */}}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Compare Value</Label>
              <Input
                value={data.value || ''}
                onChange={(e) => {/* update data */}}
                placeholder="Expected value"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Custom Condition (JavaScript)</Label>
              <Textarea
                value={data.condition || ''}
                onChange={(e) => {/* update data */}}
                placeholder="input.length > 0"
                className="min-h-[60px] text-xs font-mono"
              />
            </div>
          </div>
        )}

        <Button className="w-full h-8" size="sm">
          Test Condition
        </Button>
      </CardContent>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} />
    </Card>
  );
};-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Provider:</Label>
          <Badge variant="secondary">{data.provider || 'openai'}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-xs">Model:</Label>
          <Badge variant="outline">{data.model || 'gpt-4'}</Badge>
        </div>

        {isConfigOpen && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Provider</Label>
              <Select value={data.provider} onValueChange={(value) => {/* update data */}}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Model</Label>
              <Select value={data.model} onValueChange={(value) => {/* update data */}}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(models[data.provider] || models.openai).map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">API Key</Label>
              <Input
                type="password"
                value={data.apiKey || ''}
                onChange={(e) => {/* update data */}}
                placeholder="sk-..."
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={data.systemPrompt || ''}
                onChange={(e) => {/* update data */}}
                placeholder="You are a helpful assistant..."
                className="min-h-[60px] text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Temperature: {data.temperature || 0.7}</Label>
              <Slider
                value={[data.temperature || 0.7]}
                onValueChange={([value]) => {/* update data */}}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-xs">Max Tokens</Label>
              <Input
                type="number"
                value={data.maxTokens || 2048}
                onChange={(e) => {/* update data */}}
                className="h-8"
              />
            </div>
          </div>
        )}

        <Button
          onClick={() => {/* execute node */}}
          disabled={!data.apiKey || isExecuting}
          className="w-full h-8"
          size="sm"
        >
          {isExecuting ? 'Generating...' : 'Test Agent'}
        </Button>
      </CardContent>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Card>
  );
};

// ToolNode.tsx
export const ToolNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-green-500 rounded" />
            HTTP Tool
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Method:</Label>
          <Badge variant="secondary">{data.method || 'GET'}</Badge>
        </div>

        {isConfigOpen && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                value={data.url || ''}
                onChange={(e) => {/* update data */}}
                placeholder="https://api.example.com/endpoint"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">Method</Label>
              <Select value={data.method} onValueChange={(value) => {/* update data */}}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Headers (JSON)</Label>
              <Textarea
                value={JSON.stringify(data.headers || {}, null, 2)}
                onChange={(e) => {/* update data with parsed JSON */}}
                className="min-h-[60px] text-xs font-mono"
              />
            </div>

            {data.method !== 'GET' && (
              <div>
                <Label className="text-xs">Body (JSON)</Label>
                <Textarea
                  value={data.body || ''}
                  onChange={(e) => {/* update data */}}
                  className="min-h-[60px] text-xs font-mono"
                />
              </div>
            )}
          </div>
        )}

        <Button className="w-full h-8" size="sm">
          Test Request
        </Button>
      </CardContent>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Card>
  );
};

// DecisionNode.tsx
export const DecisionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'regex', label: 'Regex Match' }
  ];

  return (
    <Card className={`min-w-[260px] ${selected ? 'ring-2 ring-yellow-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
            Decision
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y