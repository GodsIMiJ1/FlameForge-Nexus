// components/ExecutionMonitor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  runningNodes: number;
  startTime: Date;
  estimatedCompletion?: Date;
  averageNodeTime: number;
}

interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  nodeId?: string;
  nodeName?: string;
  message: string;
  details?: any;
  executionTime?: number;
}

interface NodeExecutionState {
  nodeId: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  executionTime?: number;
}

interface ExecutionMonitorProps {
  workflowId: string;
  executionId?: string;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  workflowId,
  executionId,
  onStart,
  onPause,
  onStop,
  onReset
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    runningNodes: 0,
    startTime: new Date(),
    averageNodeTime: 0
  });
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionState>>(new Map());
  const [activeTab, setActiveTab] = useState('overview');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Simulate real-time updates (replace with actual WebSocket/EventSource)
  useEffect(() => {
    if (!executionId || !isRunning) return;

    const interval = setInterval(() => {
      // This would be replaced with actual event listeners
      updateExecutionMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [executionId, isRunning]);

  const updateExecutionMetrics = () => {
    // Mock update - replace with actual data from your execution engine
    setMetrics(prev => ({
      ...prev,
      completedNodes: Math.min(prev.completedNodes + Math.random() * 0.1, prev.totalNodes)
    }));
  };

  const addLog = (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    const newLog: ExecutionLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateNodeState = (nodeId: string, state: Partial<NodeExecutionState>) => {
    setNodeStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(nodeId) || {
        nodeId,
        status: 'idle',
        progress: 0
      };
      newStates.set(nodeId, { ...existing, ...state });
      return newStates;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const progress = metrics.totalNodes > 0 
    ? (metrics.completedNodes / metrics.totalNodes) * 100 
    : 0;

  const elapsedTime = Date.now() - metrics.startTime.getTime();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Execution Monitor
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? "secondary" : "default"}
              size="sm"
              onClick={() => {
                if (isRunning) {
                  onPause();
                  setIsPaused(true);
                } else {
                  onStart();
                  setIsRunning(true);
                  setIsPaused(false);
                }
              }}
              disabled={!workflowId}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onStop();
                setIsRunning(false);
                setIsPaused(false);
              }}
              disabled={!isRunning && !isPaused}
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReset();
                setIsRunning(false);
                setIsPaused(false);
                setLogs([]);
                setNodeStates(new Map());
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-4">
            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Nodes</span>
                  <Badge variant="outline">{metrics.totalNodes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {metrics.completedNodes}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Running</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {metrics.runningNodes}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {metrics.failedNodes}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Elapsed Time</span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(elapsedTime)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Node Time</span>
                  <Badge variant="outline">
                    {formatDuration(metrics.averageNodeTime)}
                  </Badge>
                </div>
                {metrics.estimatedCompletion && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ETA</span>
                    <Badge variant="outline">
                      {formatDuration(metrics.estimatedCompletion.getTime() - Date.now())}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Status Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Execution Status</h4>
              <div className="flex items-center gap-2 text-sm">
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-blue-600">Running</span>
                  </>
                ) : isPaused ? (
                  <>
                    <Pause className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600">Paused</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Stopped</span>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {Array.from(nodeStates.entries()).map(([nodeId, state]) => (
                  <Card key={nodeId} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(state.status)}
                        <span className="text-sm font-medium">
                          {state.nodeName || `Node ${nodeId.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {state.executionTime && (
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(state.executionTime)}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {state.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {state.status === 'running' && (
                      <div className="mt-2">
                        <Progress value={state.progress} className="w-full h-2" />
                      </div>
                    )}
                    
                    {state.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        {state.error}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 text-xs hover:bg-gray-50 rounded"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.nodeName && (
                          <Badge variant="outline" className="text-xs">
                            {log.nodeName}
                          </Badge>
                        )}
                        {log.executionTime && (
                          <Badge variant="secondary" className="text-xs">
                            {formatDuration(log.executionTime)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-gray-900">{log.message}</div>
                      {log.details && (
                        <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-1 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// hooks/useExecutionMonitor.ts
import { useState, useEffect, useCallback } from 'react';
import { WorkflowExecutionEngine } from '@/services/workflowExecutionEngine';

export const useExecutionMonitor = (workflowId: string) => {
  const [executionEngine] = useState(() => new WorkflowExecutionEngine(/* supabase client */));
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // Listen to execution events
    const handleNodeStatusChange = ({ nodeId, status }: any) => {
      setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
    };

    const handleWorkflowStarted = ({ executionId: id }: any) => {
      setExecutionId(id);
      setIsRunning(true);
    };

    const handleWorkflowCompleted = () => {
      setIsRunning(false);
    };

    const handleWorkflowError = () => {
      setIsRunning(false);
    };

    executionEngine.on('node:status_changed', handleNodeStatusChange);
    executionEngine.on('workflow:started', handleWorkflowStarted);
    executionEngine.on('workflow:completed', handleWorkflowCompleted);
    executionEngine.on('workflow:error', handleWorkflowError);

    return () => {
      executionEngine.off('node:status_changed', handleNodeStatusChange);
      executionEngine.off('workflow:started', handleWorkflowStarted);
      executionEngine.off('workflow:completed', handleWorkflowCompleted);
      executionEngine.off('workflow:error', handleWorkflowError);
    };
  }, [executionEngine]);

  const startExecution = useCallback(async (nodes: any[], edges: any[]) => {
    if (!workflowId) return;
    
    try {
      const id = await executionEngine.executeWorkflow(
        workflowId,
        'user-id', // Replace with actual user ID
        nodes,
        edges
      );
      setExecutionId(id);
    } catch (error) {
      console.error('Failed to start execution:', error);
    }
  }, [workflowId, executionEngine]);

  const pauseExecution = useCallback(async () => {
    if (executionId) {
      await executionEngine.pauseWorkflow(executionId);
    }
  }, [executionId, executionEngine]);

  const stopExecution = useCallback(async () => {
    if (executionId) {
      await executionEngine.cancelWorkflow(executionId);
      setIsRunning(false);
    }
  }, [executionId, executionEngine]);

  const resetExecution = useCallback(() => {
    setExecutionId(null);
    setIsRunning(false);
    setNodeStatuses({});
  }, []);

  return {
    executionId,
    isRunning,
    nodeStatuses,
    startExecution,
    pauseExecution,
    stopExecution,
    resetExecution,
    executionEngine
  };
};

// Canvas Integration for Real-time Visual Updates
// components/WorkflowCanvas.tsx (additional code)

const updateNodeAppearance = useCallback((nodeId: string, status: string) => {
  setNodes(nodes => 
    nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            status,
            // Add visual indicators based on status
            className: `node-${status}`
          }
        };
      }
      return node;
    })
  );
}, [setNodes]);

// CSS for node status visualization
const nodeStatusStyles = `
.node-idle {
  border: 2px solid #e5e7eb;
}

.node-running {
  border: 2px solid #3b82f6;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.node-completed {
  border: 2px solid #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.node-error {
  border: 2px solid #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
}
`;