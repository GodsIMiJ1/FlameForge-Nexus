import { Bot, Wrench, Database, GitBranch, Plus, Brain, Zap, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const nodeTypes = [
  {
    type: 'agent',
    label: 'Agent',
    icon: Bot,
    description: 'AI agent for task execution',
    color: 'node-agent',
  },
  {
    type: 'tool',
    label: 'Tool',
    icon: Wrench,
    description: 'External tool or API',
    color: 'node-tool',
  },
  {
    type: 'dataSource',
    label: 'Data Source',
    icon: Database,
    description: 'Database or data store',
    color: 'node-data',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    description: 'Conditional logic node',
    color: 'node-decision',
  },
  {
    type: 'ollama',
    label: 'Ollama',
    icon: Brain,
    description: 'Local AI model execution',
    color: 'purple-500',
  },
  {
    type: 'advancedOllama',
    label: 'Advanced Ollama',
    icon: Zap,
    description: 'Enhanced local AI with monitoring',
    color: 'purple-600',
  },
];

export const WorkbenchSidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-workbench-sidebar border-r border-border shadow-sidebar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img
              src="/eye-of-kai_logo.png"
              alt="GodsIMiJ AI Solutions Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">FlameForge Nexus</h2>
            <p className="text-sm text-muted-foreground">by GodsIMiJ AI Solutions</p>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Components
            </h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const IconComponent = nodeType.icon;
                return (
                  <Card
                    key={nodeType.type}
                    className="p-3 cursor-grab bg-card border-border hover:bg-muted transition-colors"
                    draggable
                    onDragStart={(event) => onDragStart(event, nodeType.type)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${nodeType.color}/20 border border-${nodeType.color}/30`}
                      >
                        <IconComponent className={`w-4 h-4 text-${nodeType.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground">
                          {nodeType.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                Save Workflow
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Load Template
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Export Config
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};