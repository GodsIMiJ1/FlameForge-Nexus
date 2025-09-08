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
