import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Activity, Clock, CheckCircle, XCircle, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { WorkflowExecutionEngine } from '../../services/workflowExecutionEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

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

interface WorkflowExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes?: any[];
  edges?: any[];
  onExecutionUpdate?: (data: any) => void;
}

export const WorkflowExecutionModal: React.FC<WorkflowExecutionModalProps> = ({ 
  isOpen,
  onClose,
  nodes = [], 
  edges = [], 
  onExecutionUpdate 
}) => {
  const [engine] = useState(() => new WorkflowExecutionEngine());
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
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
      
      addLog('info', '🚀 Workflow execution started');
    };

    const handleWorkflowCompleted = ({ executionId }: { executionId: string }) => {
      setIsExecuting(false);
      setCurrentExecutionId(null);
      addLog('success', '✅ Workflow execution completed successfully');
    };

    const handleWorkflowError = ({ executionId, error }: { executionId: string; error: Error }) => {
      setIsExecuting(false);
      setCurrentExecutionId(null);
      addLog('error', `❌ Workflow execution failed: ${error.message}`);
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
      
      const nodeLabel = nodes.find(n => n.id === nodeId)?.data?.label || nodeId;
      addLog('info', `🔄 ${nodeLabel}: ${status}`);
    };

    const handleNodeExecuted = ({ nodeId, result, error, executionTime, status }: any) => {
      const nodeLabel = nodes.find(n => n.id === nodeId)?.data?.label || nodeId;
      if (status === 'completed') {
        addLog('success', `✅ ${nodeLabel} completed in ${executionTime}ms`);
      } else {
        addLog('error', `❌ ${nodeLabel} failed: ${error}`);
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
  }, [engine, nodes]);

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
      addLog('warning', '⚠️ No nodes to execute');
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
      addLog('error', `❌ Failed to start execution: ${(error as Error).message}`);
    }
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setCurrentExecutionId(null);
    addLog('warning', '⏹️ Execution stopped by user');
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

  const getProgressPercentage = () => {
    if (executionStats.totalNodes === 0) return 0;
    return Math.round(((executionStats.completedNodes + executionStats.errorNodes) / executionStats.totalNodes) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-7xl h-[90vh]' : 'max-w-4xl h-[80vh]'} bg-workbench-sidebar border-border transition-all duration-300`}>
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-500" />
              <span>Workflow Execution Engine</span>
              {isExecuting && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400">Running</span>
                </div>
              )}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
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
                onClick={stopExecution}
                disabled={!isExecuting}
                size="sm"
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isExecuting && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress: {getProgressPercentage()}%</span>
                <span>{executionStats.completedNodes + executionStats.errorNodes} / {executionStats.totalNodes} nodes</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className={`grid ${isMaximized ? 'grid-cols-3' : 'grid-cols-1'} gap-6 h-full`}>
            {/* Execution Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{executionStats.totalNodes}</div>
                  <div className="text-muted-foreground text-sm">Total Nodes</div>
                </div>
                
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{executionStats.completedNodes}</div>
                  <div className="text-muted-foreground text-sm">Completed</div>
                </div>
                
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{executionStats.errorNodes}</div>
                  <div className="text-muted-foreground text-sm">Errors</div>
                </div>
                
                <div className="bg-muted rounded-lg p-4 text-center">
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {nodes.map(node => (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 bg-muted rounded-lg p-3"
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
            </div>

            {/* Execution Logs */}
            <div className={isMaximized ? 'col-span-2' : ''}>
              <h4 className="text-foreground font-medium mb-3">Execution Logs</h4>
              <div className="bg-background rounded-lg p-4 h-full overflow-y-auto border">
                {executionLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No logs yet. Click Execute to start workflow.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executionLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
