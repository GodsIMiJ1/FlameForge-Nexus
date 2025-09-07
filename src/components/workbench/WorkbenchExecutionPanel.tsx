import { useState } from 'react';
import { Play, Square, RotateCcw, History, Eye, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ExecutionLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  nodeId?: string;
  duration?: number;
}

export const WorkbenchExecutionPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: '1',
      timestamp: new Date(),
      type: 'success',
      message: 'Agent node initialized successfully',
      nodeId: 'agent-1',
      duration: 120
    },
    {
      id: '2',
      timestamp: new Date(),
      type: 'info',
      message: 'Connecting to Slack API...',
      nodeId: 'tool-1'
    },
    {
      id: '3',
      timestamp: new Date(),
      type: 'error',
      message: 'Authentication failed - invalid token',
      nodeId: 'tool-1',
      duration: 1500
    }
  ]);

  const handleRun = () => {
    setIsRunning(true);
    // Simulate execution
    setTimeout(() => {
      setIsRunning(false);
      setExecutionLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'success',
        message: 'Workflow execution completed',
        duration: 3200
      }]);
    }, 3000);
  };

  const getLogIcon = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLogBadgeVariant = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-96 h-full bg-card border-border shadow-sidebar">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Execution Control
          </h3>
          <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
            {isRunning ? 'Running' : 'Ready'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRun}
            disabled={isRunning}
            size="sm" 
            className="bg-gradient-primary flex-1"
          >
            {isRunning ? (
              <Square className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Stop' : 'Run'}
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <History className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 pb-2">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            Execution Log
          </h4>
        </div>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-3">
            {executionLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getLogBadgeVariant(log.type)} className="text-xs">
                      {log.type.toUpperCase()}
                    </Badge>
                    {log.nodeId && (
                      <Badge variant="outline" className="text-xs">
                        {log.nodeId}
                      </Badge>
                    )}
                    {log.duration && (
                      <span className="text-xs text-muted-foreground">
                        {log.duration}ms
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground mb-1">{log.message}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            {executionLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No execution history</p>
                <p className="text-xs">Run a workflow to see logs</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};