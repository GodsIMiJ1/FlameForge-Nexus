// Real Ollama API Service for FlameForge Nexus
import {
  OllamaModel,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaConnectionStatus,
  OllamaInstance,
  OllamaExecutionContext,
  OllamaExecutionResult
} from '@/types/ollama';

// Re-export types for convenience
export type { OllamaModel } from '@/types/ollama';

// Additional interfaces for real data integration
export interface ModelPerformanceMetrics {
  name: string;
  tokensPerSecond: number;
  avgLatency: number;
  totalRequests: number;
  lastUsed: Date;
  memoryUsage: number;
  isActive: boolean;
}

export class OllamaService {
  private static instance: OllamaService;
  private connectionCache: Map<string, OllamaConnectionStatus> = new Map();
  private connectionPool: Map<string, AbortController[]> = new Map();
  private performanceCache: Map<string, ModelPerformanceMetrics> = new Map();
  private readonly defaultEndpoint = 'http://localhost:11434';
  private readonly cacheTimeout = 30000; // 30 seconds
  private readonly maxConcurrentConnections = 5;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
        }
      }
    }

    throw lastError!;
  }

  private getAbortController(endpoint: string): AbortController {
    if (!this.connectionPool.has(endpoint)) {
      this.connectionPool.set(endpoint, []);
    }

    const controllers = this.connectionPool.get(endpoint)!;

    // Clean up completed controllers
    const activeControllers = controllers.filter(controller => !controller.signal.aborted);
    this.connectionPool.set(endpoint, activeControllers);

    // Check connection limit
    if (activeControllers.length >= this.maxConcurrentConnections) {
      throw new Error(`Too many concurrent connections to ${endpoint}`);
    }

    const controller = new AbortController();
    activeControllers.push(controller);

    return controller;
  }

  private releaseAbortController(endpoint: string, controller: AbortController): void {
    const controllers = this.connectionPool.get(endpoint);
    if (controllers) {
      const index = controllers.indexOf(controller);
      if (index > -1) {
        controllers.splice(index, 1);
      }
    }
  }

  async checkConnection(endpoint: string = this.defaultEndpoint): Promise<OllamaConnectionStatus> {
    const cacheKey = endpoint;
    const cached = this.connectionCache.get(cacheKey);

    // Return cached result if checked within cache timeout
    if (cached && Date.now() - cached.lastChecked.getTime() < this.cacheTimeout) {
      return cached;
    }

    return this.withRetry(async () => {
      const controller = this.getAbortController(endpoint);

      try {
        // Check if Ollama is running
        const healthResponse = await fetch(`${endpoint}/api/tags`, {
          method: 'GET',
          signal: controller.signal
        });

        if (!healthResponse.ok) {
          throw new Error(`HTTP ${healthResponse.status}`);
        }

        const data = await healthResponse.json();
        const models: OllamaModel[] = data.models || [];

        // Try to get version info
        let version: string | undefined;
        try {
          const versionResponse = await fetch(`${endpoint}/api/version`, {
            signal: controller.signal
          });
          if (versionResponse.ok) {
            const versionData = await versionResponse.json();
            version = versionData.version;
          }
        } catch {
          // Version endpoint might not exist in older versions
        }

        const status: OllamaConnectionStatus = {
          connected: true,
          endpoint,
          version,
          models,
          lastChecked: new Date()
        };

        this.connectionCache.set(cacheKey, status);
        return status;

      } catch (error) {
        const status: OllamaConnectionStatus = {
          connected: false,
          endpoint,
          models: [],
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        this.connectionCache.set(cacheKey, status);
        throw error; // Re-throw for retry logic
      } finally {
        this.releaseAbortController(endpoint, controller);
      }
    }).catch((error) => {
      // Final fallback - return disconnected status
      const status: OllamaConnectionStatus = {
        connected: false,
        endpoint,
        models: [],
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.connectionCache.set(cacheKey, status);
      return status;
    });
  }

  async getAvailableModels(endpoint: string = this.defaultEndpoint): Promise<OllamaModel[]> {
    const status = await this.checkConnection(endpoint);
    return status.models;
  }

  async generateResponse(
    request: OllamaGenerateRequest,
    endpoint: string = this.defaultEndpoint
  ): Promise<OllamaGenerateResponse> {
    const url = `${endpoint}/api/generate`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamGenerate(
    request: OllamaGenerateRequest,
    endpoint: string = this.defaultEndpoint,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const url = `${endpoint}/api/generate`;
    const streamRequest = { ...request, stream: true };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamRequest)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const chunk: OllamaGenerateResponse = JSON.parse(line);
                if (chunk.response) {
                  onChunk(chunk.response);
                }
                if (chunk.done) {
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw new Error(`Failed to stream response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeNode(context: OllamaExecutionContext): Promise<OllamaExecutionResult> {
    const startTime = Date.now();
    
    try {
      const request: OllamaGenerateRequest = {
        model: context.config.model,
        prompt: context.inputs.prompt,
        system: context.config.systemPrompt,
        stream: false,
        options: {
          temperature: context.config.temperature,
          top_p: context.config.topP,
          top_k: context.config.topK,
          num_predict: context.config.maxTokens,
        }
      };

      const response = await this.generateResponse(request, context.config.endpoint);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        response: response.response,
        metadata: {
          model: response.model,
          tokens: response.eval_count || 0,
          duration: response.total_duration || 0,
          executionTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async pullModel(modelName: string, endpoint: string = this.defaultEndpoint): Promise<void> {
    const url = `${endpoint}/api/pull`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName })
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.status} ${response.statusText}`);
    }

    // Invalidate cache after pulling new model
    this.connectionCache.delete(endpoint);
  }

  async discoverInstances(): Promise<string[]> {
    // Common Ollama endpoints to check
    const commonEndpoints = [
      'http://localhost:11434',
      'http://127.0.0.1:11434',
      'http://0.0.0.0:11434',
    ];

    const activeEndpoints: string[] = [];

    for (const endpoint of commonEndpoints) {
      try {
        const status = await this.checkConnection(endpoint);
        if (status.connected) {
          activeEndpoints.push(endpoint);
        }
      } catch {
        // Ignore connection failures during discovery
      }
    }

    return activeEndpoints;
  }

  clearCache(): void {
    this.connectionCache.clear();
  }

  getCachedStatus(endpoint: string): OllamaConnectionStatus | undefined {
    return this.connectionCache.get(endpoint);
  }

  // Connection management
  abortAllConnections(endpoint?: string): void {
    if (endpoint) {
      const controllers = this.connectionPool.get(endpoint);
      if (controllers) {
        controllers.forEach(controller => controller.abort());
        this.connectionPool.set(endpoint, []);
      }
    } else {
      // Abort all connections
      this.connectionPool.forEach((controllers, endpoint) => {
        controllers.forEach(controller => controller.abort());
        this.connectionPool.set(endpoint, []);
      });
    }
  }

  getActiveConnections(endpoint?: string): number {
    if (endpoint) {
      const controllers = this.connectionPool.get(endpoint);
      return controllers ? controllers.filter(c => !c.signal.aborted).length : 0;
    } else {
      let total = 0;
      this.connectionPool.forEach(controllers => {
        total += controllers.filter(c => !c.signal.aborted).length;
      });
      return total;
    }
  }

  // Performance monitoring
  private performanceMetrics: Map<string, {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    lastRequestTime: number;
  }> = new Map();

  private recordMetric(endpoint: string, success: boolean, responseTime: number): void {
    const current = this.performanceMetrics.get(endpoint) || {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    };

    current.totalRequests++;
    if (success) {
      current.successfulRequests++;
    }

    // Update average response time
    current.averageResponseTime =
      (current.averageResponseTime * (current.totalRequests - 1) + responseTime) / current.totalRequests;

    current.lastRequestTime = Date.now();

    this.performanceMetrics.set(endpoint, current);
  }

  getPerformanceMetrics(endpoint: string) {
    return this.performanceMetrics.get(endpoint);
  }

  getAllPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics.entries());
  }

  // Check if Ollama is running with robust error handling
  async isOllamaRunning(): Promise<boolean> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`${this.defaultEndpoint}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Ollama connection timeout');
        }
        throw error;
      }
    }).catch((error) => {
      console.error('Ollama connection failed:', error);
      return false;
    });
  }

  // Get all available models with robust error handling
  async getModels(): Promise<OllamaModel[]> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.defaultEndpoint}/api/tags`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.models || [];
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Model fetch timeout');
        }
        throw error;
      }
    }).catch((error) => {
      console.error('Failed to fetch models:', error);
      return [];
    });
  }

  // Test model with real inference
  async testModel(modelName: string): Promise<{
    success: boolean;
    response?: string;
    metrics?: {
      latency: number;
      tokensPerSecond: number;
      tokenCount: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.defaultEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          prompt: 'Hello! Please respond with exactly: "Model test successful"',
          stream: false,
          options: {
            num_predict: 10,
            temperature: 0.1
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate metrics
      const tokenCount = Math.ceil(data.response.length / 4); // Rough token estimation
      const tokensPerSecond = tokenCount / (latency / 1000);

      // Update performance metrics
      this.updatePerformanceMetrics(modelName, {
        tokensPerSecond,
        latency,
        tokenCount
      });

      return {
        success: true,
        response: data.response,
        metrics: {
          latency,
          tokensPerSecond,
          tokenCount
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Model test failed for ${modelName}:`, error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get performance metrics for a model
  getModelMetrics(modelName: string): ModelPerformanceMetrics | null {
    return this.performanceCache.get(modelName) || null;
  }

  // Get all performance metrics
  getAllMetrics(): ModelPerformanceMetrics[] {
    return Array.from(this.performanceCache.values());
  }

  // Pull/download a model with progress tracking
  async pullModel(
    modelName: string,
    onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.defaultEndpoint}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const progress = JSON.parse(line);
            onProgress?.(progress);

            if (progress.error) {
              throw new Error(progress.error);
            }
          } catch (e) {
            // Ignore malformed JSON lines
          }
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to pull model ${modelName}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  // Delete a model
  async deleteModel(modelName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.defaultEndpoint}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove from performance cache
      this.performanceCache.delete(modelName);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to delete model ${modelName}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  // Update performance metrics for a model
  updatePerformanceMetrics(
    modelName: string,
    newMetrics: { tokensPerSecond: number; latency: number; tokenCount: number }
  ): ModelPerformanceMetrics {
    const existing = this.performanceCache.get(modelName) || {
      name: modelName,
      tokensPerSecond: 0,
      avgLatency: 0,
      totalRequests: 0,
      lastUsed: new Date(),
      memoryUsage: 0,
      isActive: false
    };

    const totalRequests = existing.totalRequests + 1;
    const avgLatency = (existing.avgLatency * existing.totalRequests + newMetrics.latency) / totalRequests;
    const avgTokensPerSecond = (existing.tokensPerSecond * existing.totalRequests + newMetrics.tokensPerSecond) / totalRequests;

    const updated: ModelPerformanceMetrics = {
      ...existing,
      tokensPerSecond: avgTokensPerSecond,
      avgLatency,
      totalRequests,
      lastUsed: new Date(),
      isActive: true
    };

    this.performanceCache.set(modelName, updated);
    return updated;
  }

  // Cleanup method
  cleanup(): void {
    this.abortAllConnections();
    this.connectionCache.clear();
    this.connectionPool.clear();
    this.performanceMetrics.clear();
    this.performanceCache.clear();
  }
}

// Export singleton instance
export const ollamaService = OllamaService.getInstance();
export default ollamaService;
