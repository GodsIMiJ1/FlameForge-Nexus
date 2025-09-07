import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { File, FileText, Download, Upload, Trash2, Copy, AlertCircle, CheckCircle, Clock, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface FileNodeProps {
  data: {
    label?: string;
    description?: string;
    operation?: 'read' | 'write' | 'delete' | 'copy' | 'move' | 'upload' | 'download';
    filePath?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    encoding?: 'utf8' | 'base64' | 'binary';
    content?: string;
    destination?: string;
    status?: 'idle' | 'processing' | 'completed' | 'error';
    lastOperation?: {
      operation: string;
      timestamp: Date;
      success: boolean;
      error?: string;
    };
  };
  selected?: boolean;
}

export const FileNode: React.FC<FileNodeProps> = ({ data, selected }) => {
  const getOperationIcon = (operation?: string) => {
    const iconClass = "w-4 h-4";
    switch (operation) {
      case 'read':
        return <FileText className={iconClass} />;
      case 'write':
        return <File className={iconClass} />;
      case 'delete':
        return <Trash2 className={iconClass} />;
      case 'copy':
        return <Copy className={iconClass} />;
      case 'move':
        return <FolderOpen className={iconClass} />;
      case 'upload':
        return <Upload className={iconClass} />;
      case 'download':
        return <Download className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const getOperationColor = (operation?: string) => {
    switch (operation) {
      case 'read':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'write':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'copy':
      case 'move':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'upload':
      case 'download':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'processing':
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
      case 'processing':
        return <Clock className="w-3 h-3 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-3 h-3" />;
    
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
      return <FileText className="w-3 h-3 text-blue-500" />;
    }
    
    return <File className="w-3 h-3 text-gray-500" />;
  };

  const formatPath = (path?: string) => {
    if (!path) return 'No path specified';
    return path.length > 35 ? `...${path.substring(path.length - 35)}` : path;
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''} bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">{data?.label || 'File Operation'}</span>
            {data?.operation && (
              <Badge className={`text-xs ${getOperationColor(data.operation)}`}>
                <div className="flex items-center gap-1">
                  {getOperationIcon(data.operation)}
                  {data.operation.toUpperCase()}
                </div>
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
        {/* File Path */}
        <div className="bg-muted rounded p-2">
          <div className="text-xs font-medium text-foreground mb-1">File Path:</div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            {formatPath(data?.filePath)}
          </div>
        </div>

        {/* File Info */}
        {(data?.fileName || data?.fileType || data?.fileSize) && (
          <div className="space-y-2">
            {data?.fileName && (
              <div className="flex items-center gap-2 text-xs">
                {getFileTypeIcon(data?.fileType)}
                <span className="text-muted-foreground truncate">{data.fileName}</span>
              </div>
            )}
            
            {data?.fileSize && (
              <div className="flex items-center gap-2 text-xs">
                <File className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{formatFileSize(data.fileSize)}</span>
              </div>
            )}

            {data?.encoding && (
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Encoding: {data.encoding}</span>
              </div>
            )}
          </div>
        )}

        {/* Content Preview */}
        {data?.content && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Content Preview:</div>
            <div className="text-xs text-muted-foreground font-mono">
              {data.content.length > 60 ? `${data.content.substring(0, 60)}...` : data.content}
            </div>
          </div>
        )}

        {/* Destination (for copy/move operations) */}
        {data?.destination && (data?.operation === 'copy' || data?.operation === 'move') && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Destination:</div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {formatPath(data.destination)}
            </div>
          </div>
        )}

        {/* Last Operation */}
        {data?.lastOperation && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Last Operation:</div>
            <div className="space-y-1">
              <div className={`text-xs font-medium ${data.lastOperation.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.lastOperation.operation} - {data.lastOperation.success ? 'Success' : 'Failed'}
              </div>
              {data.lastOperation.error && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  {data.lastOperation.error}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {data.lastOperation.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8"
            size="sm"
            disabled={!data?.filePath || data?.status === 'processing'}
          >
            {data?.status === 'processing' ? (
              <Clock className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              getOperationIcon(data?.operation)
            )}
            {data?.status === 'processing' ? 'Processing...' : 
             data?.operation ? `${data.operation.charAt(0).toUpperCase() + data.operation.slice(1)} File` : 'Execute'}
          </Button>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
};

FileNode.displayName = 'FileNode';
