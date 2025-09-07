// services/ollamaService.ts
import { OllamaModel, OllamaGenerateRequest, OllamaGenerateResponse, OllamaConnectionStatus } from '../types/ollama';

export class OllamaService {
  private static instance: OllamaService;
  private connectionCache: Map<string, OllamaConnectionStatus> = new Map();
  private readonly defaultEndpoint = 'http://localhost:11434';

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  async checkConnection(endpoint: string = this.defaultEndpoint): Promise<OllamaConnectionStatus> {
    const cacheKey = endpoint;
    const cached = this.connectionCache.get(cacheKey);
    
    // Return cached result if checked within last 30 seconds
    if (cached && Date.now() - cached.lastChecked.getTime() < 30000) {
      return cached;
    }

    try {
      // Check if Ollama is running
      const healthResponse = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!healthResponse.ok) {
        throw new Error(`HTTP ${healthResponse.status}`);
      }

      const data = await healthResponse.json();
      const models: OllamaModel[] = data.models || [];

      // Try to get version info
      let version: string | undefined;
      try {
        const versionResponse = await fetch(`${endpoint}/api/version`);
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
      return status;
    }
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

  clearCache(): void {
    this.connectionCache.clear();
  }
}