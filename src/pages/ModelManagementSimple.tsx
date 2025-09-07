import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const ModelManagementSimple: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simple Ollama connection test
  const testOllamaConnection = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        setOllamaConnected(true);
        setModels(data.models || []);
        setError(null);
      } else {
        setOllamaConnected(false);
        setError('Ollama API returned error');
      }
    } catch (err) {
      setOllamaConnected(false);
      setError('Cannot connect to Ollama. Make sure it\'s running on localhost:11434');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testOllamaConnection();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-500" />
              <h1 className="text-xl font-semibold">Model Management (Simple)</h1>
              {ollamaConnected ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            <Button onClick={testOllamaConnection} disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Make sure Ollama is running: <code>ollama serve</code>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ollamaConnected ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                Ollama API
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{models.length}</div>
              <p className="text-xs text-muted-foreground">
                Available models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(models.reduce((sum, m) => sum + (m.size || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Storage used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Models List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Ollama Models</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading models...</p>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No models found</p>
                <p className="text-sm">
                  {ollamaConnected 
                    ? 'Pull a model with: ollama pull llama3.1' 
                    : 'Start Ollama to see your models'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {models.map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(model.size)} • {new Date(model.modified_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {model.digest?.substring(0, 12) || 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
