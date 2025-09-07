import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DecisionNodeData } from '@/types/workbench';

export const DecisionNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as DecisionNodeData;
  
  return (
    <Card className="min-w-[180px] bg-card border-node-decision/30 shadow-node">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-node-decision/20 border border-node-decision/30 rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-node-decision" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{nodeData?.label || 'Decision'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{nodeData?.description || 'Logic Gate'}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-node-decision rounded-full"></div>
          <span>Logic Gate</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-node-decision border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 bg-node-decision border-2 border-background"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-node-decision border-2 border-background"
        style={{ left: '70%' }}
      />
    </Card>
  );
});

DecisionNode.displayName = 'DecisionNode';