// Advanced Workflow Execution Engine with Retry Logic & Checkpoints
// Add to src/services/workflow/advancedExecutionEngine.ts

import { EventEmitter } from 'events';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

export interface ExecutionCheckpoint {
  id: string;
  executionId: string;
  nodeId: string;
  timestamp: Date;
  state: 'completed' | 'failed' | 'retrying';
  inputData: any;
  outputData?: any;
  errorDetails?: string;
  retryAttempt: number;
}

export interface RetryConfiguration {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  retryableErrors: string[]; // Error patterns that should trigger retry
  skipRetryErrors: string[]; // Error patterns that should NOT retry
}

export interface WorkflowConfiguration {
  enableCheckpoints: boolean;
  enableRetry: boolean;
  globalRetryConfig: RetryConfiguration;
  nodeRetryConfigs: Record<string, RetryConfiguration>;
  pauseOnError: boolean;
  enableParallelExecution: boolean;
  executionTimeout: number; // milliseconds
  checkpointInterval: number; // Save checkpoint every N successful nodes
}

export interface AdvancedExecutionContext {
  executionId: string;
  workflowId: string;
  variables: Record<string, any>;
  checkpoints: ExecutionCheckpoint[];
  failedNodes: string[];
  retriedNodes: Record<string, number>;
  pausedAt?: string; // nodeId where execution was paused
  resumeFrom?: string; // nodeId to resume from
  startTime: Date;
  configuration: WorkflowConfiguration;
}

export class AdvancedWorkflowExecutionEngine extends EventEmitter {
  private executions = new Map<string, AdvancedExecutionContext>();
  private defaultConfig: WorkflowConfiguration = {
    enableCheckpoints: true,
    enableRetry: true,
    globalRetryConfig: {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['timeout', 'network', 'rate_limit', 'temporary'],
      skipRetryErrors: ['authentication', 'authorization', 'validation', 'not_found'],
    },
    nodeRetryConfigs: {},
    pauseOnError: false,
    enableParallelExecution: true,
    executionTimeout: 300000, // 5 minutes
    checkpointInterval: 5,
  };

