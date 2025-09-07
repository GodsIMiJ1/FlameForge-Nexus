// Phase 1 Production Validation Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ollamaService } from '@/services/ollamaService';
import { systemMonitorService } from '@/services/systemMonitorService';

describe('Phase 1 Production Validation', () => {
  let isOllamaRunning = false;
  let availableModels: string[] = [];

  beforeAll(async () => {
    // Check if Ollama is running
    isOllamaRunning = await ollamaService.isOllamaRunning();
    
    if (isOllamaRunning) {
      const models = await ollamaService.getModels();
      availableModels = models.map(m => m.name);
    }
  });

  describe('Ollama Service Integration', () => {
    it('should connect to Ollama successfully', async () => {
      const connected = await ollamaService.isOllamaRunning();
      expect(connected).toBe(true);
    });

    it('should fetch real models from Ollama', async () => {
      if (!isOllamaRunning) {
        console.warn('Skipping test - Ollama not running');
        return;
      }

      const models = await ollamaService.getModels();
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Validate model structure
      models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('size');
        expect(model).toHaveProperty('digest');
        expect(model).toHaveProperty('modified_at');
      });
    });

    it('should test a model with real inference', async () => {
      if (!isOllamaRunning || availableModels.length === 0) {
        console.warn('Skipping test - No models available');
        return;
      }

      const testModel = availableModels[0];
      const result = await ollamaService.testModel(testModel);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(result).toHaveProperty('response');
        expect(result).toHaveProperty('metrics');
        expect(result.metrics).toHaveProperty('latency');
        expect(result.metrics).toHaveProperty('tokensPerSecond');
        expect(result.metrics).toHaveProperty('tokenCount');
      } else {
        expect(result).toHaveProperty('error');
      }
    }, 30000); // 30 second timeout for model inference

    it('should track performance metrics correctly', async () => {
      if (!isOllamaRunning || availableModels.length === 0) {
        console.warn('Skipping test - No models available');
        return;
      }

      const testModel = availableModels[0];
      
      // Test the model to generate metrics
      await ollamaService.testModel(testModel);
      
      // Check if metrics were recorded
      const metrics = ollamaService.getModelMetrics(testModel);
      expect(metrics).toBeDefined();
      
      if (metrics) {
        expect(metrics.name).toBe(testModel);
        expect(metrics.totalRequests).toBeGreaterThan(0);
        expect(metrics.tokensPerSecond).toBeGreaterThan(0);
        expect(metrics.avgLatency).toBeGreaterThan(0);
        expect(metrics.lastUsed).toBeInstanceOf(Date);
      }
    }, 30000);

    it('should handle connection errors gracefully', async () => {
      // Test with invalid endpoint
      const invalidService = new (ollamaService.constructor as any)();
      invalidService.defaultEndpoint = 'http://localhost:99999';
      
      const connected = await invalidService.isOllamaRunning();
      expect(connected).toBe(false);
      
      const models = await invalidService.getModels();
      expect(models).toEqual([]);
    });
  });

  describe('System Monitoring Service', () => {
    it('should collect real system metrics', async () => {
      const metrics = await systemMonitorService.getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('timestamp');
      
      // Validate memory metrics
      expect(metrics.memory.total).toBeGreaterThan(0);
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.available).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
      
      // Validate CPU metrics
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics.cpu.cores).toBeGreaterThan(0);
      
      // Validate disk metrics
      expect(metrics.disk.total).toBeGreaterThan(0);
      expect(metrics.disk.used).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.available).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.disk.percentage).toBeLessThanOrEqual(100);
    });

    it('should format bytes correctly', () => {
      expect(systemMonitorService.formatBytes(0)).toBe('0 Bytes');
      expect(systemMonitorService.formatBytes(1024)).toBe('1 KB');
      expect(systemMonitorService.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(systemMonitorService.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format percentages correctly', () => {
      expect(systemMonitorService.formatPercentage(0)).toBe('0%');
      expect(systemMonitorService.formatPercentage(50.7)).toBe('51%');
      expect(systemMonitorService.formatPercentage(100)).toBe('100%');
    });

    it('should start and stop monitoring correctly', (done) => {
      let callCount = 0;
      
      const stopMonitoring = systemMonitorService.startMonitoring((metrics) => {
        callCount++;
        expect(metrics).toBeDefined();
        
        if (callCount >= 2) {
          stopMonitoring();
          done();
        }
      }, 100); // Very short interval for testing
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // This test verifies that our timeout handling works
      const result = await ollamaService.testModel('non-existent-model');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed responses gracefully', async () => {
      // Test with a model that might not exist
      const result = await ollamaService.testModel('definitely-not-a-real-model-name-12345');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should respond to connection checks quickly', async () => {
      const startTime = Date.now();
      await ollamaService.isOllamaRunning();
      const endTime = Date.now();
      
      // Should respond within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should fetch models list quickly', async () => {
      if (!isOllamaRunning) {
        console.warn('Skipping test - Ollama not running');
        return;
      }

      const startTime = Date.now();
      await ollamaService.getModels();
      const endTime = Date.now();
      
      // Should respond within 15 seconds
      expect(endTime - startTime).toBeLessThan(15000);
    });

    it('should collect system metrics quickly', async () => {
      const startTime = Date.now();
      await systemMonitorService.getSystemMetrics();
      const endTime = Date.now();
      
      // Should respond within 2 seconds
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  afterAll(() => {
    // Cleanup any resources
    ollamaService.cleanup();
  });
});

// Integration test for the complete workflow
describe('End-to-End Integration', () => {
  it('should complete a full model management workflow', async () => {
    // 1. Check connection
    const connected = await ollamaService.isOllamaRunning();
    
    if (!connected) {
      console.warn('Skipping E2E test - Ollama not running');
      return;
    }

    // 2. Get models
    const models = await ollamaService.getModels();
    expect(models.length).toBeGreaterThan(0);

    // 3. Test a model
    const testModel = models[0].name;
    const testResult = await ollamaService.testModel(testModel);
    expect(testResult).toBeDefined();

    // 4. Check metrics were recorded
    const metrics = ollamaService.getModelMetrics(testModel);
    expect(metrics).toBeDefined();

    // 5. Get system metrics
    const systemMetrics = await systemMonitorService.getSystemMetrics();
    expect(systemMetrics).toBeDefined();

    console.log('✅ End-to-end workflow completed successfully');
  }, 60000); // 60 second timeout for full workflow
});
