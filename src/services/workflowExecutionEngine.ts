// Enhanced Workflow Execution Engine with Real-time Monitoring
export class WorkflowExecutionEngine {
  private activeExecutions = new Map<string, any>();
  private nodeStatusMap = new Map<string, string>();
  private eventListeners = new Map<string, Function[]>();
  private executors = new Map<string, Function>();

  constructor() {
    this.registerDefaultExecutors();
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  removeAllListeners() {
    this.eventListeners.clear();
  }

  // Register node executors
  registerNodeExecutor(nodeType: string, executor: Function) {
    this.executors.set(nodeType, executor);
  }

  // Execute workflow
  async executeWorkflow(workflowId: string, userId: string, nodes: any[], edges: any[], variables: any = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const context = {
      workflowId,
      userId,
      nodes,
      edges,
      variables,
      executionId,
      startTime: new Date()
    };

    this.activeExecutions.set(executionId, context);
    this.emit('workflow:started', { executionId, workflowId });

    try {
      const executionGraph = this.buildExecutionGraph(nodes, edges);
      await this.executeNodeGraph(executionGraph, context);
      this.emit('workflow:completed', { executionId, workflowId });
    } catch (error) {
      this.emit('workflow:error', { executionId, workflowId, error });
    } finally {
      this.activeExecutions.delete(executionId);
    }

    return executionId;
  }

  // Build execution graph
  buildExecutionGraph(nodes: any[], edges: any[]) {
    const graph = new Map();
    
    nodes.forEach(node => {
      graph.set(node.id, {
        node,
        dependencies: [],
        dependents: []
      });
    });

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

  // Execute node graph
  async executeNodeGraph(graph: Map<string, any>, context: any) {
    const completed = new Set<string>();
    const running = new Set<string>();
    const failed = new Set<string>();

    const getReadyNodes = () => {
      return Array.from(graph.entries())
        .filter(([nodeId, nodeData]) => 
          !completed.has(nodeId) && 
          !running.has(nodeId) && 
          !failed.has(nodeId) &&
          nodeData.dependencies.every((depId: string) => completed.has(depId))
        )
        .map(([nodeId]) => nodeId);
    };

    while (completed.size + failed.size < graph.size) {
      const readyNodes = getReadyNodes();
      
      if (readyNodes.length === 0 && running.size === 0) {
        break;
      }

      const executionPromises = readyNodes.map(async (nodeId) => {
        running.add(nodeId);
        const nodeData = graph.get(nodeId);
        
        try {
          this.setNodeStatus(nodeId, 'running');
          const result = await this.executeNode(nodeData.node, context);
          this.setNodeStatus(nodeId, 'completed');
          completed.add(nodeId);
          running.delete(nodeId);
          
          return { nodeId, result, status: 'completed' };
        } catch (error) {
          this.setNodeStatus(nodeId, 'error');
          failed.add(nodeId);
          running.delete(nodeId);
          
          return { nodeId, error, status: 'error' };
        }
      });

      await Promise.allSettled(executionPromises);
    }
  }

  // Execute individual node
  async executeNode(node: any, context: any) {
    const executor = this.executors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    const startTime = Date.now();
    
    try {
      const result = await executor(node, context);
      const executionTime = Date.now() - startTime;
      
      context.variables[`node_${node.id}_output`] = result;
      
      this.emit('node:executed', {
        nodeId: node.id,
        result,
        executionTime,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.emit('node:executed', {
        nodeId: node.id,
        error: (error as Error).message,
        executionTime,
        status: 'error'
      });
      
      throw error;
    }
  }

  // Node status management
  setNodeStatus(nodeId: string, status: string) {
    this.nodeStatusMap.set(nodeId, status);
    this.emit('node:status_changed', { nodeId, status });
  }

  getNodeStatus(nodeId: string) {
    return this.nodeStatusMap.get(nodeId) || 'idle';
  }

  getAllNodeStatuses() {
    return Object.fromEntries(this.nodeStatusMap);
  }

  // Register default executors
  registerDefaultExecutors() {
    // Ollama Node Executor
    this.registerNodeExecutor('ollama', async (node: any) => {
      const { config, inputs } = node.data;
      const { model, systemPrompt, temperature, maxTokens } = config || {};
      const { prompt } = inputs || {};
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3.1',
          prompt: prompt || 'Hello, how can you help me today?',
          system: systemPrompt || 'You are a helpful AI assistant.',
          stream: false,
          options: {
            temperature: temperature || 0.7,
            num_predict: maxTokens || 100
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.response;
    });

    // Database Node Executor
    this.registerNodeExecutor('database', async (node: any) => {
      const { connectionType, query } = node.data;
      
      // Simulate database query execution
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
      
      return {
        connectionType,
        query,
        results: [
          { id: 1, name: 'Sample Record 1', value: Math.random() * 100 },
          { id: 2, name: 'Sample Record 2', value: Math.random() * 100 }
        ],
        rowCount: 2,
        executionTime: Math.round(800 + Math.random() * 1500),
        timestamp: new Date().toISOString()
      };
    });

    // Email Node Executor
    this.registerNodeExecutor('email', async (node: any) => {
      const { provider, to, subject } = node.data;
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.1; // 90% success rate
      
      if (!success) {
        throw new Error(`Email delivery failed: ${provider} service temporarily unavailable`);
      }
      
      return {
        provider,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        recipients: to?.length || 0,
        subject,
        status: 'sent',
        timestamp: new Date().toISOString()
      };
    });

    // Webhook Node Executor
    this.registerNodeExecutor('webhook', async (node: any) => {
      const { url, method, payload } = node.data;
      
      if (!url) {
        throw new Error('Webhook URL is required');
      }
      
      // Mock webhook response
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      return {
        url,
        method: method || 'POST',
        status: 200,
        statusText: 'OK',
        responseTime: Math.round(500 + Math.random() * 1000),
        timestamp: new Date().toISOString()
      };
    });

    // File Node Executor
    this.registerNodeExecutor('file', async (node: any) => {
      const { operation, filePath } = node.data;
      
      // Simulate file operation
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      
      return {
        operation,
        filePath,
        success: true,
        timestamp: new Date().toISOString()
      };
    });

    // Scheduler Node Executor
    this.registerNodeExecutor('scheduler', async (node: any) => {
      const { scheduleType, scheduleValue } = node.data;
      
      // Simulate scheduler setup
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      return {
        scheduleType,
        scheduleValue,
        scheduled: true,
        nextRun: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timestamp: new Date().toISOString()
      };
    });
  }

  // Helper methods
  evaluateCondition(condition: string, context: any) {
    try {
      const func = new Function('variables', `return ${condition}`);
      return func(context.variables);
    } catch {
      return false;
    }
  }

  getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
