// tests/workflow-execution.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowExecutionEngine } from '@/services/workflowExecutionEngine';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
    update: jest.fn(() => ({ eq: jest.fn() })),
    select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) }))
  }))
};

describe('Workflow Execution Engine', () => {
  let engine: WorkflowExecutionEngine;

  beforeEach(() => {
    engine = new WorkflowExecutionEngine(mockSupabase as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should execute a simple linear workflow', async () => {
    const nodes = [
      {
        id: 'node1',
        type: 'agent',
        data: { 
          provider: 'mock',
          prompt: 'Hello world'
        },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node2',
        type: 'tool',
        data: {
          url: 'https://httpbin.org/post',
          method: 'POST'
        },
        position: { x: 200, y: 0 }
      }
    ];

    const edges = [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2'
      }
    ];

    // Register mock executor
    engine.registerNodeExecutor('mock', async (node, context) => {
      return { response: 'Mock response', nodeId: node.id };
    });

    const executionId = await engine.executeWorkflow(
      'test-workflow',
      'test-user',
      nodes,
      edges
    );

    expect(executionId).toBeDefined();
    expect(executionId).toMatch(/^exec_/);
  });

  test('should handle parallel execution', async () => {
    const nodes = [
      {
        id: 'start',
        type: 'agent',
        data: { prompt: 'Start' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'parallel1',
        type: 'agent',
        data: { prompt: 'Parallel 1' },
        position: { x: 200, y: -50 }
      },
      {
        id: 'parallel2',
        type: 'agent',
        data: { prompt: 'Parallel 2' },
        position: { x: 200, y: 50 }
      },
      {
        id: 'end',
        type: 'tool',
        data: { url: 'https://httpbin.org/get' },
        position: { x: 400, y: 0 }
      }
    ];

    const edges = [
      { id: 'e1', source: 'start', target: 'parallel1' },
      { id: 'e2', source: 'start', target: 'parallel2' },
      { id: 'e3', source: 'parallel1', target: 'end' },
      { id: 'e4', source: 'parallel2', target: 'end' }
    ];

    let executionOrder: string[] = [];

    engine.registerNodeExecutor('agent', async (node) => {
      executionOrder.push(node.id);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
      return { response: `Response from ${node.id}` };
    });

    engine.registerNodeExecutor('tool', async (node) => {
      executionOrder.push(node.id);
      return { response: 'Tool response' };
    });

    await engine.executeWorkflow('test-workflow', 'test-user', nodes, edges);

    // Start should execute first
    expect(executionOrder[0]).toBe('start');
    
    // Parallel nodes should execute in any order (but both before end)
    expect(executionOrder.slice(1, 3)).toContain('parallel1');
    expect(executionOrder.slice(1, 3)).toContain('parallel2');
    
    // End should execute last
    expect(executionOrder[3]).toBe('end');
  });

  test('should handle node execution errors', async () => {
    const nodes = [
      {
        id: 'error-node',
        type: 'error',
        data: { shouldFail: true },
        position: { x: 0, y: 0 }
      }
    ];

    engine.registerNodeExecutor('error', async (node) => {
      if (node.data.shouldFail) {
        throw new Error('Intentional test error');
      }
      return { success: true };
    });

    const events: any[] = [];
    engine.on('node:error', (event) => events.push(event));

    await engine.executeWorkflow('test-workflow', 'test-user', nodes, []);

    expect(events).toHaveLength(1);
    expect(events[0].error.message).toBe('Intentional test error');
  });

  test('should retry failed nodes when configured', async () => {
    let attempts = 0;
    const nodes = [
      {
        id: 'retry-node',
        type: 'retry',
        data: {
          retry: {
            enabled: true,
            maxAttempts: 3,
            delay: 10
          }
        },
        position: { x: 0, y: 0 }
      }
    ];

    engine.registerNodeExecutor('retry', async (node) => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return { success: true, attempts };
    });

    await engine.executeWorkflow('test-workflow', 'test-user', nodes, []);

    expect(attempts).toBe(3);
  });
});

// tests/node-types.test.ts
describe('Node Type Registry', () => {
  test('should register and retrieve node types', () => {
    const registry = NodeTypeRegistry.getInstance();
    
    const customNode = {
      component: () => null,
      category: 'Custom',
      displayName: 'Custom Node',
      description: 'A custom node type',
      defaultData: { value: 'default' },
      inputs: [{ name: 'input', type: 'string', required: true }],
      outputs: [{ name: 'output', type: 'string' }]
    };

    registry.registerNodeType('custom', customNode);
    
    const retrieved = registry.getNodeType('custom');
    expect(retrieved).toEqual(customNode);
  });

  test('should get nodes by category', () => {
    const registry = NodeTypeRegistry.getInstance();
    const aiNodes = registry.getNodeTypesByCategory('AI');
    
    expect(aiNodes.length).toBeGreaterThan(0);
    expect(aiNodes.every(([_, def]) => def.category === 'AI')).toBe(true);
  });
});

// scripts/test-workflow.ts - Manual testing script
import { WorkflowExecutionEngine } from '@/services/workflowExecutionEngine';
import { createClient } from '@supabase/supabase-js';

async function testBasicWorkflow() {
  console.log('🧪 Testing Basic Workflow Execution...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const engine = new WorkflowExecutionEngine(supabase);

  // Test Agent → Tool → Decision workflow
  const nodes = [
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        prompt: 'Generate a random number between 1 and 100',
        temperature: 0.7
      }
    },
    {
      id: 'decision-1',
      type: 'decision',
      position: { x: 300, y: 0 },
      data: {
        operator: 'greater_than',
        compareWith: '${node_agent-1_output.response}',
        value: '50'
      }
    },
    {
      id: 'tool-high',
      type: 'tool',
      position: { x: 600, y: -100 },
      data: {
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: { result: 'high', value: '${node_agent-1_output.response}' }
      }
    },
    {
      id: 'tool-low',
      type: 'tool',
      position: { x: 600, y: 100 },
      data: {
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: { result: 'low', value: '${node_agent-1_output.response}' }
      }
    }
  ];

  const edges = [
    { id: 'e1', source: 'agent-1', target: 'decision-1' },
    { id: 'e2', source: 'decision-1', target: 'tool-high', sourceHandle: 'true' },
    { id: 'e3', source: 'decision-1', target: 'tool-low', sourceHandle: 'false' }
  ];

  // Listen to events
  engine.on('workflow:started', ({ executionId }) => {
    console.log(`✅ Workflow started: ${executionId}`);
  });

  engine.on('node:started', ({ nodeId }) => {
    console.log(`🔄 Node started: ${nodeId}`);
  });

  engine.on('node:completed', ({ nodeId, result }) => {
    console.log(`✅ Node completed: ${nodeId}`, result);
  });

  engine.on('node:error', ({ nodeId, error }) => {
    console.log(`❌ Node error: ${nodeId}`, error.message);
  });

  engine.on('workflow:completed', ({ executionId }) => {
    console.log(`🎉 Workflow completed: ${executionId}`);
  });

  try {
    const executionId = await engine.executeWorkflow(
      'test-workflow-1',
      'test-user',
      nodes,
      edges
    );

    console.log(`🚀 Execution started with ID: ${executionId}`);
    
    // Wait for completion (in real app, this would be event-driven)
    await new Promise(resolve => {
      engine.once('workflow:completed', resolve);
      engine.once('workflow:error', resolve);
    });

  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

async function testOllamaWorkflow() {
  console.log('🦙 Testing Ollama Workflow...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const engine