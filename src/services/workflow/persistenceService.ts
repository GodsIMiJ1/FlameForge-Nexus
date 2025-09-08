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
