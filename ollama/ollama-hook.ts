// hooks/useOllama.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OllamaService } from '@/services/ollamaService';
import { OllamaModel, OllamaConnectionStatus, OllamaGenerateRequest } from '@/types/ollama';

export const useOllamaConnection = (endpoint: string = 'http://localhost:11434') => {
  const ollamaService = OllamaService.getInstance();

  return useQuery({
    queryKey: ['ollama-connection', endpoint],
    queryFn: () => ollamaService.checkConnection(endpoint),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
    retry: 1
  });
};

export const useOllamaModels = (endpoint: string = 'http://localhost:11434') => {
  const ollamaService = OllamaService.getInstance();

  return useQuery({
    queryKey: ['ollama-models', endpoint],
    queryFn: () => ollamaService.getAvailableModels(endpoint),
    refetchInterval: 60000, // Check every minute
    staleTime: 55000,
    retry: 1
  });
};

export const useOllamaGenerate = () => {
  const queryClient = useQueryClient();
  const ollamaService = OllamaService.getInstance();

  return useMutation({
    mutationFn: async ({ 
      request, 
      endpoint = 'http://localhost:11434' 
    }: { 
      request: OllamaGenerateRequest; 
      endpoint?: string; 
    }) => {
      return ollamaService.generateResponse(request, endpoint);
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
    }
  });
};

export const useOllamaStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ollamaService = OllamaService.getInstance();

  const startStream = useCallback(async (
    request: OllamaGenerateRequest,
    endpoint: string = 'http://localhost:11434'
  ) => {
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);

    try {
      await ollamaService.streamGenerate(
        request,
        endpoint,
        (chunk: string) => {
          setStreamedContent(prev => prev + chunk);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsStreaming(false);
    }
  }, [ollamaService]);

  const resetStream = useCallback(() => {
    setStreamedContent('');
    setError(null);
  }, []);

  return {
    isStreaming,
    streamedContent,
    error,
    startStream,
    resetStream
  };
};

export const useOllamaAutoDiscovery = () => {
  const [endpoints, setEndpoints] = useState<string[]>([
    'http://localhost:11434',
    'http://127.0.0.1:11434',
    'http://host.docker.internal:11434'
  ]);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<OllamaConnectionStatus[]>([]);

  const ollamaService = OllamaService.getInstance();

  const discoverEndpoints = useCallback(async () => {
    const results = await Promise.allSettled(
      endpoints.map(endpoint => ollamaService.checkConnection(endpoint))
    );

    const discovered = results
      .map((result, index) => ({
        endpoint: endpoints[index],
        status: result.status === 'fulfilled' ? result.value : null
      }))
      .filter(item => item.status?.connected)
      .map(item => item.status!);

    setDiscoveredEndpoints(discovered);
    return discovered;
  }, [endpoints, ollamaService]);

  useEffect(() => {
    discoverEndpoints();
  }, [discoverEndpoints]);

  const addCustomEndpoint = useCallback((endpoint: string) => {
    if (!endpoints.includes(endpoint)) {
      setEndpoints(prev => [...prev, endpoint]);
    }
  }, [endpoints]);

  return {
    endpoints,
    discoveredEndpoints,
    discoverEndpoints,
    addCustomEndpoint
  };
};

// Hook for managing Ollama node execution in workflows
export const useOllamaNodeExecution = () => {
  const [executionState, setExecutionState] = useState<{
    [nodeId: string]: {
      isExecuting: boolean;
      result?: any;
      error?: string;
    };
  }>({});

  const executeNode = useCallback(async (
    nodeId: string,
    workflowId: string,
    nodeData: any
  ) => {
    setExecutionState(prev => ({
      ...prev,
      [nodeId]: { isExecuting: true }
    }));

    try {
      // Call your Supabase Edge Function
      const response = await fetch('/functions/v1/execute-ollama-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* your auth token */}`
        },
        body: JSON.stringify({
          nodeId,
          workflowId,
          endpoint: nodeData.config.endpoint,
          model: nodeData.config.model,
          prompt: nodeData.inputs.prompt,
          systemPrompt: nodeData.config.systemPrompt,
          options: {
            temperature: nodeData.config.temperature,
            top_p: nodeData.config.topP,
            top_k: nodeData.config.topK,
            num_predict: nodeData.config.maxTokens
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      setExecutionState(prev => ({
        ...prev,
        [nodeId]: { 
          isExecuting: false, 
          result: result.data 
        }
      }));

      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setExecutionState(prev => ({
        ...prev,
        [nodeId]: { 
          isExecuting: false, 
          error: errorMessage 
        }
      }));

      throw error;
    }
  }, []);

  const getNodeState = useCallback((nodeId: string) => {
    return executionState[nodeId] || { isExecuting: false };
  }, [executionState]);

  const clearNodeState = useCallback((nodeId: string) => {
    setExecutionState(prev => {
      const newState = { ...prev };
      delete newState[nodeId];
      return newState;
    });
  }, []);

  return {
    executeNode,
    getNodeState,
    clearNodeState,
    executionState
  };
};