import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Play, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface DatabaseNodeProps {
  data: {
    label?: string;
    description?: string;
    connectionType?: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'supabase';
    query?: string;
    connectionString?: string;
    status?: 'idle' | 'running' | 'completed' | 'error';
    lastResult?: any;
  };
  selected?: boolean;
}

export const DatabaseNode: React.FC<DatabaseNodeProps> = ({ data, selected }) => {
  const getConnectionIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'postgresql':
        return <div className={`${iconClass} bg-blue-500 rounded`} />;
      case 'mysql':
        return <div className={`${iconClass} bg-orange-500 rounded`} />;
      case 'mongodb':
        return <div className={`${iconClass} bg-green-500 rounded`} />;
      case 'sqlite':
        return <div className={`${iconClass} bg-gray-500 rounded`} />;
      case 'supabase':
        return <div className={`${iconClass} bg-emerald-500 rounded`} />;
      default:
        return <Database className={iconClass} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-3 h-3 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''} bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-700`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{data?.label || 'Database Query'}</span>
            {data?.connectionType && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                {data.connectionType.toUpperCase()}
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
        {/* Connection Info */}
        <div className="flex items-center gap-2 text-xs">
          {getConnectionIcon(data?.connectionType || '')}
          <span className="text-muted-foreground">
            {data?.connectionType ? `${data.connectionType} connection` : 'No connection configured'}
          </span>
        </div>

        {/* Query Preview */}
        {data?.query && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Query:</div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {data.query.length > 50 ? `${data.query.substring(0, 50)}...` : data.query}
            </div>
          </div>
        )}

        {/* Last Result */}
        {data?.lastResult && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Last Result:</div>
            <div className="text-xs text-muted-foreground">
              {Array.isArray(data.lastResult) 
                ? `${data.lastResult.length} rows returned`
                : typeof data.lastResult === 'object'
                ? 'Object returned'
                : String(data.lastResult).substring(0, 30)
              }
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8"
            size="sm"
            disabled={!data?.query || data?.status === 'running'}
          >
            {data?.status === 'running' ? (
              <Play className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Database className="h-3 w-3 mr-2" />
            )}
            {data?.status === 'running' ? 'Executing...' : 'Execute Query'}
          </Button>

          <Button
            variant="outline"
            className="h-8"
            size="sm"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
};

DatabaseNode.displayName = 'DatabaseNode';