  async executeWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    variables: Record<string, any> = {},
    config?: Partial<WorkflowConfiguration>
  ): Promise<string> {
    const executionId = this.generateExecutionId();
    const configuration = { ...this.defaultConfig, ...config };

    const context: AdvancedExecutionContext = {
      executionId,
      workflowId: `workflow_${Date.now()}`,
      variables,
      checkpoints: [],
      failedNodes: [],
      retriedNodes: {},
      startTime: new Date(),
      configuration,
    };

    this.executions.set(executionId, context);

    this.emit('workflow:started', {
      executionId,
      workflowId: context.workflowId,
      nodeCount: nodes.length,
      configuration,
    });

    try {
      await this.executeWithConfiguration(nodes, edges, context);
      
      this.emit('workflow:completed', {
        executionId,
        duration: Date.now() - context.startTime.getTime(),
        checkpoints: context.checkpoints.length,
        retries: Object.values(context.retriedNodes).reduce((sum, attempts) => sum + attempts, 0),
      });

      return executionId;
    } catch (error) {
      this.emit('workflow:failed', {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        failedNodes: context.failedNodes,
        checkpoints: context.checkpoints.length,
      });
      throw error;
    } finally {
      // Cleanup after a delay to allow for inspection
      setTimeout(() => this.executions.delete(executionId), 60000);
    }
  }

  async resumeWorkflow(executionId: string, fromNodeId?: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found or expired`);
    }

    context.resumeFrom = fromNodeId || context.pausedAt;
    context.pausedAt = undefined;

    this.emit('workflow:resumed', {
      executionId,
      resumeFrom: context.resumeFrom,
    });

    // Re-execute from checkpoint or specified node
    // This would involve re-parsing the workflow and continuing execution
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    context.pausedAt = 'current'; // Would be set to current executing node
    
    this.emit('workflow:paused', {
      executionId,
      pausedAt: context.pausedAt,
    });
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    this.emit('workflow:cancelled', { executionId });
    this.executions.delete(executionId);
  }

  private async executeWithConfiguration(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: AdvancedExecutionContext
  ): Promise<void> {
    const dependencyMap = this.buildDependencyMap(nodes, edges);
    const completedNodes = new Set<string>();
    const processingNodes = new Set<string>();

    // Resume from checkpoint if specified
    if (context.resumeFrom) {
      // Mark nodes before resume point as completed
      const resumeIndex = nodes.findIndex(n => n.id === context.resumeFrom);
      for (let i = 0; i < resumeIndex; i++) {
        completedNodes.add(nodes[i].id);
      }
    }

    while (completedNodes.size < nodes.length) {
      const readyNodes = nodes.filter(node => 
        !completedNodes.has(node.id) && 
        !processingNodes.has(node.id) &&
        this.areDepsSatisfied(node.id, dependencyMap, completedNodes)
      );

      if (readyNodes.length === 0) {
        const remainingNodes = nodes.filter(n => !completedNodes.has(n.id));
        if (remainingNodes.length > 0) {
          throw new Error(`Circular dependency or unresolvable nodes: ${remainingNodes.map(n => n.id).join(', ')}`);
        }
        break;
      }

      if (context.configuration.enableParallelExecution) {
        // Execute ready nodes in parallel
        await Promise.all(readyNodes.map(async (node) => {
          processingNodes.add(node.id);
          try {
            await this.executeNodeWithRetry(node, context);
            completedNodes.add(node.id);
          } catch (error) {
            if (!context.configuration.pauseOnError) {
              context.failedNodes.push(node.id);
              completedNodes.add(node.id); // Mark as processed even if failed
            } else {
              context.pausedAt = node.id;
              throw error;
            }
          } finally {
            processingNodes.delete(node.id);
          }
        }));
      } else {
        // Execute nodes sequentially
        for (const node of readyNodes) {
          processingNodes.add(node.id);
          try {
            await this.executeNodeWithRetry(node, context);
            completedNodes.add(node.id);
          } catch (error) {
            if (!context.configuration.pauseOnError) {
              context.failedNodes.push(node.id);
              completedNodes.add(node.id); // Mark as processed even if failed
            } else {
              context.pausedAt = node.id;
              throw error;
            }
          } finally {
            processingNodes.delete(node.id);
          }
        }
      }

      // Create checkpoint if enabled
      if (context.configuration.enableCheckpoints && 
          completedNodes.size % context.configuration.checkpointInterval === 0) {
        await this.createCheckpoint(context, Array.from(completedNodes));
      }
    }
  }

  private async executeNodeWithRetry(
    node: WorkflowNode,
    context: AdvancedExecutionContext
  ): Promise<any> {
    const retryConfig = context.configuration.nodeRetryConfigs[node.id] || 
                      context.configuration.globalRetryConfig;
    
    let lastError: Error | null = null;
    const maxAttempts = context.configuration.enableRetry ? retryConfig.maxAttempts : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.emit('node:attempt_started', {
          executionId: context.executionId,
          nodeId: node.id,
          attempt,
          maxAttempts,
        });

        const result = await this.executeNode(node, context);

        this.emit('node:completed', {
          executionId: context.executionId,
          nodeId: node.id,
          attempt,
          result,
        });

        // Update retry counter
        if (attempt > 1) {
          context.retriedNodes[node.id] = (context.retriedNodes[node.id] || 0) + (attempt - 1);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.emit('node:attempt_failed', {
          executionId: context.executionId,
          nodeId: node.id,
          attempt,
          error: lastError.message,
        });

        // Check if this error should be retried
        if (attempt === maxAttempts || !this.shouldRetryError(lastError, retryConfig)) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        
        this.emit('node:retry_scheduled', {
          executionId: context.executionId,
          nodeId: node.id,
          attempt: attempt + 1,
          delay,
        });

        await this.sleep(delay);
      }
    }

    // All retry attempts failed
    const totalAttempts = Math.min(maxAttempts, context.retriedNodes[node.id] + 1);
    context.retriedNodes[node.id] = totalAttempts - 1;

    this.emit('node:failed', {
      executionId: context.executionId,
      nodeId: node.id,
      totalAttempts,
      finalError: lastError?.message,
    });

    throw lastError || new Error('Node execution failed');
  }

  private async executeNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    // Set execution timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Node execution timeout')), context.configuration.executionTimeout);
    });

    const executionPromise = this.performNodeExecution(node, context);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private async performNodeExecution(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    // This would call the actual node execution logic based on node type
    switch (node.type) {
      case 'ollama':
        return this.executeOllamaNode(node, context);
      case 'agent':
        return this.executeAgentNode(node, context);
      case 'tool':
        return this.executeToolNode(node, context);
      case 'decision':
        return this.executeDecisionNode(node, context);
      case 'database':
        return this.executeDatabaseNode(node, context);
      case 'email':
        return this.executeEmailNode(node, context);
      case 'webhook':
        return this.executeWebhookNode(node, context);
      case 'file':
        return this.executeFileNode(node, context);
      case 'scheduler':
        return this.executeSchedulerNode(node, context);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private shouldRetryError(error: Error, config: RetryConfiguration): boolean {
    const errorMessage = error.message.toLowerCase();

    // Check if error should not be retried
    for (const skipPattern of config.skipRetryErrors) {
      if (errorMessage.includes(skipPattern.toLowerCase())) {
        return false;
      }
    }

    // Check if error should be retried
    for (const retryPattern of config.retryableErrors) {
      if (errorMessage.includes(retryPattern.toLowerCase())) {
        return true;
      }
    }

    // Default: retry for generic errors
    return true;
  }

  private calculateRetryDelay(attempt: number, config: RetryConfiguration): number {
    let delay: number;

    switch (config.backoffStrategy) {
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = config.baseDelay;
        break;
    }

    return Math.min(delay, config.maxDelay);
  }

  private async createCheckpoint(
    context: AdvancedExecutionContext,
    completedNodeIds: string[]
  ): Promise<void> {
    const checkpoint: ExecutionCheckpoint = {
      id: this.generateCheckpointId(),
      executionId: context.executionId,
      nodeId: completedNodeIds[completedNodeIds.length - 1],
      timestamp: new Date(),
      state: 'completed',
      inputData: context.variables,
      retryAttempt: 0,
    };

    context.checkpoints.push(checkpoint);

    this.emit('checkpoint:created', {
      executionId: context.executionId,
      checkpointId: checkpoint.id,
      completedNodes: completedNodeIds.length,
    });

    // Persist checkpoint to database
    await this.persistCheckpoint(checkpoint);
  }

  private async persistCheckpoint(checkpoint: ExecutionCheckpoint): Promise<void> {
    // Save checkpoint to database for recovery
    // This would use the Supabase client to store checkpoint data
    console.log('Persisting checkpoint:', checkpoint.id);
  }

  // Node execution methods (simplified implementations)
  private async executeOllamaNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    // Simulate Ollama API call
    await this.sleep(1000 + Math.random() * 2000);
    
    if (Math.random() < 0.1) { // 10% chance of failure for demo
      throw new Error('Ollama model timeout');
    }

    const result = {
      response: `AI response from ${node.data.model || 'llama2'}`,
      model: node.data.model || 'llama2',
      executionTime: Date.now() - startTime,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeAgentNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    await this.sleep(800 + Math.random() * 1500);
    
    if (Math.random() < 0.05) { // 5% chance of failure
      throw new Error('Agent API rate limit exceeded');
    }

    const result = {
      response: `Agent processed: ${node.data.prompt || 'default prompt'}`,
      agent: node.data.agent || 'default',
      executionTime: Date.now() - startTime,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeToolNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    await this.sleep(500 + Math.random() * 1000);
    
    if (Math.random() < 0.08) { // 8% chance of failure
      throw new Error('Tool execution network error');
    }

    const result = {
      response: `Tool executed: ${node.data.tool || 'default tool'}`,
      executionTime: Date.now() - startTime,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeDecisionNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const condition = node.data.condition || 'true';
    const result = Math.random() > 0.5; // Random decision for demo
    
    context.variables[`${node.id}_output`] = result;
    return { decision: result, condition };
  }

  private async executeDatabaseNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const startTime = Date.now();
    
    await this.sleep(300 + Math.random() * 800);
    
    if (Math.random() < 0.03) { // 3% chance of failure
      throw new Error('Database connection timeout');
    }

    const result = {
      query: node.data.query || 'SELECT * FROM table',
      rows: Math.floor(Math.random() * 100),
      executionTime: Date.now() - startTime,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeEmailNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    await this.sleep(400 + Math.random() * 600);
    
    const result = {
      to: node.data.to || 'user@example.com',
      subject: node.data.subject || 'Workflow Notification',
      sent: true,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeWebhookNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    await this.sleep(200 + Math.random() * 500);
    
    if (Math.random() < 0.12) { // 12% chance of failure
      throw new Error('Webhook endpoint not available');
    }

    const result = {
      url: node.data.url || 'https://api.example.com/webhook',
      method: node.data.method || 'POST',
      status: 200,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeFileNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    await this.sleep(150 + Math.random() * 300);
    
    const result = {
      operation: node.data.operation || 'read',
      file: node.data.file || 'data.txt',
      size: Math.floor(Math.random() * 10000),
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  private async executeSchedulerNode(node: WorkflowNode, context: AdvancedExecutionContext): Promise<any> {
    const result = {
      schedule: node.data.schedule || '0 0 * * *',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scheduled: true,
    };

    context.variables[`${node.id}_output`] = result;
    return result;
  }

  // Utility methods
  private buildDependencyMap(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, string[]> {
    const deps = new Map<string, string[]>();
    
    for (const node of nodes) {
      deps.set(node.id, []);
    }
    
    for (const edge of edges) {
      const targetDeps = deps.get(edge.target) || [];
      targetDeps.push(edge.source);
      deps.set(edge.target, targetDeps);
    }
    
    return deps;
  }

  private areDepsSatisfied(nodeId: string, deps: Map<string, string[]>, completed: Set<string>): boolean {
    const nodeDeps = deps.get(nodeId) || [];
    return nodeDeps.every(dep => completed.has(dep));
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCheckpointId(): string {
    return `chkpt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API for getting execution info
  getExecutionContext(executionId: string): AdvancedExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  getActiveExecutions(): AdvancedExecutionContext[] {
    return Array.from(this.executions.values());
  }

  getCheckpoints(executionId: string): ExecutionCheckpoint[] {
    const context = this.executions.get(executionId);
    return context?.checkpoints || [];
  }

  getRetryStatistics(executionId: string): Record<string, number> {
    const context = this.executions.get(executionId);
    return context?.retriedNodes || {};
  }
}