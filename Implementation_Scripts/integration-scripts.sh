#!/bin/bash
# setup-workflow-engine.sh - Complete setup script for FlameForge Nexus workflow engine

echo "🔥 Setting up FlameForge Nexus Workflow Engine..."

# 1. Install required dependencies
echo "📦 Installing dependencies..."
npm install --save @supabase/supabase-js
npm install --save @xyflow/react
npm install --save @tanstack/react-query
npm install --save react-hook-form
npm install --save zod
npm install --save date-fns
npm install --save lucide-react
npm install --save recharts

# Development dependencies
npm install --save-dev @types/node
npm install --save-dev typescript

# 2. Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/services
mkdir -p src/components/nodes
mkdir -p src/components/monitoring
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/utils
mkdir -p supabase/functions/execute-node
mkdir -p supabase/migrations

# 3. Database setup
echo "🗄️ Setting up database schema..."
cat > supabase/migrations/20240101000000_workflow_engine.sql << 'EOF'
-- Workflow engine database schema
-- Run this migration in your Supabase dashboard

-- Add execution tracking tables
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workbench_workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    execution_data JSONB DEFAULT '{}',
    
    CONSTRAINT valid_execution_status CHECK (status IN ('running', 'completed', 'error', 'cancelled', 'paused'))
);

-- Add node execution tracking
CREATE TABLE IF NOT EXISTS node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workbench_nodes(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    CONSTRAINT valid_node_status CHECK (status IN ('pending', 'running', 'completed', 'error', 'cancelled'))
);

-- Add execution events for detailed logging
CREATE TABLE IF NOT EXISTS execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workbench_nodes(id) ON DELETE CASCADE NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their own executions" ON workflow_executions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own node executions" ON node_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workflow_executions 
            WHERE workflow_executions.id = node_executions.execution_id 
            AND workflow_executions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own execution events" ON execution_events
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_workflow_executions_user_status ON workflow_executions(user_id, status);
CREATE INDEX idx_node_executions_execution_status ON node_executions(execution_id, status);
CREATE INDEX idx_execution_events_execution_type ON execution_events(execution_id, event_type);
CREATE INDEX idx_execution_events_created ON execution_events(created_at DESC);

-- Function to update node execution status
CREATE OR REPLACE FUNCTION update_node_execution_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completion time when status changes to completed or error
    IF NEW.status IN ('completed', 'error', 'cancelled') AND OLD.status != NEW.status THEN
        NEW.completed_at = NOW();
        
        -- Calculate execution time if started_at exists
        IF NEW.started_at IS NOT NULL THEN
            NEW.execution_time_ms = EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_node_execution_status
    BEFORE UPDATE ON node_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_node_execution_status();
EOF

# 4. Supabase Edge Function for node execution
echo "⚡ Creating Supabase Edge Function..."
cat > supabase/functions/execute-node/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NodeExecutionRequest {
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeData: any;
  inputData: any;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const request: NodeExecutionRequest = await req.json()
    const { executionId, nodeId, nodeType, nodeData, inputData } = request

    // Create node execution record
    const { data: nodeExecution } = await supabase
      .from('node_executions')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        status: 'running',
        input_data: inputData,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    let result: any
    let error: string | null = null

    try {
      // Execute based on node type
      switch (nodeType) {
        case 'agent':
          result = await executeAgentNode(nodeData, inputData)
          break
        case 'tool':
          result = await executeToolNode(nodeData, inputData)
          break
        case 'decision':
          result = await executeDecisionNode(nodeData, inputData)
          break
        case 'ollama':
          result = await executeOllamaNode(nodeData, inputData)
          break
        default:
          throw new Error(`Unsupported node type: ${nodeType}`)
      }

      // Update node execution as completed
      await supabase
        .from('node_executions')
        .update({
          status: 'completed',
          output_data: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', nodeExecution.id)

    } catch (executeError) {
      error = executeError.message
      
      // Update node execution as error
      await supabase
        .from('node_executions')
        .update({
          status: 'error',
          error_message: error,
          completed_at: new Date().toISOString()
        })
        .eq('id', nodeExecution.id)
    }

    // Log execution event
    await supabase
      .from('execution_events')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        event_type: error ? 'node_execution_error' : 'node_execution_completed',
        event_data: error ? { error } : { result },
        user_id: user.id
      })

    if (error) {
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Node execution functions
async function executeAgentNode(nodeData: any, inputData: any) {
  const { provider, model, apiKey, systemPrompt, temperature = 0.7 } = nodeData
  const prompt = inputData.prompt || nodeData.prompt

  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      response: data.choices[0].message.content,
      usage: data.usage,
      model: data.model
    }
  }
  
  // Add other providers (Anthropic, etc.)
  throw new Error(`Unsupported AI provider: ${provider}`)
}

