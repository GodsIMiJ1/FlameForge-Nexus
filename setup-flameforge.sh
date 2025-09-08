#!/bin/bash
echo "🔥 Setting up FlameForge Nexus Enterprise Features..."

# Install required dependencies
echo "📦 Installing dependencies..."
npm install --save @tanstack/react-query react-hook-form zod date-fns react-hot-toast

# Create directory structure
echo "📁 Creating directories..."
mkdir -p src/services/workflow
mkdir -p src/hooks/workflow  
mkdir -p src/types/workflow

# Create TypeScript types
echo "⚙️ Creating TypeScript types..."
cat > src/types/workflow/index.ts << 'TSEOF'
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  executionCount: number;
  version: number;
}
TSEOF

# Create persistence service
echo "💾 Creating persistence service..."
cat > src/services/workflow/persistenceService.ts << 'SERVICEEOF'
import { WorkflowNode, WorkflowEdge, SavedWorkflow } from '@/types/workflow';

export class WorkflowPersistenceService {
  async saveWorkflow(workflow: Omit<SavedWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workflowWithId = { ...workflow, id, createdAt: new Date(), updatedAt: new Date() };
    
    localStorage.setItem(`flameforge_workflow_${id}`, JSON.stringify(workflowWithId));
    console.log('✅ Workflow saved:', id);
    
    return id;
  }

  async loadWorkflow(id: string): Promise<SavedWorkflow> {
    const stored = localStorage.getItem(`flameforge_workflow_${id}`);
    if (!stored) {
      throw new Error(`Workflow not found: ${id}`);
    }
    
    const workflow = JSON.parse(stored);
    workflow.createdAt = new Date(workflow.createdAt);
    workflow.updatedAt = new Date(workflow.updatedAt);
    
    return workflow;
  }

  async listUserWorkflows(): Promise<SavedWorkflow[]> {
    const workflows: SavedWorkflow[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('flameforge_workflow_')) {
        try {
          const workflow = JSON.parse(localStorage.getItem(key) || '');
          workflow.createdAt = new Date(workflow.createdAt);
          workflow.updatedAt = new Date(workflow.updatedAt);
          workflows.push(workflow);
        } catch (error) {
          console.warn('Failed to parse workflow:', key);
        }
      }
    }
    
    return workflows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  exportWorkflow(workflow: SavedWorkflow): string {
    return JSON.stringify({
      version: '2.0',
      flameforge: true,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes,
      edges: workflow.edges,
      tags: workflow.tags,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}
SERVICEEOF

# Create React hook
echo "🪝 Creating React hook..."
cat > src/hooks/workflow/useWorkflowPersistence.ts << 'HOOKEOF'
import { useState, useCallback } from 'react';
import { WorkflowPersistenceService } from '@/services/workflow/persistenceService';
import { WorkflowNode, WorkflowEdge, SavedWorkflow } from '@/types/workflow';

export const useWorkflowPersistence = () => {
  const [service] = useState(() => new WorkflowPersistenceService());
  const [isLoading, setIsLoading] = useState(false);

  const saveWorkflow = useCallback(async (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    name: string,
    description?: string,
    tags: string[] = []
  ) => {
    setIsLoading(true);
    try {
      const workflow = {
        name,
        description,
        nodes,
        edges,
        tags,
        isTemplate: false,
        isPublic: false,
        authorId: 'current-user',
        executionCount: 0,
        version: 1,
      };
      
      const id = await service.saveWorkflow(workflow);
      return id;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const loadWorkflow = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      return await service.loadWorkflow(id);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const listWorkflows = useCallback(async () => {
    return await service.listUserWorkflows();
  }, [service]);

  return {
    saveWorkflow,
    loadWorkflow,
    listWorkflows,
    isLoading,
  };
};
HOOKEOF

# Add dev script
npm pkg set scripts.dev:workflow="npm run dev -- --port 8081"

# Create start script
cat > start-dev.sh << 'STARTEOF'
#!/bin/bash
echo "🔥 Starting FlameForge Nexus..."
echo "🌐 Opening http://localhost:8081"
npm run dev:workflow
STARTEOF

chmod +x start-dev.sh

echo ""
echo "🎉 FlameForge Nexus Enterprise setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./start-dev.sh"
echo "2. Open: http://localhost:8081"
echo "3. Start building workflows!"
echo ""
