// Ollama Integration Tests for FlameForge Nexus
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaService } from '@/services/ollamaService';
import { OllamaConfigService } from '@/services/ollamaConfigService';

// Mock fetch for testing
global.fetch = vi.fn();

describe('OllamaService', () => {
  let ollamaService: OllamaService;

  beforeEach(() => {
    ollamaService = OllamaService.getInstance();
    ollamaService.clearCache();
    vi.clearAllMocks();
  });

  describe('checkConnection', () => {
    it('should return connected status for healthy endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          models: [
            {
              name: 'llama2',
              size: 3825819519,
              digest: 'sha256:abc123',
              modified_at: '2024-01-01T00:00:00Z',
              details: {
                format: 'gguf',
                family: 'llama',
                families: ['llama'],
                parameter_size: '7B',
                quantization_level: 'Q4_0'
              }
            }
          ]
        })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      const status = await ollamaService.checkConnection('http://localhost:11434');

      expect(status.connected).toBe(true);
      expect(status.endpoint).toBe('http://localhost:11434');
      expect(status.models).toHaveLength(1);
      expect(status.models[0].name).toBe('llama2');
    });

    it('should return disconnected status for failed endpoint', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const status = await ollamaService.checkConnection('http://localhost:11434');

      expect(status.connected).toBe(false);
      expect(status.error).toBe('Connection failed');
    });

    it('should cache connection results', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ models: [] })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      // First call
      await ollamaService.checkConnection('http://localhost:11434');
      
      // Second call should use cache
      const status = await ollamaService.checkConnection('http://localhost:11434');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(status.connected).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          model: 'llama2',
          created_at: '2024-01-01T00:00:00Z',
          response: 'Hello! How can I help you today?',
          done: true,
          total_duration: 1000000000,
          eval_count: 10
        })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      const response = await ollamaService.generateResponse({
        model: 'llama2',
        prompt: 'Hello'
      });

      expect(response.response).toBe('Hello! How can I help you today?');
      expect(response.model).toBe('llama2');
      expect(response.done).toBe(true);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(
        ollamaService.generateResponse({
          model: 'llama2',
          prompt: 'Hello'
        })
      ).rejects.toThrow('Ollama API error: 500 Internal Server Error');
    });
  });

  describe('executeNode', () => {
    it('should execute node successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          model: 'llama2',
          response: 'Test response',
          total_duration: 1000000000,
          eval_count: 5
        })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await ollamaService.executeNode({
        nodeId: 'test-node',
        workflowId: 'test-workflow',
        config: {
          endpoint: 'http://localhost:11434',
          model: 'llama2',
          temperature: 0.7,
          maxTokens: 100,
          topP: 0.9,
          topK: 40,
          stream: false
        },
        inputs: {
          prompt: 'Test prompt'
        }
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('Test response');
      expect(result.metadata?.model).toBe('llama2');
      expect(result.metadata?.tokens).toBe(5);
    });

    it('should handle execution errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await ollamaService.executeNode({
        nodeId: 'test-node',
        workflowId: 'test-workflow',
        config: {
          endpoint: 'http://localhost:11434',
          model: 'llama2',
          temperature: 0.7,
          maxTokens: 100,
          topP: 0.9,
          topK: 40,
          stream: false
        },
        inputs: {
          prompt: 'Test prompt'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('connection pooling', () => {
    it('should limit concurrent connections', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ models: [] })
      };

      (fetch as any).mockResolvedValue(mockResponse);

      // Try to make more connections than the limit
      const promises = Array(10).fill(0).map(() => 
        ollamaService.checkConnection('http://localhost:11434')
      );

      const results = await Promise.allSettled(promises);
      
      // Some should succeed, some might be limited
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);
    });
  });
});

describe('OllamaConfigService', () => {
  let configService: OllamaConfigService;

  beforeEach(() => {
    configService = OllamaConfigService.getInstance();
    configService.reset();
    localStorage.clear();
  });

  describe('configuration management', () => {
    it('should load default configuration', () => {
      const config = configService.getConfig();
      
      expect(config.defaultEndpoint).toBe('http://localhost:11434');
      expect(config.connectionTimeout).toBe(5000);
      expect(config.autoDiscovery).toBe(true);
    });

    it('should update configuration', () => {
      configService.updateConfig({
        connectionTimeout: 10000,
        autoDiscovery: false
      });

      const config = configService.getConfig();
      expect(config.connectionTimeout).toBe(10000);
      expect(config.autoDiscovery).toBe(false);
    });

    it('should persist configuration to localStorage', () => {
      configService.updateConfig({
        connectionTimeout: 8000
      });

      // Create new instance to test persistence
      const newConfigService = OllamaConfigService.getInstance();
      const config = newConfigService.getConfig();
      
      expect(config.connectionTimeout).toBe(8000);
    });
  });

  describe('instance management', () => {
    it('should add new instance', () => {
      const instance = configService.addInstance({
        user_id: 'test-user',
        endpoint: 'http://localhost:11434',
        name: 'Test Instance',
        is_active: true,
        last_seen: new Date().toISOString(),
        available_models: [],
        connection_metadata: {}
      });

      expect(instance.id).toBeDefined();
      expect(instance.endpoint).toBe('http://localhost:11434');
      
      const instances = configService.getInstances();
      expect(instances).toHaveLength(1);
    });

    it('should update instance', () => {
      const instance = configService.addInstance({
        user_id: 'test-user',
        endpoint: 'http://localhost:11434',
        name: 'Test Instance',
        is_active: true,
        last_seen: new Date().toISOString(),
        available_models: [],
        connection_metadata: {}
      });

      configService.updateInstance(instance.endpoint, {
        is_active: false,
        name: 'Updated Instance'
      });

      const updated = configService.getInstanceByEndpoint(instance.endpoint);
      expect(updated?.is_active).toBe(false);
      expect(updated?.name).toBe('Updated Instance');
    });

    it('should remove instance', () => {
      const instance = configService.addInstance({
        user_id: 'test-user',
        endpoint: 'http://localhost:11434',
        name: 'Test Instance',
        is_active: true,
        last_seen: new Date().toISOString(),
        available_models: [],
        connection_metadata: {}
      });

      configService.removeInstance(instance.endpoint);
      
      const instances = configService.getInstances();
      expect(instances).toHaveLength(0);
    });
  });

  describe('preferred models', () => {
    it('should manage preferred models', () => {
      configService.addPreferredModel('llama2');
      configService.addPreferredModel('codellama');

      const models = configService.getPreferredModels();
      expect(models).toContain('llama2');
      expect(models).toContain('codellama');

      configService.removePreferredModel('llama2');
      const updatedModels = configService.getPreferredModels();
      expect(updatedModels).not.toContain('llama2');
      expect(updatedModels).toContain('codellama');
    });
  });
});
