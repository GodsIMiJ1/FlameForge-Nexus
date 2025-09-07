// supabase/functions/execute-ollama-node/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OllamaExecuteRequest {
  nodeId: string;
  workflowId: string;
  endpoint: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
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

    // Get user from JWT token
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestData: OllamaExecuteRequest = await req.json()
    const { nodeId, workflowId, endpoint, model, prompt, systemPrompt, options } = requestData

    // Validate request
    if (!nodeId || !workflowId || !endpoint || !model || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has access to the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workbench_workflows')
      .select('id, user_id')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single()

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow not found or access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log execution start
    const { data: executionLog } = await supabase
      .from('workflow_events')
      .insert({
        workflow_id: workflowId,
        node_id: nodeId,
        event_type: 'node_execution_start',
        event_data: {
          model,
          endpoint,
          prompt_length: prompt.length
        },
        user_id: user.id
      })
      .select()
      .single()

    const startTime = Date.now()

    try {
      // Call Ollama API
      const ollamaResponse = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          system: systemPrompt,
          stream: false,
          options: options || {}
        })
      })

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`)
      }

      const ollamaData: OllamaResponse = await ollamaResponse.json()
      const executionTime = Date.now() - startTime

      // Log successful execution
      await supabase
        .from('workflow_events')
        .insert({
          workflow_id: workflowId,
          node_id: nodeId,
          event_type: 'node_execution_complete',
          event_data: {
            model: ollamaData.model,
            response_length: ollamaData.response?.length || 0,
            execution_time: executionTime,
            tokens_generated: ollamaData.eval_count,
            total_duration: ollamaData.total_duration,
            load_duration: ollamaData.load_duration
          },
          user_id: user.id
        })

      // Update node execution status
      await supabase
        .from('workbench_nodes')
        .update({
          last_execution: new Date().toISOString(),
          execution_status: 'completed',
          output_data: {
            response: ollamaData.response,
            metadata: {
              model: ollamaData.model,
              tokens: ollamaData.eval_count,
              duration: executionTime
            }
          }
        })
        .eq('id', nodeId)
        .eq('workflow_id', workflowId)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            response: ollamaData.response,
            metadata: {
              model: ollamaData.model,
              tokens: ollamaData.eval_count,
              duration: executionTime,
              total_duration: ollamaData.total_duration
            }
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (ollamaError) {
      const executionTime = Date.now() - startTime
      const errorMessage = ollamaError instanceof Error ? ollamaError.message : 'Unknown error'

      // Log failed execution
      await supabase
        .from('workflow_events')
        .insert({
          workflow_id: workflowId,
          node_id: nodeId,
          event_type: 'node_execution_error',
          event_data: {
            error: errorMessage,
            execution_time: executionTime,
            endpoint,
            model
          },
          user_id: user.id
        })

      // Update node execution status
      await supabase
        .from('workbench_nodes')
        .update({
          last_execution: new Date().toISOString(),
          execution_status: 'error',
          output_data: {
            error: errorMessage
          }
        })
        .eq('id', nodeId)
        .eq('workflow_id', workflowId)

      return new Response(
        JSON.stringify({ 
          error: `Ollama execution failed: ${errorMessage}`,
          details: {
            endpoint,
            model,
            execution_time: executionTime
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})