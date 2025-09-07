import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SaasIntegrationRequest {
  service: 'github' | 'netlify' | 'vscode';
  action: string;
  data?: any;
}

export const useSaasIntegrations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const callIntegration = async (request: SaasIntegrationRequest) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('saas-integrations', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Integration request failed');
      }

      toast({
        title: "Integration Success",
        description: `${request.service} ${request.action} completed successfully`,
      });

      return data;

    } catch (error) {
      console.error('SaaS integration error:', error);
      
      toast({
        title: "Integration Error",
        description: error instanceof Error ? error.message : "Integration request failed",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // GitHub integrations
  const github = {
    getUser: () => callIntegration({ service: 'github', action: 'user' }),
    getRepos: () => callIntegration({ service: 'github', action: 'repos' }),
    createRepo: (name: string, description?: string, isPrivate?: boolean) => 
      callIntegration({ 
        service: 'github', 
        action: 'create-repo', 
        data: { name, description, private: isPrivate } 
      }),
    getIssues: (repo: string) => 
      callIntegration({ service: 'github', action: 'issues', data: { repo } }),
  };

  // Netlify integrations
  const netlify = {
    getSites: () => callIntegration({ service: 'netlify', action: 'sites' }),
    getDeployments: () => callIntegration({ service: 'netlify', action: 'deployments' }),
    getForms: () => callIntegration({ service: 'netlify', action: 'forms' }),
  };

  // VS Code integrations
  const vscode = {
    getExtensions: () => callIntegration({ service: 'vscode', action: 'extensions' }),
    getSettings: () => callIntegration({ service: 'vscode', action: 'settings' }),
    getSnippets: () => callIntegration({ service: 'vscode', action: 'snippets' }),
  };

  return {
    isLoading,
    github,
    netlify,
    vscode,
    callIntegration
  };
};