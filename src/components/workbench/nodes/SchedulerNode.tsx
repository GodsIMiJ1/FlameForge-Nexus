import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock, Calendar, Timer, Play, Pause, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface SchedulerNodeProps {
  data: {
    label?: string;
    description?: string;
    scheduleType?: 'once' | 'interval' | 'cron' | 'delay';
    scheduleValue?: string | number;
    cronExpression?: string;
    timezone?: string;
    nextRun?: Date;
    lastRun?: Date;
    runCount?: number;
    maxRuns?: number;
    status?: 'idle' | 'scheduled' | 'running' | 'paused' | 'completed' | 'error';
    isActive?: boolean;
  };
  selected?: boolean;
}

export const SchedulerNode: React.FC<SchedulerNodeProps> = ({ data, selected }) => {
  const getScheduleTypeIcon = (type?: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'once':
        return <Clock className={iconClass} />;
      case 'interval':
        return <RotateCcw className={iconClass} />;
      case 'cron':
        return <Calendar className={iconClass} />;
      case 'delay':
        return <Timer className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getScheduleTypeColor = (type?: string) => {
    switch (type) {
      case 'once':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'interval':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'cron':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'delay':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled':
      case 'running':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-3 h-3" />;
      case 'running':
        return <Play className="w-3 h-3 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatScheduleValue = () => {
    if (!data?.scheduleType || !data?.scheduleValue) return 'Not configured';
    
    switch (data.scheduleType) {
      case 'once':
        return `Run once at ${new Date(data.scheduleValue).toLocaleString()}`;
      case 'interval':
        const interval = Number(data.scheduleValue);
        if (interval < 60000) return `Every ${interval}ms`;
        if (interval < 3600000) return `Every ${Math.round(interval / 60000)}m`;
        if (interval < 86400000) return `Every ${Math.round(interval / 3600000)}h`;
        return `Every ${Math.round(interval / 86400000)}d`;
      case 'cron':
        return `Cron: ${data.cronExpression || data.scheduleValue}`;
      case 'delay':
        const delay = Number(data.scheduleValue);
        if (delay < 60000) return `Delay ${delay}ms`;
        if (delay < 3600000) return `Delay ${Math.round(delay / 60000)}m`;
        return `Delay ${Math.round(delay / 3600000)}h`;
      default:
        return String(data.scheduleValue);
    }
  };

  const getTimeUntilNext = () => {
    if (!data?.nextRun) return null;
    const now = new Date();
    const diff = data.nextRun.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''} bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 dark:from-indigo-900/20 dark:to-blue-900/20 dark:border-indigo-700`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold">{data?.label || 'Scheduler'}</span>
            {data?.scheduleType && (
              <Badge className={`text-xs ${getScheduleTypeColor(data.scheduleType)}`}>
                <div className="flex items-center gap-1">
                  {getScheduleTypeIcon(data.scheduleType)}
                  {data.scheduleType.toUpperCase()}
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
        {/* Schedule Configuration */}
        <div className="bg-muted rounded p-2">
          <div className="text-xs font-medium text-foreground mb-1">Schedule:</div>
          <div className="text-xs text-muted-foreground">
            {formatScheduleValue()}
          </div>
          {data?.timezone && (
            <div className="text-xs text-muted-foreground mt-1">
              Timezone: {data.timezone}
            </div>
          )}
        </div>

        {/* Next Run */}
        {data?.nextRun && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Next Run:</div>
            <div className="text-xs text-muted-foreground">
              {data.nextRun.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              In {getTimeUntilNext()}
            </div>
          </div>
        )}

        {/* Run Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted rounded p-2 text-center">
            <div className="text-lg font-bold text-foreground">{data?.runCount || 0}</div>
            <div className="text-xs text-muted-foreground">Runs</div>
          </div>
          
          <div className="bg-muted rounded p-2 text-center">
            <div className="text-lg font-bold text-foreground">
              {data?.maxRuns ? data.maxRuns : '∞'}
            </div>
            <div className="text-xs text-muted-foreground">Max Runs</div>
          </div>
        </div>

        {/* Last Run */}
        {data?.lastRun && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Last Run:</div>
            <div className="text-xs text-muted-foreground">
              {data.lastRun.toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8"
            size="sm"
            disabled={data?.status === 'running'}
            variant={data?.isActive ? 'default' : 'outline'}
          >
            {data?.status === 'running' ? (
              <Pause className="h-3 w-3 mr-2" />
            ) : data?.isActive ? (
              <Pause className="h-3 w-3 mr-2" />
            ) : (
              <Play className="h-3 w-3 mr-2" />
            )}
            {data?.status === 'running' ? 'Running...' : 
             data?.isActive ? 'Pause' : 'Start'}
          </Button>

          <Button
            variant="outline"
            className="h-8"
            size="sm"
            disabled={data?.status === 'running'}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
};

SchedulerNode.displayName = 'SchedulerNode';
