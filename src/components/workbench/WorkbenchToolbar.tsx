import { Play, Square, RotateCcw, Save, Upload, Download, Shield, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WorkbenchImportExport } from './WorkbenchImportExport';

interface WorkbenchToolbarProps {
  nodes?: any[];
  edges?: any[];
  onImport?: (data: { nodes: any[]; edges: any[] }) => void;
}

export const WorkbenchToolbar = ({ nodes = [], edges = [], onImport }: WorkbenchToolbarProps) => {
  return (
    <div className="h-16 bg-workbench-toolbar border-b border-border px-6 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" className="bg-gradient-primary">
          <Play className="w-4 h-4 mr-2" />
          Run Workflow
        </Button>
        <Button variant="outline" size="sm">
          <Square className="w-4 h-4 mr-2" />
          Stop
        </Button>
        <Button variant="ghost" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <WorkbenchImportExport 
          nodes={nodes} 
          edges={edges} 
          onImport={onImport || (() => {})} 
        />
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Policies
        </Button>
        <Button variant="ghost" size="sm">
          <Layers className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Status: <span className="text-primary">Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Connected</span>
        </div>
      </div>
    </div>
  );
};