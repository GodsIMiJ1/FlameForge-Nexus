// Ollama Configuration Service for FlameForge Nexus
import { OllamaInstance } from '@/types/ollama';

export interface OllamaConfig {
  defaultEndpoint: string;
  connectionTimeout: number;
  retryAttempts: number;
  cacheTimeout: number;
  autoDiscovery: boolean;
  preferredModels: string[];
}

export class OllamaConfigService {
  private static instance: OllamaConfigService;
  private config: OllamaConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): OllamaConfigService {
    if (!OllamaConfigService.instance) {
      OllamaConfigService.instance = new OllamaConfigService();
    }
    return OllamaConfigService.instance;
  }

  private loadConfig(): OllamaConfig {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem('ollama-config');
    const defaults: OllamaConfig = {
      defaultEndpoint: 'http://localhost:11434',
      connectionTimeout: 5000,
      retryAttempts: 3,
      cacheTimeout: 30000,
      autoDiscovery: true,
      preferredModels: ['llama2', 'codellama', 'mistral']
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch {
        return defaults;
      }
    }

    return defaults;
  }

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    localStorage.setItem('ollama-config', JSON.stringify(this.config));
  }

  // Instance management
  private instances: Map<string, OllamaInstance> = new Map();

  addInstance(instance: Omit<OllamaInstance, 'id' | 'created_at' | 'updated_at'>): OllamaInstance {
    const newInstance: OllamaInstance = {
      ...instance,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.instances.set(newInstance.endpoint, newInstance);
    this.saveInstances();
    return newInstance;
  }

  getInstances(): OllamaInstance[] {
    return Array.from(this.instances.values());
  }

  getInstanceByEndpoint(endpoint: string): OllamaInstance | undefined {
    return this.instances.get(endpoint);
  }

  updateInstance(endpoint: string, updates: Partial<OllamaInstance>): void {
    const instance = this.instances.get(endpoint);
    if (instance) {
      const updated = {
        ...instance,
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.instances.set(endpoint, updated);
      this.saveInstances();
    }
  }

  removeInstance(endpoint: string): void {
    this.instances.delete(endpoint);
    this.saveInstances();
  }

  private saveInstances(): void {
    const instancesArray = Array.from(this.instances.values());
    localStorage.setItem('ollama-instances', JSON.stringify(instancesArray));
  }

  private loadInstances(): void {
    const stored = localStorage.getItem('ollama-instances');
    if (stored) {
      try {
        const instances: OllamaInstance[] = JSON.parse(stored);
        this.instances.clear();
        instances.forEach(instance => {
          this.instances.set(instance.endpoint, instance);
        });
      } catch {
        // Ignore parsing errors
      }
    }
  }

  // Initialize instances on service creation
  init(): void {
    this.loadInstances();
  }

  // Health check scheduling
  private healthCheckInterval: NodeJS.Timeout | null = null;

  startHealthChecking(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
  }

  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const instances = this.getInstances();
    
    for (const instance of instances) {
      try {
        const response = await fetch(`${instance.endpoint}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(this.config.connectionTimeout)
        });

        const isHealthy = response.ok;
        
        this.updateInstance(instance.endpoint, {
          is_active: isHealthy,
          last_seen: new Date().toISOString()
        });

        if (isHealthy) {
          // Update available models
          try {
            const data = await response.json();
            this.updateInstance(instance.endpoint, {
              available_models: data.models || []
            });
          } catch {
            // Ignore model update errors
          }
        }
      } catch {
        this.updateInstance(instance.endpoint, {
          is_active: false
        });
      }
    }
  }

  // Model preferences
  getPreferredModels(): string[] {
    return [...this.config.preferredModels];
  }

  addPreferredModel(modelName: string): void {
    if (!this.config.preferredModels.includes(modelName)) {
      this.config.preferredModels.push(modelName);
      this.saveConfig();
    }
  }

  removePreferredModel(modelName: string): void {
    const index = this.config.preferredModels.indexOf(modelName);
    if (index > -1) {
      this.config.preferredModels.splice(index, 1);
      this.saveConfig();
    }
  }

  // Auto-discovery endpoints
  getDiscoveryEndpoints(): string[] {
    return [
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'http://0.0.0.0:11434',
      'http://host.docker.internal:11434',
      // Add more common endpoints as needed
    ];
  }

  // Reset to defaults
  reset(): void {
    localStorage.removeItem('ollama-config');
    localStorage.removeItem('ollama-instances');
    this.config = this.loadConfig();
    this.instances.clear();
  }
}
