// services/workflowExecutionEngine.ts
import { EventEmitter } from 'events';
import { createClient } from '@supabase/supabase-js';

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled' | 'paused';

export interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeStatus;
  output?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  userId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  executionId: string;
  startTime: Date;
}

export class WorkflowExecutionEngine extends EventEmitter {
  private supabase: any;
  private activeExecutions: Map<string, WorkflowExecutionContext> = new Map();
  private nodeStatusMap: Map<string, NodeStatus> = new Map();
  private nodeExecutors: Map<string, (node: WorkflowNode, context: WorkflowExecutionContext) => Promise<any>> = new Map();

  constructor(supabaseClient: any) {
    super();
    this.supabase = supabaseClient;
    this.registerDefaultExecutors();
  }

  // Register node executors
  registerNodeExecutor(
    nodeType: string, 
    executor: (node: WorkflowNode, context: WorkflowExecutionContext) => Promise<any>
  ) {
    this.nodeExecutors.set(nodeType, executor);
  }

  // Start workflow execution
  async executeWorkflow(
    workflowId: string, 
    userId: string, 
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[],
    variables: Record<string, any> = {}
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: WorkflowExecutionContext = {
      workflowId,
      userId,
      nodes,
      edges,
      variables,
      executionId,
      startTime: new Date()
    };

    this.activeExecutions.set(executionId, context);

    // Log execution start
    await this.logExecutionEvent(executionId, 'workflow_started', { workflowId, userId });

    this.emit('workflow:started', { executionId, workflowId });

    try {
      // Build execution graph
      const executionGraph = this.buildExecutionGraph(nodes, edges);
      
      // Execute nodes
      await this.executeNodeGraph(executionGraph, context);
      
      this.emit('workflow:completed', { executionId, workflowId });
      
    } catch (error) {
      this.emit('workflow:error', { executionId, workflowId, error });
      await this.logExecutionEvent(executionId, 'workflow_error', { error: error.message });
    } finally {
      this.activeExecutions.delete(executionId);
    }

    return executionId;
  }

  // Build execution graph with dependency tracking
  private buildExecutionGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    const graph = new Map<string, {
      node: WorkflowNode;
      dependencies: string[];
      dependents: string[];
    }>();

    // Initialize nodes
    nodes.forEach(node => {
      graph.set(node.id, {
        node,
        dependencies: [],
        dependents: []
      });
    });

    // Build dependencies
    edges.forEach(edge => {
      const sourceNode = graph.get(edge.source);
      const targetNode = graph.get(edge.target);
      
      if (sourceNode && targetNode) {
        targetNode.dependencies.push(edge.source);
        sourceNode.dependents.push(edge.target);
      }
    });

