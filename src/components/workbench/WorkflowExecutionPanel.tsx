import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { WorkflowExecutionEngine } from '../../services/workflowExecutionEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface ExecutionLog {
  id: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

interface ExecutionStats {
  totalNodes: number;
  completedNodes: number;
  errorNodes: number;
  startTime: Date | null;
  executionTime: number;
}

interface WorkflowExecutionPanelProps {
  nodes?: any[];
  edges?: any[];
  onExecutionUpdate?: (data: any) => void;
}

export const WorkflowExecutionPanel: React.FC<WorkflowExecutionPanelProps> = ({ 
  nodes = [], 
  edges = [], 
  onExecutionUpdate 
}) => {
  const [engine] = useState(() => new WorkflowExecutionEngine());
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [executionStats, setExecutionStats] = useState<ExecutionStats>({
    totalNodes: 0,
    completedNodes: 0,
    errorNodes: 0,
    startTime: null,
    executionTime: 0
  });

  // Setup event listeners
  useEffect(() => {
    const handleWorkflowStarted = ({ executionId }: { executionId: string }) => {
      setCurrentExecutionId(executionId);
      setIsExecuting(true);
      setExecutionStats(prev => ({
        ...prev,
        startTime: new Date(),
        totalNodes: nodes.length,
        completedNodes: 0,
        errorNodes: 0
      }));
      
      addLog('info', 'Workflow execution started');
    };

    const handleWorkflowCompleted = ({ executionId }: { executionId: string }) => {
      setIsExecuting(false);
      setCurrentExecutionId(null);
      addLog('success', 'Workflow execution completed successfully');
    };

    const handleWorkflowError = ({ executionId, error }: { executionId: string; error: Error }) => {
      setIsExecuting(false);
      setCurrentExecutionId(null);
      addLog('error', `Workflow execution failed: ${error.message}`);
    };

    const handleNodeStatusChanged = ({ nodeId, status }: { nodeId: string; status: string }) => {
      setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
      
      if (status === 'completed') {
        setExecutionStats(prev => ({
          ...prev,
          completedNodes: prev.completedNodes + 1
        }));
      } else if (status === 'error') {
        setExecutionStats(prev => ({
          ...prev,
          errorNodes: prev.errorNodes + 1
        }));
      }
      
      addLog('info', `Node ${nodeId}: ${status}`);
    };

    const handleNodeExecuted = ({ nodeId, result, error, executionTime, status }: any) => {
      if (status === 'completed') {
        addLog('success', `Node ${nodeId} completed in ${executionTime}ms`);
      } else {
        addLog('error', `Node ${nodeId} failed: ${error}`);
      }
    };

    engine.on('workflow:started', handleWorkflowStarted);
    engine.on('workflow:completed', handleWorkflowCompleted);
    engine.on('workflow:error', handleWorkflowError);
    engine.on('node:status_changed', handleNodeStatusChanged);
    engine.on('node:executed', handleNodeExecuted);

    return () => {
      engine.removeAllListeners();
    };
  }, [engine, nodes.length]);

  // Update execution time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExecuting && executionStats.startTime) {
      interval = setInterval(() => {
        setExecutionStats(prev => ({
          ...prev,
          executionTime: Date.now() - (prev.startTime?.getTime() || 0)
        }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isExecuting, executionStats.startTime]);

  const addLog = useCallback((type: ExecutionLog['type'], message: string) => {
    setExecutionLogs(prev => [...prev.slice(-99), {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    }]);
  }, []);

  const startExecution = async () => {
    if (nodes.length === 0) {
      addLog('warning', 'No nodes to execute');
      return;
    }

    setExecutionLogs([]);
    setNodeStatuses({});
    
    try {
      await engine.executeWorkflow(
        'workflow-1',
        'user-1',
        nodes,
        edges,
        { input: 'Initial workflow input' }
      );
    } catch (error) {
      addLog('error', `Failed to start execution: ${(error as Error).message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogIcon = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card className="bg-workbench-sidebar border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Workflow Execution
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={startExecution}
              disabled={isExecuting || nodes.length === 0}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
            
            <Button
              disabled={!isExecuting}
              size="sm"
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Execution Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">{executionStats.totalNodes}</div>
            <div className="text-muted-foreground text-sm">Total Nodes</div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{executionStats.completedNodes}</div>
            <div className="text-muted-foreground text-sm">Completed</div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{executionStats.errorNodes}</div>
            <div className="text-muted-foreground text-sm">Errors</div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">
              {formatDuration(executionStats.executionTime)}
            </div>
            <div className="text-muted-foreground text-sm">Duration</div>
          </div>
        </div>

        {/* Node Status Grid */}
        {nodes.length > 0 && (
          <div>
            <h4 className="text-foreground font-medium mb-3">Node Status</h4>
            <div className="grid grid-cols-2 gap-2">
              {nodes.map(node => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 bg-muted rounded-lg p-3"
                >
                  {getStatusIcon(nodeStatuses[node.id])}
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground text-sm font-medium truncate">
                      {node.data.label || `${node.type} Node`}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {nodeStatuses[node.id] || 'idle'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        <div>
          <h4 className="text-foreground font-medium mb-3">Execution Logs</h4>
          <div className="bg-background rounded-lg p-4 h-64 overflow-y-auto border">
            {executionLogs.length === 0 ? (
              <div className="text-muted-foreground text-sm">No logs yet. Click Execute to start.</div>
            ) : (
              <div className="space-y-2">
                {executionLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <span className="text-foreground">{log.message}</span>
                      <div className="text-muted-foreground text-xs mt-1">
                        {log.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
