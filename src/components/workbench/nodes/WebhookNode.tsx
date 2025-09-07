import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Webhook, Send, Globe, Lock, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface WebhookNodeProps {
  data: {
    label?: string;
    description?: string;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    payload?: any;
    authentication?: 'none' | 'bearer' | 'basic' | 'api_key';
    timeout?: number;
    retries?: number;
    status?: 'idle' | 'sending' | 'success' | 'error' | 'timeout';
    lastResponse?: {
      status: number;
      statusText: string;
      data?: any;
      timestamp: Date;
      responseTime: number;
    };
  };
  selected?: boolean;
}

export const WebhookNode: React.FC<WebhookNodeProps> = ({ data, selected }) => {
  const getMethodColor = (method?: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'PUT':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'sending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'success':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'error':
      case 'timeout':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Send className="w-3 h-3 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
      case 'timeout':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getAuthIcon = (auth?: string) => {
    switch (auth) {
      case 'bearer':
      case 'basic':
      case 'api_key':
        return <Lock className="w-3 h-3 text-green-500" />;
      default:
        return <Globe className="w-3 h-3 text-gray-500" />;
    }
  };

  const getResponseStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400';
    if (status >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatUrl = (url?: string) => {
    if (!url) return 'No URL configured';
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url.length > 30 ? `${url.substring(0, 30)}...` : url;
    }
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''} bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-purple-500" />
            <span className="font-semibold">{data?.label || 'Webhook'}</span>
            {data?.method && (
              <Badge className={`text-xs ${getMethodColor(data.method)}`}>
                {data.method}
              </Badge>
            )}
          </div>
          {data?.status && (
            <Badge className={`text-xs ${getStatusColor(data.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(data.status)}
                {data.status}
              </div>
            </Badge>
          )}
        </CardTitle>
        {data?.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* URL and Authentication */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">
              {formatUrl(data?.url)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getAuthIcon(data?.authentication)}
            <span className="text-muted-foreground">
              {data?.authentication === 'none' ? 'No authentication' : 
               data?.authentication ? `${data.authentication} auth` : 'Auth not configured'}
            </span>
          </div>
        </div>

        {/* Request Configuration */}
        <div className="bg-muted rounded p-2">
          <div className="text-xs font-medium text-foreground mb-1">Configuration:</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {data?.timeout && (
              <div>Timeout: {data.timeout}ms</div>
            )}
            {data?.retries && (
              <div>Retries: {data.retries}</div>
            )}
            {data?.headers && Object.keys(data.headers).length > 0 && (
              <div>Headers: {Object.keys(data.headers).length} configured</div>
            )}
          </div>
        </div>

        {/* Payload Preview */}
        {data?.payload && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Payload:</div>
            <div className="text-xs text-muted-foreground font-mono">
              {typeof data.payload === 'string' 
                ? (data.payload.length > 50 ? `${data.payload.substring(0, 50)}...` : data.payload)
                : JSON.stringify(data.payload).substring(0, 50) + '...'
              }
            </div>
          </div>
        )}

        {/* Last Response */}
        {data?.lastResponse && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Last Response:</div>
            <div className="space-y-1">
              <div className={`text-xs font-medium ${getResponseStatusColor(data.lastResponse.status)}`}>
                {data.lastResponse.status} {data.lastResponse.statusText}
              </div>
              <div className="text-xs text-muted-foreground">
                Response time: {data.lastResponse.responseTime}ms
              </div>
              <div className="text-xs text-muted-foreground">
                {data.lastResponse.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8"
            size="sm"
            disabled={!data?.url || data?.status === 'sending'}
          >
            {data?.status === 'sending' ? (
              <Send className="h-3 w-3 mr-2 animate-pulse" />
            ) : (
              <Zap className="h-3 w-3 mr-2" />
            )}
            {data?.status === 'sending' ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
};

WebhookNode.displayName = 'WebhookNode';
