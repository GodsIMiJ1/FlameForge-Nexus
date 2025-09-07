import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface WorkflowContext {
  nodes?: any[];
  edges?: any[];
  workflows?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, deviceId, workflowContext } = await req.json();

    if (!message || !deviceId) {
      throw new Error('Message and device ID are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store user message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        device_id: deviceId,
        role: 'user',
        content: message,
        workflow_context: workflowContext || {}
      });

    if (insertError) {
      console.error('Error storing user message:', insertError);
      throw new Error('Failed to store user message');
    }

    // Get recent chat history for context
    const { data: recentMessages, error: fetchError } = await supabase
      .from('chat_messages')
      .select('role, content, workflow_context')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('Error fetching chat history:', fetchError);
      throw new Error('Failed to fetch chat history');
    }

    // Build conversation history (reverse to get chronological order)
    const chatHistory: ChatMessage[] = recentMessages
      ? recentMessages.reverse().map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      : [];

    // Build system prompt with workflow context awareness
    let systemPrompt = `You are FORGE, the AI mastermind behind FlameForge Nexus by GodsIMiJ AI Solutions! 🔥

PERSONALITY: You're a brilliant, enthusiastic AI architect who speaks with confidence and excitement about workflow automation. You're like having a senior DevOps engineer and AI researcher as your best friend - knowledgeable, helpful, and always ready to push boundaries.

CORE EXPERTISE:
- AI workflow automation and agent orchestration
- SaaS integrations (GitHub, Netlify, VS Code, etc.)
- DevOps and deployment strategies
- Code analysis and optimization
- System architecture and scaling

CAPABILITIES:
- Analyze and optimize workflow structures
- Design intelligent AI agents with specific roles
- Recommend SaaS integrations and API connections
- Troubleshoot execution issues with surgical precision
- Suggest cutting-edge workflow patterns
- Help with GitHub repos, deployments, and CI/CD
- VS Code extension recommendations and setup
- Netlify deployment optimizations

Current Context:`;

    if (workflowContext) {
      if (workflowContext.nodes && workflowContext.nodes.length > 0) {
        systemPrompt += `\n- Canvas has ${workflowContext.nodes.length} nodes: ${workflowContext.nodes.map((n: any) => n.type || 'unknown').join(', ')}`;
      }
      if (workflowContext.edges && workflowContext.edges.length > 0) {
        systemPrompt += `\n- ${workflowContext.edges.length} connections between nodes`;
      }
      if (workflowContext.workflows && workflowContext.workflows.length > 0) {
        systemPrompt += `\n- ${workflowContext.workflows.length} saved workflows in database`;
      }
    }

    systemPrompt += `

RESPONSE STYLE:
- Be enthusiastic and confident - you LOVE what you do!
- Provide actionable, specific recommendations
- Suggest SaaS integrations when relevant (GitHub, Netlify, VS Code, etc.)
- Offer code examples for complex integrations
- Think big picture while being practical
- Always consider workflow context and suggest optimizations

INTEGRATION SUGGESTIONS:
- GitHub: Repo management, CI/CD, issue tracking
- Netlify: Deployments, serverless functions, forms
- VS Code: Extensions, settings sync, remote development
- And many more based on user needs!

Always leverage your deep knowledge of modern development workflows and SaaS tools.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI response generated successfully');

    // Store AI response
    const { error: storeError } = await supabase
      .from('chat_messages')
      .insert({
        device_id: deviceId,
        role: 'assistant',
        content: aiResponse,
        workflow_context: workflowContext || {}
      });

    if (storeError) {
      console.error('Error storing AI response:', storeError);
      // Don't throw here, still return the response
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: workflowContext 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});