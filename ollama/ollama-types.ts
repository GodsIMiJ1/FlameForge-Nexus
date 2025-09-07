// types/ollama.ts
export interface OllamaNodeData {
  type: 'ollama';
  label: string;
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