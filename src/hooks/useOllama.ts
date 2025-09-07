// Ollama React hooks for FlameForge Nexus
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OllamaService } from '@/services/ollamaService';
import { 
  OllamaModel, 
  OllamaConnectionStatus, 
  OllamaGenerateRequest,
  OllamaExecutionContext,
  OllamaExecutionResult 
} from '@/types/ollama';
import { supabase } from '@/integrations/supabase/client';

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
    retry: 1,
    enabled: !!endpoint
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
      // Invalidate related queries
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
  const [isDiscovering, setIsDiscovering] = useState(false);

  const ollamaService = OllamaService.getInstance();

  const discoverEndpoints = useCallback(async () => {
    setIsDiscovering(true);
    try {
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
    } finally {
      setIsDiscovering(false);
    }
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
    isDiscovering,
    discoverEndpoints,
    addCustomEndpoint
  };
};

// Hook for managing Ollama node execution in workflows
export const useOllamaNodeExecution = () => {
  const [executionState, setExecutionState] = useState<{
    [nodeId: string]: {
      isExecuting: boolean;
      result?: OllamaExecutionResult;
      error?: string;
    };
  }>({});

  const executeNode = useCallback(async (
    context: OllamaExecutionContext
  ): Promise<OllamaExecutionResult> => {
    const { nodeId } = context;
    
    setExecutionState(prev => ({
      ...prev,
      [nodeId]: { isExecuting: true }
    }));

    try {
      // Call the Supabase Edge Function for Ollama execution
      const { data, error } = await supabase.functions.invoke('execute-ollama-node', {
        body: {
          nodeId: context.nodeId,
          workflowId: context.workflowId,
          config: context.config,
          inputs: context.inputs
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: OllamaExecutionResult = data;

      setExecutionState(prev => ({
        ...prev,
        [nodeId]: { 
          isExecuting: false, 
          result 
        }
      }));

      return result;

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

// Hook for managing Ollama instances
export const useOllamaInstances = () => {
  return useQuery({
    queryKey: ['ollama-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ollama_instances')
        .select('*')
        .eq('is_active', true)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000 // Refresh every minute
  });
};

// Hook for Ollama execution logs
export const useOllamaExecutionLogs = (nodeId?: string, workflowId?: string) => {
  return useQuery({
    queryKey: ['ollama-execution-logs', nodeId, workflowId],
    queryFn: async () => {
      let query = supabase
        .from('ollama_execution_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (nodeId) {
        query = query.eq('node_id', nodeId);
      }
      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!(nodeId || workflowId)
  });
};
