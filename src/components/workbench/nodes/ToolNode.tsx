import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Wrench, Settings, Link, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToolNodeData } from '@/types/workbench';

export const ToolNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as ToolNodeData;
  
  return (
    <Card className="min-w-[200px] bg-card border-node-tool/30 shadow-node hover:shadow-glow transition-all duration-300 group">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-node-tool/20 to-node-tool/10 border border-node-tool/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wrench className="w-6 h-6 text-node-tool" />
            <div className="absolute -top-1 -right-1">
              <CheckCircle className="w-3 h-3 text-node-tool" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{nodeData?.label || 'Tool'}</h3>
              <Badge variant="secondary" className="text-xs bg-node-tool/10 text-node-tool border-node-tool/20">
                API
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{nodeData?.description || 'External Integration'}</p>
            <div className="flex items-center gap-2 mt-2">
              <Link className="w-3 h-3 text-node-tool" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-node-tool/10">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-node-tool border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-node-tool border-2 border-background"
      />
    </Card>
  );
});

ToolNode.displayName = 'ToolNode';