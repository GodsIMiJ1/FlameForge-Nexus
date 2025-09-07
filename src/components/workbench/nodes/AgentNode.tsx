import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Settings, Zap, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentNodeData } from '@/types/workbench';

export const AgentNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as AgentNodeData;
  
  return (
    <Card className="min-w-[220px] bg-card border-node-agent/30 shadow-node hover:shadow-glow transition-all duration-300 group">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-12 h-12 bg-gradient-to-br from-node-agent/20 to-node-agent/10 border border-node-agent/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Brain className="w-6 h-6 text-node-agent" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-node-agent rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{nodeData?.label || 'Agent'}</h3>
              <Badge variant="secondary" className="text-xs bg-node-agent/10 text-node-agent border-node-agent/20">
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{nodeData?.description || 'Autonomous AI Agent'}</p>
            <div className="flex items-center gap-2 mt-2">
              <Zap className="w-3 h-3 text-node-agent" />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-node-agent/10">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-node-agent border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-node-agent border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-node-agent border-2 border-background"
      />
    </Card>
  );
});

AgentNode.displayName = 'AgentNode';