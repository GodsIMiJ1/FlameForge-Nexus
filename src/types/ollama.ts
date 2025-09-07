// Ollama integration types for FlameForge Nexus
export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  endpoint: string;
  version?: string;
  models: OllamaModel[];
  lastChecked: Date;
  error?: string;
}

export interface OllamaInstance {
  id: string;
  user_id: string;
  endpoint: string;
  name?: string;
  is_active: boolean;
  last_seen: string;
  version?: string;
  available_models: OllamaModel[];
  connection_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OllamaExecutionLog {
  id: string;
  user_id: string;
  workflow_id: string;
  node_id: string;
  instance_endpoint: string;
  model_name: string;
  prompt_text?: string;
  system_prompt?: string;
  response_text?: string;
  execution_time_ms?: number;
  tokens_generated?: number;
  prompt_tokens?: number;
  total_duration_ms?: number;
  load_duration_ms?: number;
  execution_config: Record<string, any>;
  error_message?: string;
  status: 'pending' | 'completed' | 'error';
  started_at: string;
  completed_at?: string;
}

export interface OllamaNodeConfig {
  endpoint: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stream?: boolean;
}

export interface OllamaExecutionContext {
  nodeId: string;
  workflowId: string;
  config: OllamaNodeConfig;
  inputs: {
    prompt: string;
    context?: any;
  };
}

export interface OllamaExecutionResult {
  success: boolean;
  response?: string;
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
    executionTime: number;
  };
  error?: string;
}
