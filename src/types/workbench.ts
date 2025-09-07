export interface NodeData {
  label: string;
  description: string;
}

export interface AgentNodeData extends NodeData {
  type?: 'agent';
  config?: any;
}

export interface ToolNodeData extends NodeData {
  type?: 'tool';
  apiEndpoint?: string;
  config?: any;
}

export interface DataSourceNodeData extends NodeData {
  type?: 'dataSource';
  connectionString?: string;
  config?: any;
}

export interface DecisionNodeData extends NodeData {
  type?: 'decision';
  condition?: string;
  config?: any;
}

export interface OllamaNodeData extends NodeData {
  type: 'ollama';
  config: {
    endpoint: string; // Default: 'http://localhost:11434'
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stream?: boolean;
  };
  inputs: {
    prompt: string;
    context?: any;
  };
  outputs: {
    response: string;
    metadata?: {
      model: string;
      tokens: number;
      duration: number;
    };
  };
}