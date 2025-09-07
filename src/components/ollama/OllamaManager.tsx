// Ollama Management Component for FlameForge Nexus
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Zap
} from 'lucide-react';
import { useOllamaContext, useBestOllamaInstance, useAllAvailableModels } from '@/contexts/OllamaContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const OllamaManager: React.FC = () => {
  const {
    config,
    updateConfig,
    instances,
    addInstance,
    removeInstance,
    connectionStatuses,
    refreshConnection,
    refreshAllConnections,
    discoverInstances,
    isDiscovering,
    isInitialized,
    globalError
  } = useOllamaContext();

  const bestInstance = useBestOllamaInstance();
  const allModels = useAllAvailableModels();

  const [newEndpoint, setNewEndpoint] = useState('');
  const [isAddingInstance, setIsAddingInstance] = useState(false);

  const handleAddInstance = async () => {
    if (!newEndpoint.trim()) return;

    setIsAddingInstance(true);
    try {
      addInstance({
        user_id: 'current-user', // This should come from auth context
        endpoint: newEndpoint.trim(),
        name: `Ollama (${newEndpoint.trim()})`,
        is_active: true,
        last_seen: new Date().toISOString(),
        available_models: [],
        connection_metadata: {}
      });
      setNewEndpoint('');
      await refreshConnection(newEndpoint.trim());
    } finally {
      setIsAddingInstance(false);
    }
  };

  const getStatusIcon = (endpoint: string) => {
    const status = connectionStatuses.get(endpoint);
    if (!status) {
      return <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
    }
    return status.connected ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (endpoint: string) => {
    const status = connectionStatuses.get(endpoint);
    if (!status) return 'bg-yellow-500';
    return status.connected ? 'bg-green-500' : 'bg-red-500';
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Initializing Ollama integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Ollama Integration
          </CardTitle>
          <CardDescription>
            Manage local AI model instances and configurations for FlameForge Nexus
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Global Error */}
      {globalError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{globalError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
          <CardDescription>
            Global settings for Ollama integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-discovery</Label>
              <p className="text-xs text-muted-foreground">
                Automatically discover and monitor local Ollama instances
              </p>
            </div>
            <Switch
              checked={config.autoDiscovery}
              onCheckedChange={(checked) => updateConfig({ autoDiscovery: checked })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Connection Timeout (ms)</Label>
              <Input
                type="number"
                value={config.connectionTimeout}
                onChange={(e) => updateConfig({ connectionTimeout: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Cache Timeout (ms)</Label>
              <Input
                type="number"
                value={config.cacheTimeout}
                onChange={(e) => updateConfig({ cacheTimeout: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instance Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ollama Instances</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discoverInstances}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Discover
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllConnections}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh All
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage your local Ollama instances and their connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Instance */}
          <div className="flex gap-2">
            <Input
              placeholder="http://localhost:11434"
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddInstance()}
            />
            <Button
              onClick={handleAddInstance}
              disabled={!newEndpoint.trim() || isAddingInstance}
            >
              {isAddingInstance ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </Button>
          </div>

          <Separator />

          {/* Instance List */}
          <div className="space-y-3">
            {instances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No Ollama instances configured</p>
                <p className="text-xs">Add an instance above or use auto-discovery</p>
              </div>
            ) : (
              instances.map((instance) => {
                const status = connectionStatuses.get(instance.endpoint);
                const isBest = bestInstance?.endpoint === instance.endpoint;
                
                return (
                  <Card key={instance.id} className={`${isBest ? 'ring-2 ring-purple-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(instance.endpoint)}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{instance.name}</span>
                              {isBest && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Best
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{instance.endpoint}</p>
                            {status?.version && (
                              <p className="text-xs text-muted-foreground">Version: {status.version}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(instance.endpoint)}
                          <Badge variant="outline" className="text-xs">
                            {instance.available_models.length} models
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refreshConnection(instance.endpoint)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInstance(instance.endpoint)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {status?.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          Error: {status.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Models available across all connected Ollama instances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allModels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No models available</p>
              <p className="text-xs">Connect to an Ollama instance to see available models</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allModels.map((model) => (
                <Card key={`${model.endpoint}-${model.name}`} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{model.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.details?.parameter_size || 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{model.instanceName}</p>
                    <div className="text-xs text-muted-foreground">
                      Size: {(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
