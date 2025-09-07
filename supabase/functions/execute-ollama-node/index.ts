// Ollama Node Execution Edge Function for FlameForge Nexus
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OllamaExecuteRequest {
  nodeId: string;
  workflowId: string;
  config: {
    endpoint: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stream?: boolean;
  };
  inputs: {
    prompt: string;
    context?: any;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData: OllamaExecuteRequest = await req.json();
    const { nodeId, workflowId, config, inputs } = requestData;

    // Validate request
    if (!nodeId || !workflowId || !config?.endpoint || !config?.model || !inputs?.prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user has access to the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workbench_workflows')
      .select('id, created_by')
      .eq('id', workflowId)
      .eq('created_by', user.id)
      .single();

    if (workflowError || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow not found or access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const startTime = Date.now();

    // Create execution log entry
    const { data: executionLog, error: logError } = await supabase
      .from('ollama_execution_logs')
      .insert({
        user_id: user.id,
        workflow_id: workflowId,
        node_id: nodeId,
        instance_endpoint: config.endpoint,
        model_name: config.model,
        prompt_text: inputs.prompt,
        system_prompt: config.systemPrompt,
        execution_config: {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
          topK: config.topK
        },
        status: 'pending'
      })
      .select()
      .single();

    try {
      // Call Ollama API
      const ollamaResponse = await fetch(`${config.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          prompt: inputs.prompt,
          system: config.systemPrompt,
          stream: false,
          options: {
            temperature: config.temperature,
            top_p: config.topP,
            top_k: config.topK,
            num_predict: config.maxTokens
          }
        })
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
      }

      const ollamaData: OllamaResponse = await ollamaResponse.json();
      const executionTime = Date.now() - startTime;

      // Update execution log with success
      if (executionLog) {
        await supabase
          .from('ollama_execution_logs')
          .update({
            response_text: ollamaData.response,
            execution_time_ms: executionTime,
            tokens_generated: ollamaData.eval_count,
            prompt_tokens: ollamaData.prompt_eval_count,
            total_duration_ms: ollamaData.total_duration,
            load_duration_ms: ollamaData.load_duration,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', executionLog.id);
      }

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
        .eq('node_id', nodeId)
        .eq('workflow_id', workflowId);

      // Log workflow event
      await supabase
        .from('workflow_events')
        .insert({
          run_id: workflowId, // Using workflow_id as run_id for now
          event_type: 'node_executed',
          node_id: nodeId,
          event_data: {
            model: ollamaData.model,
            response_length: ollamaData.response?.length || 0,
            execution_time: executionTime,
            tokens_generated: ollamaData.eval_count
          },
          sequence_number: 1
        });

      return new Response(
        JSON.stringify({
          success: true,
          response: ollamaData.response,
          metadata: {
            model: ollamaData.model,
            tokens: ollamaData.eval_count,
            duration: executionTime,
            executionTime
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (ollamaError) {
      const executionTime = Date.now() - startTime;
      const errorMessage = ollamaError instanceof Error ? ollamaError.message : 'Unknown error';

      // Update execution log with error
      if (executionLog) {
        await supabase
          .from('ollama_execution_logs')
          .update({
            error_message: errorMessage,
            execution_time_ms: executionTime,
            status: 'error',
            completed_at: new Date().toISOString()
          })
          .eq('id', executionLog.id);
      }

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
        .eq('node_id', nodeId)
        .eq('workflow_id', workflowId);

      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Ollama execution failed: ${errorMessage}`,
          details: {
            endpoint: config.endpoint,
            model: config.model,
            execution_time: executionTime
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