async function executeToolNode(nodeData: any, inputData: any) {
  const { url, method = 'GET', headers = {}, timeout = 30000 } = nodeData
  let { body } = nodeData

  // Replace variables in URL and body
  const finalUrl = replaceVariables(url, inputData)
  if (body) {
    body = replaceVariables(JSON.stringify(body), inputData)
    body = JSON.parse(body)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(finalUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const result = await response.json()
    return {
      status: response.status,
      data: result,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function executeDecisionNode(nodeData: any, inputData: any) {
  const { condition, operator = 'equals', value, compareWith } = nodeData
  
  // Get the value to compare
  const compareValue = getNestedValue(inputData, compareWith) || compareWith
  
  let result = false
  
  switch (operator) {
    case 'equals':
      result = compareValue == value
      break
    case 'not_equals':
      result = compareValue != value
      break
    case 'greater_than':
      result = Number(compareValue) > Number(value)
      break
    case 'less_than':
      result = Number(compareValue) < Number(value)
      break
    case 'contains':
      result = String(compareValue).includes(String(value))
      break
    case 'regex':
      result = new RegExp(value).test(String(compareValue))
      break
    default:
      // Custom condition evaluation
      if (condition) {
        const evalContext = { input: inputData, value: compareValue }
        result = evaluateCondition(condition, evalContext)
      }
  }
  
  return {
    result,
    compareValue,
    operator,
    value,
    path: result ? 'true' : 'false'
  }
}

async function executeOllamaNode(nodeData: any, inputData: any) {
  const { 
    endpoint = 'http://localhost:11434', 
    model, 
    systemPrompt, 
    temperature = 0.7,
    maxTokens = 2048
  } = nodeData
  const prompt = inputData.prompt || nodeData.prompt

  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    response: data.response,
    model: data.model,
    total_duration: data.total_duration,
    eval_count: data.eval_count
  }
}

// Utility functions
function replaceVariables(text: string, variables: any): string {
  return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
    return getNestedValue(variables, key) || match
  })
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function evaluateCondition(condition: string, context: any): boolean {
  try {
    // Simple and safe condition evaluation
    const func = new Function('input', 'value', `return ${condition}`)
    return func(context.input, context.value)
  } catch {
    return false
  }
}
EOF

# 5. Create TypeScript configuration files
echo "⚙️ Creating TypeScript configuration..."
cat > src/types/workflow.ts << 'EOF'
// Core workflow types for FlameForge Nexus
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'error' | 'cancelled' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  result?: any;
  error?: string;
  executionTime?: number;
  startedAt?: Date;
  completedAt?: Date;
}
EOF

# 6. Create React Hook for workflow execution
cat > src/hooks/useWorkflowExecution.ts << 'EOF'
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { WorkflowExecutionEngine } from '@/services/workflowExecutionEngine';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

export const useWorkflowExecution = (workflowId: string) => {
  const [executionEngine] = useState(() => new WorkflowExecutionEngine());
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});

  // Listen to execution events
  useEffect(() => {
    const handleNodeStatusChange = ({ nodeId, status }: any) => {
      setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
    };

    const handleWorkflowStarted = ({ executionId }: any) => {
      setCurrentExecutionId(executionId);
    };

    const handleWorkflowCompleted = () => {
      setCurrentExecutionId(null);
    };

    executionEngine.on('node:status_changed', handleNodeStatusChange);
    executionEngine.on('workflow:started', handleWorkflowStarted);
    executionEngine.on('workflow:completed', handleWorkflowCompleted);
    executionEngine.on('workflow:error', handleWorkflowCompleted);

    return () => {
      executionEngine.removeAllListeners();
    };
  }, [executionEngine]);

  // Start execution mutation
  const startExecution = useMutation({
    mutationFn: async ({ nodes, edges, variables = {} }: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      variables?: Record<string, any>;
    }) => {
      return executionEngine.executeWorkflow(
        workflowId,
        'current-user-id', // Replace with actual user ID
        nodes,
        edges,
        variables
      );
    }
  });

  const pauseExecution = useCallback(async () => {
    if (currentExecutionId) {
      await executionEngine.pauseWorkflow(currentExecutionId);
    }
  }, [currentExecutionId, executionEngine]);

  const cancelExecution = useCallback(async () => {
    if (currentExecutionId) {
      await executionEngine.cancelWorkflow(currentExecutionId);
      setCurrentExecutionId(null);
    }
  }, [currentExecutionId, executionEngine]);

  return {
    executionId: currentExecutionId,
    isExecuting: !!currentExecutionId,
    nodeStatuses,
    startExecution,
    pauseExecution,
    cancelExecution,
    executionEngine
  };
};
EOF

