import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication middleware
async function authenticateRequest(req: Request): Promise<{ valid: boolean; keyId?: string; userId?: string; permissions?: string[] }> {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    return { valid: false };
  }

  try {
    // Validate API key
    const { data: keyData, error } = await supabase.rpc('validate_api_key', { key: apiKey });
    
    if (error || !keyData) {
      return { valid: false };
    }

    // Get key details
    const { data: keyInfo } = await supabase
      .from('api_keys')
      .select('id, created_by, permissions')
      .eq('id', keyData)
      .single();

    if (!keyInfo) {
      return { valid: false };
    }

    return {
      valid: true,
      keyId: keyInfo.id,
      userId: keyInfo.created_by,
      permissions: keyInfo.permissions || ['read']
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { valid: false };
  }
}

// Log API usage
async function logApiUsage(keyId: string, endpoint: string, method: string, status: number, responseTime: number, req: Request) {
  try {
    await supabase.from('api_usage_logs').insert({
      api_key_id: keyId,
      endpoint,
      method,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
      response_status: status,
      response_time_ms: responseTime
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

// Response helper
function createResponse(data: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Extract path and query parameters
function parseUrl(url: string) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  
  // Remove 'functions/flameforge-api' from path
  const apiPathSegments = pathSegments.slice(2);
  
  const params = new URLSearchParams(urlObj.search);
  const queryParams: Record<string, string> = {};
  
  params.forEach((value, key) => {
    queryParams[key] = value;
  });

  return {
    path: '/' + apiPathSegments.join('/'),
    segments: apiPathSegments,
    query: queryParams
  };
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { path, segments, query } = parseUrl(req.url);
  
  try {
    // Health check endpoint (no auth required)
    if (path === '/health') {
      return createResponse({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
    }

    // API documentation endpoint (no auth required)
    if (path === '/docs') {
      return createResponse({
        success: true,
        data: {
          name: 'FlameForge Nexus API',
          version: '1.0.0',
          description: 'REST API for FlameForge Nexus platform integration',
          endpoints: {
            'GET /workflows': 'List all workflows',
            'GET /workflows/{id}': 'Get specific workflow',
            'POST /workflows': 'Create new workflow',
            'PUT /workflows/{id}': 'Update workflow',
            'DELETE /workflows/{id}': 'Delete workflow',
            'POST /workflows/{id}/execute': 'Execute workflow',
            'GET /workflows/{id}/runs': 'Get workflow execution history',
            'GET /nodes': 'List all nodes',
            'GET /chat/messages': 'Get chat history',
            'POST /chat/send': 'Send chat message',
            'GET /api-keys': 'List API keys (user scope)',
            'POST /api-keys': 'Create new API key',
            'DELETE /api-keys/{id}': 'Delete API key',
            'GET /ollama/instances': 'List Ollama instances',
            'POST /ollama/instances': 'Add Ollama instance',
            'DELETE /ollama/instances/{endpoint}': 'Remove Ollama instance',
            'GET /ollama/models': 'List available models',
            'POST /ollama/execute': 'Execute Ollama node',
            'GET /ollama/logs': 'Get execution logs'
          },
          authentication: 'Include X-API-Key header with your API key'
        }
      });
    }

    // Authenticate all other requests
    const auth = await authenticateRequest(req);
    if (!auth.valid) {
      return createResponse({
        success: false,
        error: 'Invalid or missing API key'
      }, 401);
    }

    // Route handling
    let response: Response;
    let responseData: ApiResponse;

    // Workflows API
    if (path.startsWith('/workflows')) {
      response = await handleWorkflowsApi(segments, query, req, auth);
    }
    // Nodes API
    else if (path.startsWith('/nodes')) {
      response = await handleNodesApi(segments, query, req, auth);
    }
    // Chat API
    else if (path.startsWith('/chat')) {
      response = await handleChatApi(segments, query, req, auth);
    }
    // API Keys management
    else if (path.startsWith('/api-keys')) {
      response = await handleApiKeysApi(segments, query, req, auth);
    }
    // Ollama API
    else if (path.startsWith('/ollama')) {
      const segments = path.split('/').filter(Boolean);
      response = await handleOllamaApi(segments, query, req, auth);
    }
    // User info
    else if (path === '/me') {
      response = await handleUserInfo(auth);
    }
    else {
      response = createResponse({
        success: false,
        error: 'Endpoint not found'
      }, 404);
    }

    // Log API usage
    const responseTime = Date.now() - startTime;
    await logApiUsage(auth.keyId!, path, req.method, response.status, responseTime, req);

    return response;

  } catch (error) {
    console.error('API Error:', error);
    
    // Log failed request
    if (req.headers.get('x-api-key')) {
      const responseTime = Date.now() - startTime;
      const auth = await authenticateRequest(req);
      if (auth.valid && auth.keyId) {
        await logApiUsage(auth.keyId, path, req.method, 500, responseTime, req);
      }
    }

    return createResponse({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Workflows API handler
async function handleWorkflowsApi(segments: string[], query: Record<string, string>, req: Request, auth: any): Promise<Response> {
  const workflowId = segments[1];
  const action = segments[2];

  switch (req.method) {
    case 'GET':
      if (!workflowId) {
        // List workflows
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 100);
        const offset = (page - 1) * limit;

        const { data: workflows, error, count } = await supabase
          .from('workbench_workflows')
          .select(`
            id, name, description, status, created_at, updated_at, version,
            created_by, published_at, archived_at
          `, { count: 'exact' })
          .eq('created_by', auth.userId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return createResponse({
          success: true,
          data: workflows,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        });
      } else if (action === 'runs') {
        // Get workflow runs
        const { data: runs, error } = await supabase
          .from('workflow_runs')
          .select('*')
          .eq('workflow_id', workflowId)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return createResponse({
          success: true,
          data: runs
        });
      } else {
        // Get specific workflow
        const { data: workflow, error } = await supabase
          .from('workbench_workflows')
          .select(`
            *, 
            workbench_nodes(*),
            workbench_edges(*)
          `)
          .eq('id', workflowId)
          .eq('created_by', auth.userId)
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data: workflow
        });
      }

    case 'POST':
      if (workflowId && action === 'execute') {
        // Execute workflow - placeholder for now
        return createResponse({
          success: true,
          data: {
            message: 'Workflow execution initiated',
            workflow_id: workflowId,
            run_id: crypto.randomUUID()
          }
        });
      } else {
        // Create new workflow
        const body = await req.json();
        
        const { data: workflow, error } = await supabase
          .from('workbench_workflows')
          .insert({
            name: body.name,
            description: body.description,
            created_by: auth.userId,
            graph_data: body.graph_data || {}
          })
          .select()
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data: workflow,
          message: 'Workflow created successfully'
        }, 201);
      }

    case 'PUT':
      if (!workflowId) {
        return createResponse({
          success: false,
          error: 'Workflow ID required'
        }, 400);
      }

      const body = await req.json();
      
      const { data: updatedWorkflow, error } = await supabase
        .from('workbench_workflows')
        .update({
          name: body.name,
          description: body.description,
          graph_data: body.graph_data,
          status: body.status
        })
        .eq('id', workflowId)
        .eq('created_by', auth.userId)
        .select()
        .single();

      if (error) throw error;

      return createResponse({
        success: true,
        data: updatedWorkflow,
        message: 'Workflow updated successfully'
      });

    case 'DELETE':
      if (!workflowId) {
        return createResponse({
          success: false,
          error: 'Workflow ID required'
        }, 400);
      }

      const { error: deleteError } = await supabase
        .from('workbench_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('created_by', auth.userId);

      if (deleteError) throw deleteError;

      return createResponse({
        success: true,
        message: 'Workflow deleted successfully'
      });

    default:
      return createResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
  }
}

// Nodes API handler
async function handleNodesApi(segments: string[], query: Record<string, string>, req: Request, auth: any): Promise<Response> {
  const workflowId = query.workflow_id;

  if (!workflowId) {
    return createResponse({
      success: false,
      error: 'workflow_id query parameter required'
    }, 400);
  }

  // Verify user has access to workflow
  const { data: workflow } = await supabase
    .from('workbench_workflows')
    .select('id')
    .eq('id', workflowId)
    .eq('created_by', auth.userId)
    .single();

  if (!workflow) {
    return createResponse({
      success: false,
      error: 'Workflow not found or access denied'
    }, 404);
  }

  switch (req.method) {
    case 'GET':
      const { data: nodes, error } = await supabase
        .from('workbench_nodes')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return createResponse({
        success: true,
        data: nodes
      });

    default:
      return createResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
  }
}

// Chat API handler
async function handleChatApi(segments: string[], query: Record<string, string>, req: Request, auth: any): Promise<Response> {
  const action = segments[1];

  switch (req.method) {
    case 'GET':
      if (action === 'messages') {
        const deviceId = query.device_id;
        const limit = Math.min(parseInt(query.limit || '50'), 200);

        let queryBuilder = supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (deviceId) {
          queryBuilder = queryBuilder.eq('device_id', deviceId);
        }

        const { data: messages, error } = await queryBuilder;

        if (error) throw error;

        return createResponse({
          success: true,
          data: messages.reverse() // Return in chronological order
        });
      }
      break;

    case 'POST':
      if (action === 'send') {
        const body = await req.json();
        
        if (!body.message || !body.device_id) {
          return createResponse({
            success: false,
            error: 'message and device_id are required'
          }, 400);
        }

        // Call the AI chat function
        const { data: aiResponse, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            message: body.message,
            deviceId: body.device_id,
            workflowContext: body.workflow_context
          }
        });

        if (error) throw error;

        return createResponse({
          success: true,
          data: {
            response: aiResponse.response,
            context: aiResponse.context
          }
        });
      }
      break;
  }

  return createResponse({
    success: false,
    error: 'Invalid chat endpoint or method'
  }, 400);
}

// API Keys management handler
async function handleApiKeysApi(segments: string[], query: Record<string, string>, req: Request, auth: any): Promise<Response> {
  const keyId = segments[1];

  switch (req.method) {
    case 'GET':
      const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at, expires_at, is_active, permissions, usage_count')
        .eq('created_by', auth.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return createResponse({
        success: true,
        data: keys
      });

    case 'POST':
      const body = await req.json();
      
      // Generate new API key
      const { data: newKey } = await supabase.rpc('generate_api_key');
      const keyHash = await supabase.rpc('hash_api_key', { key: newKey });

      const { data: apiKey, error: createError } = await supabase
        .from('api_keys')
        .insert({
          name: body.name || 'Untitled API Key',
          key_hash: keyHash,
          key_prefix: newKey.substring(0, 8) + '...',
          created_by: auth.userId,
          permissions: body.permissions || ['read'],
          expires_at: body.expires_at || null,
          rate_limit_per_hour: body.rate_limit_per_hour || 1000
        })
        .select('id, name, key_prefix, created_at, permissions')
        .single();

      if (createError) throw createError;

      return createResponse({
        success: true,
        data: {
          ...apiKey,
          api_key: newKey // Only returned once!
        },
        message: 'API key created successfully. Store this key securely - it won\'t be shown again!'
      }, 201);

    case 'DELETE':
      if (!keyId) {
        return createResponse({
          success: false,
          error: 'API key ID required'
        }, 400);
      }

      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('created_by', auth.userId);

      if (deleteError) throw deleteError;

      return createResponse({
        success: true,
        message: 'API key deleted successfully'
      });

    default:
      return createResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
  }
}

// User info handler
async function handleUserInfo(auth: any): Promise<Response> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', auth.userId)
    .single();

  return createResponse({
    success: true,
    data: {
      user_id: auth.userId,
      profile,
      permissions: auth.permissions
    }
  });
}

// Ollama API handler
async function handleOllamaApi(segments: string[], query: Record<string, string>, req: Request, auth: any): Promise<Response> {
  const resource = segments[1]; // instances, models, execute, logs
  const resourceId = segments[2];

  switch (req.method) {
    case 'GET':
      if (resource === 'instances') {
        // List Ollama instances
        const { data, error } = await supabase
          .from('ollama_instances')
          .select('*')
          .eq('user_id', auth.userId)
          .order('last_seen', { ascending: false });

        if (error) throw error;

        return createResponse({
          success: true,
          data: data || []
        });
      }

      else if (resource === 'models') {
        // List available models across all instances
        const { data: instances, error: instancesError } = await supabase
          .from('ollama_instances')
          .select('endpoint, available_models, is_active')
          .eq('user_id', auth.userId)
          .eq('is_active', true);

        if (instancesError) throw instancesError;

        const allModels = instances?.flatMap(instance =>
          instance.available_models.map((model: any) => ({
            ...model,
            endpoint: instance.endpoint
          }))
        ) || [];

        return createResponse({
          success: true,
          data: allModels
        });
      }

      else if (resource === 'logs') {
        // Get execution logs
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 100);
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
          .from('ollama_execution_logs')
          .select('*')
          .eq('user_id', auth.userId)
          .order('started_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (query.workflow_id) {
          queryBuilder = queryBuilder.eq('workflow_id', query.workflow_id);
        }
        if (query.node_id) {
          queryBuilder = queryBuilder.eq('node_id', query.node_id);
        }
        if (query.status) {
          queryBuilder = queryBuilder.eq('status', query.status);
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;

        return createResponse({
          success: true,
          data: data || [],
          pagination: {
            page,
            limit,
            total: data?.length || 0
          }
        });
      }

      else {
        return createResponse({
          success: false,
          error: 'Resource not found'
        }, 404);
      }

    case 'POST':
      if (resource === 'instances') {
        // Add new Ollama instance
        const body = await req.json();
        const { endpoint, name } = body;

        if (!endpoint) {
          return createResponse({
            success: false,
            error: 'Endpoint is required'
          }, 400);
        }

        // Check if instance already exists
        const { data: existing } = await supabase
          .from('ollama_instances')
          .select('id')
          .eq('user_id', auth.userId)
          .eq('endpoint', endpoint)
          .single();

        if (existing) {
          return createResponse({
            success: false,
            error: 'Instance already exists'
          }, 409);
        }

        const { data, error } = await supabase
          .from('ollama_instances')
          .insert({
            user_id: auth.userId,
            endpoint,
            name: name || `Ollama (${endpoint})`,
            is_active: true,
            last_seen: new Date().toISOString(),
            available_models: [],
            connection_metadata: {}
          })
          .select()
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data,
          message: 'Ollama instance added successfully'
        });
      }

      else if (resource === 'execute') {
        // Execute Ollama node - delegate to the dedicated edge function
        const body = await req.json();

        const { data, error } = await supabase.functions.invoke('execute-ollama-node', {
          body,
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        });

        if (error) throw error;

        return createResponse({
          success: true,
          data
        });
      }

      else {
        return createResponse({
          success: false,
          error: 'Resource not found'
        }, 404);
      }

    case 'DELETE':
      if (resource === 'instances' && resourceId) {
        // Remove Ollama instance by endpoint (base64 encoded)
        const endpoint = decodeURIComponent(resourceId);

        const { error } = await supabase
          .from('ollama_instances')
          .delete()
          .eq('user_id', auth.userId)
          .eq('endpoint', endpoint);

        if (error) throw error;

        return createResponse({
          success: true,
          message: 'Ollama instance removed successfully'
        });
      }

      else {
        return createResponse({
          success: false,
          error: 'Resource not found'
        }, 404);
      }

    default:
      return createResponse({
        success: false,
        error: 'Method not allowed'
      }, 405);
  }
}