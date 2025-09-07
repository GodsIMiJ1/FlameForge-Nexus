// Ollama Context Provider for FlameForge Nexus
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { OllamaConfigService } from '@/services/ollamaConfigService';
import { OllamaService } from '@/services/ollamaService';
import { OllamaConfig, OllamaInstance, OllamaConnectionStatus } from '@/types/ollama';

interface OllamaContextType {
  // Configuration
  config: OllamaConfig;
  updateConfig: (updates: Partial<OllamaConfig>) => void;
  
  // Instances
  instances: OllamaInstance[];
  addInstance: (instance: Omit<OllamaInstance, 'id' | 'created_at' | 'updated_at'>) => void;
  removeInstance: (endpoint: string) => void;
  
  // Connection status
  connectionStatuses: Map<string, OllamaConnectionStatus>;
  refreshConnection: (endpoint: string) => Promise<void>;
  refreshAllConnections: () => Promise<void>;
  
  // Auto-discovery
  discoverInstances: () => Promise<void>;
  isDiscovering: boolean;
  
  // Global state
  isInitialized: boolean;
  globalError: string | null;
}

const OllamaContext = createContext<OllamaContextType | undefined>(undefined);

interface OllamaProviderProps {
  children: ReactNode;
}

export const OllamaProvider: React.FC<OllamaProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<OllamaConfig>(() => 
    OllamaConfigService.getInstance().getConfig()
  );
  const [instances, setInstances] = useState<OllamaInstance[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Map<string, OllamaConnectionStatus>>(new Map());
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const configService = OllamaConfigService.getInstance();
  const ollamaService = OllamaService.getInstance();

  // Initialize the context
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize config service
        configService.init();
        
        // Load instances
        const loadedInstances = configService.getInstances();
        setInstances(loadedInstances);
        
        // Start health checking if enabled
        if (config.autoDiscovery) {
          configService.startHealthChecking();
        }
        
        // Initial connection check for all instances
        await refreshAllConnections();
        
        setIsInitialized(true);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : 'Initialization failed');
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      configService.stopHealthChecking();
      ollamaService.cleanup();
    };
  }, []);

  const updateConfig = (updates: Partial<OllamaConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    configService.updateConfig(updates);
    
    // Restart health checking if auto-discovery setting changed
    if ('autoDiscovery' in updates) {
      if (updates.autoDiscovery) {
        configService.startHealthChecking();
      } else {
        configService.stopHealthChecking();
      }
    }
  };

  const addInstance = (instanceData: Omit<OllamaInstance, 'id' | 'created_at' | 'updated_at'>) => {
    const newInstance = configService.addInstance(instanceData);
    setInstances(prev => [...prev, newInstance]);
    
    // Check connection for new instance
    refreshConnection(newInstance.endpoint);
  };

  const removeInstance = (endpoint: string) => {
    configService.removeInstance(endpoint);
    setInstances(prev => prev.filter(instance => instance.endpoint !== endpoint));
    setConnectionStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(endpoint);
      return newMap;
    });
  };

  const refreshConnection = async (endpoint: string) => {
    try {
      const status = await ollamaService.checkConnection(endpoint);
      setConnectionStatuses(prev => new Map(prev).set(endpoint, status));
      
      // Update instance if it exists
      if (status.connected) {
        configService.updateInstance(endpoint, {
          is_active: true,
          last_seen: new Date().toISOString(),
          available_models: status.models
        });
      }
    } catch (error) {
      console.error(`Failed to check connection for ${endpoint}:`, error);
    }
  };

  const refreshAllConnections = async () => {
    const promises = instances.map(instance => refreshConnection(instance.endpoint));
    await Promise.allSettled(promises);
  };

  const discoverInstances = async () => {
    setIsDiscovering(true);
    setGlobalError(null);
    
    try {
      const discoveryEndpoints = configService.getDiscoveryEndpoints();
      const results = await Promise.allSettled(
        discoveryEndpoints.map(endpoint => ollamaService.checkConnection(endpoint))
      );

      const newInstances: OllamaInstance[] = [];
      const newStatuses = new Map(connectionStatuses);

      results.forEach((result, index) => {
        const endpoint = discoveryEndpoints[index];
        
        if (result.status === 'fulfilled' && result.value.connected) {
          const status = result.value;
          newStatuses.set(endpoint, status);
          
          // Add instance if not already exists
          const existingInstance = instances.find(inst => inst.endpoint === endpoint);
          if (!existingInstance) {
            const newInstance = configService.addInstance({
              user_id: 'current-user', // This should come from auth context
              endpoint,
              name: `Ollama (${endpoint})`,
              is_active: true,
              last_seen: new Date().toISOString(),
              available_models: status.models,
              connection_metadata: {
                version: status.version,
                discovered: true
              }
            });
            newInstances.push(newInstance);
          }
        }
      });

      if (newInstances.length > 0) {
        setInstances(prev => [...prev, ...newInstances]);
      }
      setConnectionStatuses(newStatuses);
      
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  const contextValue: OllamaContextType = {
    config,
    updateConfig,
    instances,
    addInstance,
    removeInstance,
    connectionStatuses,
    refreshConnection,
    refreshAllConnections,
    discoverInstances,
    isDiscovering,
    isInitialized,
    globalError
  };

  return (
    <OllamaContext.Provider value={contextValue}>
      {children}
    </OllamaContext.Provider>
  );
};

export const useOllamaContext = (): OllamaContextType => {
  const context = useContext(OllamaContext);
  if (context === undefined) {
    throw new Error('useOllamaContext must be used within an OllamaProvider');
  }
  return context;
};

// Hook for getting the best available Ollama instance
export const useBestOllamaInstance = () => {
  const { instances, connectionStatuses } = useOllamaContext();
  
  const bestInstance = instances
    .filter(instance => {
      const status = connectionStatuses.get(instance.endpoint);
      return status?.connected && instance.is_active;
    })
    .sort((a, b) => {
      // Sort by last seen (most recent first)
      return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
    })[0];

  return bestInstance;
};

// Hook for getting available models across all instances
export const useAllAvailableModels = () => {
  const { instances, connectionStatuses } = useOllamaContext();
  
  const allModels = instances
    .filter(instance => {
      const status = connectionStatuses.get(instance.endpoint);
      return status?.connected && instance.is_active;
    })
    .flatMap(instance => 
      instance.available_models.map(model => ({
        ...model,
        endpoint: instance.endpoint,
        instanceName: instance.name
      }))
    );

  // Remove duplicates based on model name
  const uniqueModels = allModels.filter((model, index, self) => 
    index === self.findIndex(m => m.name === model.name)
  );

  return uniqueModels;
};