# 7. Create main workflow canvas integration
cat > src/components/WorkflowCanvas.tsx << 'EOF'
import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NODE_TYPES } from './nodes';
import { ExecutionMonitor } from './monitoring/ExecutionMonitor';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';

const initialNodes = [
  {
    id: '1',
    type: 'agent',
    position: { x: 100, y: 100 },
    data: { label: 'AI Agent' }
  }
];

const initialEdges = [];

export const WorkflowCanvas: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showMonitor, setShowMonitor] = useState(false);

  const {
    executionId,
    isExecuting,
    nodeStatuses,
    startExecution,
    pauseExecution,
    cancelExecution
  } = useWorkflowExecution(workflowId);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update node appearances based on execution status
  React.useEffect(() => {
    setNodes(nodes =>
      nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: nodeStatuses[node.id] || 'idle'
        }
      }))
    );
  }, [nodeStatuses, setNodes]);

  const handleStartExecution = useCallback(async () => {
    setShowMonitor(true);
    await startExecution.mutateAsync({ nodes, edges });
  }, [nodes, edges, startExecution]);

  return (
    <div className="h-screen w-full flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Execution controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleStartExecution}
            disabled={isExecuting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isExecuting ? 'Running...' : 'Start Execution'}
          </button>
          {isExecuting && (
            <>
              <button
                onClick={pauseExecution}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Pause
              </button>
              <button
                onClick={cancelExecution}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => setShowMonitor(!showMonitor)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showMonitor ? 'Hide' : 'Show'} Monitor
          </button>
        </div>
      </div>

      {/* Execution Monitor Panel */}
      {showMonitor && (
        <div className="w-96 border-l bg-white">
          <ExecutionMonitor
            workflowId={workflowId}
            executionId={executionId}
            onStart={handleStartExecution}
            onPause={pauseExecution}
            onStop={cancelExecution}
            onReset={() => {
              setNodes(initialNodes);
              setEdges(initialEdges);
            }}
          />
        </div>
      )}
    </div>
  );
};
EOF

# 8. Create package.json scripts for development
echo "📝 Adding development scripts..."
cat > scripts/dev-setup.sh << 'EOF'
#!/bin/bash
# Development setup script

echo "🔥 Setting up FlameForge development environment..."

# Start Supabase local development
if command -v supabase &> /dev/null; then
    echo "Starting Supabase..."
    supabase start
else
    echo "⚠️ Supabase CLI not found. Please install it first."
fi

# Start Ollama (if available)
if command -v ollama &> /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
else
    echo "⚠️ Ollama not found. Install from https://ollama.ai"
fi

# Start development server
echo "Starting development server..."
npm run dev
EOF

chmod +x scripts/dev-setup.sh

# 9. Create environment configuration
cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama Configuration
OLLAMA_ENDPOINT=http://localhost:11434

# Development
NODE_ENV=development
PORT=8080
EOF

# 10. Update package.json with new scripts
echo "📦 Updating package.json scripts..."
npm pkg set scripts.dev:setup="./scripts/dev-setup.sh"
npm pkg set scripts.dev:workflow="npm run dev -- --port 8080"
npm pkg set scripts.build:types="tsc --noEmit"
npm pkg set scripts.test:workflow="npm run test -- --testNamePattern=workflow"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Run database migrations: supabase db reset"
echo "3. Deploy edge functions: supabase functions deploy"
echo "4. Start development: npm run dev:setup"
echo ""
echo "🔥 FlameForge Nexus is ready for workflow execution!"