    return graph;
  }

  // Execute nodes in correct order (topological sort + parallel execution)
  private async executeNodeGraph(
    graph: Map<string, any>, 
    context: WorkflowExecutionContext
  ): Promise<void> {
    const completed = new Set<string>();
    const running = new Set<string>();
    const failed = new Set<string>();

    // Find nodes with no dependencies (starting nodes)
    const getReadyNodes = () => {
      return Array.from(graph.entries())
        .filter(([nodeId, nodeData]) => 
          !completed.has(nodeId) && 
          !running.has(nodeId) && 
          !failed.has(nodeId) &&
          nodeData.dependencies.every(depId => completed.has(depId))
        )
        .map(([nodeId]) => nodeId);
    };

    while (completed.size + failed.size < graph.size) {
      const readyNodes = getReadyNodes();
      
      if (readyNodes.length === 0 && running.size === 0) {
        // Deadlock or all remaining nodes failed
        break;
      }

      // Execute ready nodes in parallel
      const executionPromises = readyNodes.map(async (nodeId) => {
        running.add(nodeId);
        const nodeData = graph.get(nodeId)!;
        
        try {
          this.setNodeStatus(nodeId, 'running');
          this.emit('node:started', { nodeId, executionId: context.executionId });

          const result = await this.executeNode(nodeData.node, context);
          
          this.setNodeStatus(nodeId, 'completed');
          completed.add(nodeId);
          running.delete(nodeId);
          
          this.emit('node:completed', { 
            nodeId, 
            executionId: context.executionId, 
            result 
          });

          await this.logExecutionEvent(context.executionId, 'node_completed', {
            nodeId,
            nodeType: nodeData.node.type,
            result
          });

        } catch (error) {
          this.setNodeStatus(nodeId, 'error');
          failed.add(nodeId);
          running.delete(nodeId);
          
          this.emit('node:error', { 
            nodeId, 
            executionId: context.executionId, 
            error 
          });

          await this.logExecutionEvent(context.executionId, 'node_error', {
            nodeId,
            nodeType: nodeData.node.type,
            error: error.message
          });

          // Implement retry logic
          if (this.shouldRetryNode(nodeData.node, error)) {
            await this.scheduleNodeRetry(nodeId, nodeData.node, context, error);
          }
        }
      });

      await Promise.all(executionPromises);
    }
  }

  // Execute individual node
  private async executeNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const executor = this.nodeExecutors.get(node.type);
    
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    const startTime = Date.now();
    
    try {
      const result = await executor(node, context);
      const executionTime = Date.now() - startTime;
      
      // Store result in context variables
      context.variables[`node_${node.id}_output`] = result;
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw error;
    }
  }

  // Node status management
  private setNodeStatus(nodeId: string, status: NodeStatus) {
    this.nodeStatusMap.set(nodeId, status);
    this.emit('node:status_changed', { nodeId, status });
  }

  getNodeStatus(nodeId: string): NodeStatus {
    return this.nodeStatusMap.get(nodeId) || 'idle';
  }

  // Retry logic
  private shouldRetryNode(node: WorkflowNode, error: any): boolean {
    const retryConfig = node.data?.retry || { enabled: false, maxAttempts: 3, delay: 1000 };
    const currentAttempts = node.data?._retryAttempts || 0;
    
    return retryConfig.enabled && currentAttempts < retryConfig.maxAttempts;
  }

  private async scheduleNodeRetry(
    nodeId: string, 
    node: WorkflowNode, 
    context: WorkflowExecutionContext, 
    error: any
  ) {
    const retryConfig = node.data?.retry || { delay: 1000 };
    const currentAttempts = (node.data._retryAttempts || 0) + 1;
    
    node.data._retryAttempts = currentAttempts;
    
    setTimeout(async () => {
      try {
        this.setNodeStatus(nodeId, 'running');
        const result = await this.executeNode(node, context);
        this.setNodeStatus(nodeId, 'completed');
        
        this.emit('node:retry_success', { nodeId, attempt: currentAttempts, result });
      } catch (retryError) {
        this.emit('node:retry_failed', { nodeId, attempt: currentAttempts, error: retryError });
        
        if (this.shouldRetryNode(node, retryError)) {
          await this.scheduleNodeRetry(nodeId, node, context, retryError);
        } else {
          this.setNodeStatus(nodeId, 'error');
        }
      }
    }, retryConfig.delay);
  }

  // Execution logging
  private async logExecutionEvent(
    executionId: string, 
    eventType: string, 
    eventData: any
  ) {
    try {
      await this.supabase
        .from('workflow_events')
        .insert({
          execution_id: executionId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log execution event:', error);
    }
  }

  // Pause/Resume functionality
  async pauseWorkflow(executionId: string) {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      this.emit('workflow:paused', { executionId });
      await this.logExecutionEvent(executionId, 'workflow_paused', {});
    }
  }

  async cancelWorkflow(executionId: string) {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      this.activeExecutions.delete(executionId);
      this.emit('workflow:cancelled', { executionId });
      await this.logExecutionEvent(executionId, 'workflow_cancelled', {});
    }
  }

  // Register default node executors
  private registerDefaultExecutors() {
    // Agent Node Executor
    this.registerNodeExecutor('agent', async (node: WorkflowNode, context: WorkflowExecutionContext) => {
      const { apiKey, model, prompt, temperature = 0.7 } = node.data;
      
      // This would call your AI service (OpenAI, Anthropic, etc.)
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, prompt, temperature })
      });
      
      if (!response.ok) {
        throw new Error(`AI API failed: ${response.statusText}`);
      }
      
      return await response.json();
    });

    // Tool Node Executor
    this.registerNodeExecutor('tool', async (node: WorkflowNode, context: WorkflowExecutionContext) => {
      const { url, method = 'GET', headers = {}, body } = node.data;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    });

    // Decision Node Executor
    this.registerNodeExecutor('decision', async (node: WorkflowNode, context: WorkflowExecutionContext) => {
      const { condition, trueValue, falseValue } = node.data;
      
      // Simple condition evaluation (you might want to use a proper expression parser)
      const result = this.evaluateCondition(condition, context);
      
      return result ? trueValue : falseValue;
    });

    // Ollama Node Executor
    this.registerNodeExecutor('ollama', async (node: WorkflowNode, context: WorkflowExecutionContext) => {
      const { endpoint, model, prompt, systemPrompt, options } = node.data;
      
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system: systemPrompt,
          stream: false,
          options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.response;
    });
  }

  // Simple condition evaluator (extend as needed)
  private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
    // Very basic implementation - you might want to use a proper expression parser
    try {
      // Replace variables in condition
      let evaluatedCondition = condition;
      Object.entries(context.variables).forEach(([key, value]) => {
        evaluatedCondition = evaluatedCondition.replace(
          new RegExp(`\\$\\{${key}\\}`, 'g'), 
          JSON.stringify(value)
        );
      });
      
      // Use Function constructor for safe evaluation (better than eval)
      return new Function('return ' + evaluatedCondition)();
    } catch (error) {
      console.error('Condition evaluation failed:', error);
      return false;
    }
  }

  // Get execution status
  getExecutionStatus(executionId: string) {
    return this.activeExecutions.has(executionId) ? 'running' : 'completed';
  }

  // Get all node statuses for an execution
  getAllNodeStatuses(): Record<string, NodeStatus> {
    return Object.fromEntries(this.nodeStatusMap);
  }
}