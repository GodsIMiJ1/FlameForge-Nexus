import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  permissions: string[];
  usage_count: number;
}

export const ApiKeyManager = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    name: string;
    permissions: string[];
    expires_at: string;
    rate_limit_per_hour: number;
  }>({
    name: '',
    permissions: ['read'],
    expires_at: '',
    rate_limit_per_hour: 1000
  });
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data || []).map(key => ({
        ...key,
        permissions: Array.isArray(key.permissions) 
          ? (key.permissions as string[]) 
          : ['read'],
        last_used_at: key.last_used_at || undefined,
        expires_at: key.expires_at || undefined,
        usage_count: key.usage_count || 0
      })));
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyData.name.trim()) {
      toast({
        title: 'Error', 
        description: 'API key name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate new API key
      const { data: newKey } = await supabase.rpc('generate_api_key');
      const { data: keyHash } = await supabase.rpc('hash_api_key', { key: newKey });

      const { data: apiKey, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyData.name,
          key_hash: keyHash,
          key_prefix: newKey.substring(0, 8) + '...',
          permissions: newKeyData.permissions,
          expires_at: newKeyData.expires_at || null,
          rate_limit_per_hour: newKeyData.rate_limit_per_hour
        })
        .select()
        .single();

      if (error) throw error;

      setRevealedKey(newKey);
      setApiKeys([{ 
        ...apiKey, 
        permissions: Array.isArray(apiKey.permissions) 
          ? (apiKey.permissions as string[]) 
          : ['read'],
        last_used_at: apiKey.last_used_at || undefined,
        expires_at: apiKey.expires_at || undefined,
        usage_count: apiKey.usage_count || 0
      }, ...apiKeys]);
      setShowCreateDialog(false);
      setNewKeyData({
        name: '',
        permissions: ['read'],
        expires_at: '',
        rate_limit_per_hour: 1000
      });

      toast({
        title: 'Success',
        description: 'API key created successfully! Copy it now - it won\'t be shown again.'
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast({
        title: 'Success',
        description: 'API key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading API keys...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Key Reveal Modal */}
      {revealedKey && (
        <Dialog open={!!revealedKey} onOpenChange={() => setRevealedKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your New API Key</DialogTitle>
              <DialogDescription>
                Copy this key now - it won't be shown again for security reasons.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                {revealedKey}
              </div>
              <Button onClick={() => copyToClipboard(revealedKey)} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for external integrations with FlameForge Nexus
              </CardDescription>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for external application integration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="My App Integration"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="permissions">Permissions</Label>
                    <Select 
                      value={newKeyData.permissions[0]} 
                      onValueChange={(value) => setNewKeyData({ ...newKeyData, permissions: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Only</SelectItem>
                        <SelectItem value="write">Read & Write</SelectItem>
                        <SelectItem value="admin">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rate_limit">Rate Limit (requests/hour)</Label>
                    <Input
                      id="rate_limit"
                      type="number"
                      value={newKeyData.rate_limit_per_hour}
                      onChange={(e) => setNewKeyData({ ...newKeyData, rate_limit_per_hour: parseInt(e.target.value) || 1000 })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expires">Expires At (optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={newKeyData.expires_at}
                      onChange={(e) => setNewKeyData({ ...newKeyData, expires_at: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create API Key'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys created yet</p>
              <p className="text-sm">Create your first API key to start integrating with external apps</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {Array.isArray(apiKey.permissions) ? apiKey.permissions.join(', ') : 'read'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {apiKey.key_prefix}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {formatDate(apiKey.created_at)}
                        </span>
                        {apiKey.last_used_at && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last used: {formatDate(apiKey.last_used_at)}
                          </span>
                        )}
                        <span>Usage: {apiKey.usage_count} requests</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Quick reference for integrating with the FlameForge Nexus API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              https://wixzqilqithhlybhyite.supabase.co/functions/v1/flameforge-api
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the request header:
            </p>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              X-API-Key: your_api_key_here
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">Common Endpoints</h4>
            <div className="space-y-2 text-sm">
              <div><code className="bg-muted px-1 py-0.5 rounded">GET /docs</code> - API documentation</div>
              <div><code className="bg-muted px-1 py-0.5 rounded">GET /workflows</code> - List workflows</div>
              <div><code className="bg-muted px-1 py-0.5 rounded">POST /workflows</code> - Create workflow</div>
              <div><code className="bg-muted px-1 py-0.5 rounded">GET /workflows/{`{id}`}</code> - Get workflow details</div>
              <div><code className="bg-muted px-1 py-0.5 rounded">POST /chat/send</code> - Send AI chat message</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};