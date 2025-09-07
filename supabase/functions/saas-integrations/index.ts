import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationRequest {
  service: 'github' | 'netlify' | 'vscode';
  action: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, action, data }: IntegrationRequest = await req.json();

    console.log(`SaaS Integration request: ${service} - ${action}`);

    switch (service) {
      case 'github':
        return await handleGitHubIntegration(action, data);
      case 'netlify':
        return await handleNetlifyIntegration(action, data);
      case 'vscode':
        return await handleVSCodeIntegration(action, data);
      default:
        throw new Error(`Unsupported service: ${service}`);
    }

  } catch (error) {
    console.error('Error in saas-integrations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGitHubIntegration(action: string, data?: any) {
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const headers = {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  switch (action) {
    case 'user':
      const userResponse = await fetch('https://api.github.com/user', { headers });
      const userData = await userResponse.json();
      return new Response(JSON.stringify(userData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    case 'repos':
      const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', { headers });
      const reposData = await reposResponse.json();
      return new Response(JSON.stringify(reposData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    case 'create-repo':
      const createResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          description: data.description || 'Created via FlameForge Workbench',
          private: data.private || false,
          auto_init: true,
        }),
      });
      const createData = await createResponse.json();
      return new Response(JSON.stringify(createData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    case 'issues':
      if (!data.repo) throw new Error('Repository required for issues');
      const issuesResponse = await fetch(`https://api.github.com/repos/${data.repo}/issues`, { headers });
      const issuesData = await issuesResponse.json();
      return new Response(JSON.stringify(issuesData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    default:
      throw new Error(`Unsupported GitHub action: ${action}`);
  }
}

async function handleNetlifyIntegration(action: string, data?: any) {
  // For now, return mock data or suggestions
  // User would need to add NETLIFY_TOKEN for full integration
  const suggestions = {
    sites: [
      { name: 'forge-workbench-prod', url: 'https://forge-workbench.netlify.app', status: 'published' },
      { name: 'forge-workbench-dev', url: 'https://dev--forge-workbench.netlify.app', status: 'draft' }
    ],
    deployments: [
      { id: '1', status: 'success', branch: 'main', created_at: new Date().toISOString() },
      { id: '2', status: 'building', branch: 'feature/ai-chat', created_at: new Date().toISOString() }
    ],
    forms: [
      { name: 'contact-form', submissions: 42 },
      { name: 'beta-signup', submissions: 128 }
    ]
  };

  return new Response(JSON.stringify({ 
    message: 'Netlify integration ready! Add NETLIFY_TOKEN for live data.',
    mockData: suggestions[action as keyof typeof suggestions] || suggestions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleVSCodeIntegration(action: string, data?: any) {
  // VS Code integration suggestions and tips
  const vscodeData = {
    extensions: [
      { name: 'GitHub Copilot', description: 'AI pair programmer' },
      { name: 'Prettier', description: 'Code formatter' },
      { name: 'ESLint', description: 'JavaScript linter' },
      { name: 'GitLens', description: 'Git supercharged' },
      { name: 'Thunder Client', description: 'REST API testing' },
      { name: 'Auto Rename Tag', description: 'HTML/JSX tag renaming' }
    ],
    settings: {
      'editor.formatOnSave': true,
      'editor.codeActionsOnSave': { 'source.fixAll.eslint': true },
      'files.autoSave': 'afterDelay',
      'workbench.colorTheme': 'Dark+ (default dark)',
    },
    snippets: {
      react: 'React functional component snippets',
      typescript: 'TypeScript utility snippets',
      supabase: 'Supabase client shortcuts'
    }
  };

  return new Response(JSON.stringify({
    message: 'VS Code optimization suggestions ready!',
    data: vscodeData[action as keyof typeof vscodeData] || vscodeData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}