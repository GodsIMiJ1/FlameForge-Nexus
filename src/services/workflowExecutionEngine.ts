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
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
    // Agent Node Executor
    this.registerNodeExecutor('agent', async (node: any, context: any) => {
      const { provider, model, prompt, systemPrompt } = node.data;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      if (provider === 'ollama') {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model || 'llama2',
            prompt,
            system: systemPrompt,
            stream: false
          })
        });
        
        if (!response.ok) {
          throw new Error(`Ollama API failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.response;
      }
      
      // Mock response for other providers
      return `AI response from ${provider}: Processed "${prompt}"`;
    });

    // Ollama Node Executor
    this.registerNodeExecutor('ollama', async (node: any, context: any) => {
      const { model, prompt, systemPrompt, temperature, maxTokens } = node.data;
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3.1',
          prompt,
          system: systemPrompt,
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

    // Tool Node Executor
    this.registerNodeExecutor('tool', async (node: any, context: any) => {
      const { url, method, headers, body } = node.data;
      
      const response = await fetch(url, {
        method: method || 'GET',
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
    this.registerNodeExecutor('decision', async (node: any, context: any) => {
      const { condition, trueValue, falseValue } = node.data;
      
      // Simple condition evaluation
      const result = this.evaluateCondition(condition, context);
      return result ? trueValue : falseValue;
    });

    // Data Transform Node Executor
    this.registerNodeExecutor('transform', async (node: any, context: any) => {
      const { transformation, inputField, outputField } = node.data;
      
      // Get input value
      const inputValue = this.getNestedValue(context.variables, inputField);
      
      // Apply transformation
      let result = inputValue;
      switch (transformation) {
        case 'uppercase':
          result = String(inputValue).toUpperCase();
          break;
        case 'lowercase':
          result = String(inputValue).toLowerCase();
          break;
        case 'json_parse':
          result = JSON.parse(inputValue);
          break;
        case 'json_stringify':
          result = JSON.stringify(inputValue);
          break;
        default:
          result = inputValue;
      }
      
      return result;
    });
  }

  // Register default executors
  registerDefaultExecutors() {
    // Agent Node Executor
    this.registerNodeExecutor('agent', async (node: any, context: any) => {
      const { provider, model, prompt, systemPrompt } = node.data;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      if (provider === 'ollama') {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model || 'llama2',
            prompt,
            system: systemPrompt,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.response;
      }

      // Mock response for other providers
      return `AI response from ${provider}: Processed "${prompt}"`;
    });

    // Ollama Node Executor
    this.registerNodeExecutor('ollama', async (node: any, context: any) => {
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

    // Tool Node Executor
    this.registerNodeExecutor('tool', async (node: any, context: any) => {
      const { url, method, headers, body } = node.data;

      const response = await fetch(url, {
        method: method || 'GET',
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
    this.registerNodeExecutor('decision', async (node: any, context: any) => {
      const { condition, trueValue, falseValue } = node.data;

      // Simple condition evaluation
      const result = this.evaluateCondition(condition, context);
      return result ? trueValue : falseValue;
    });

    // Data Source Node Executor
    this.registerNodeExecutor('dataSource', async (node: any, context: any) => {
      const { type, query, connection } = node.data;

      // Mock database response
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      return {
        type: 'database_result',
        query,
        data: [
          { id: 1, name: 'Sample Data 1', value: Math.random() * 100 },
          { id: 2, name: 'Sample Data 2', value: Math.random() * 100 }
        ],
        timestamp: new Date().toISOString()
      };
    });
  }

  // Helper methods
  evaluateCondition(condition: string, context: any) {
    try {
      // Simple and safe condition evaluation
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
