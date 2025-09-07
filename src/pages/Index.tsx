import { useState } from 'react';
import { Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkbenchSidebar } from '@/components/workbench/WorkbenchSidebar';
import { WorkbenchCanvas } from '@/components/workbench/WorkbenchCanvas';
import { WorkbenchToolbar } from '@/components/workbench/WorkbenchToolbar';
import { WorkbenchExecutionPanel } from '@/components/workbench/WorkbenchExecutionPanel';
import { AiChatToggle } from '@/components/chat/AiChatToggle';

const Index = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(true);

  const handleImport = (data: { nodes: any[]; edges: any[] }) => {
    setNodes(data.nodes);
    setEdges(data.edges);
  };

  // Prepare workflow context for AI assistant
  const workflowContext = {
    nodes,
    edges,
    workflows: [] // This could be loaded from the database if needed
  };

  return (
    <div className="min-h-screen bg-background dark">
      <WorkbenchToolbar nodes={nodes} edges={edges} onImport={handleImport} />
      <div className="flex h-[calc(100vh-4rem)]">
        <WorkbenchSidebar />
        <div className="flex-1 flex">
          <WorkbenchCanvas />
          {showExecutionPanel && <WorkbenchExecutionPanel />}
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <Button
          onClick={() => window.open('/model-management', '_blank')}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border shadow-lg"
        >
          <Key className="w-4 h-4 mr-2" />
          Model Management
        </Button>
        <Button
          onClick={() => window.open('/api-settings', '_blank')}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border shadow-lg"
        >
          <Key className="w-4 h-4 mr-2" />
          API Settings
        </Button>
      </div>

      {/* AI Chat Assistant */}
      <AiChatToggle workflowContext={workflowContext} />
    </div>
  );
};

export default Index;
