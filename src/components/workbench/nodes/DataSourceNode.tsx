import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Settings, HardDrive, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataSourceNodeData } from '@/types/workbench';

export const DataSourceNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as DataSourceNodeData;
  
  return (
    <Card className="min-w-[200px] bg-card border-node-data/30 shadow-node hover:shadow-glow transition-all duration-300 group">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-node-data/20 to-node-data/10 border border-node-data/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <HardDrive className="w-6 h-6 text-node-data" />
            <div className="absolute -top-1 -right-1">
              <Activity className="w-3 h-3 text-node-data animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{nodeData?.label || 'Data Source'}</h3>
              <Badge variant="secondary" className="text-xs bg-node-data/10 text-node-data border-node-data/20">
                DB
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{nodeData?.description || 'Database Connection'}</p>
            <div className="flex items-center gap-2 mt-2">
              <Database className="w-3 h-3 text-node-data" />
              <span className="text-xs text-muted-foreground">Synced</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-node-data/10">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-node-data border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-node-data border-2 border-background"
      />
    </Card>
  );
});

DataSourceNode.displayName = 'DataSourceNode';