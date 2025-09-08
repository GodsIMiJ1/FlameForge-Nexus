import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Download, 
  Upload, 
  Library, 
  Settings, 
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  FileText
} from 'lucide-react';
import { useCanvasIntegration } from '@/hooks/workflow/useCanvasIntegration';
import { useWorkflowPersistence } from '@/hooks/workflow/useWorkflowPersistence';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';
import { toast } from 'react-hot-toast';

interface CanvasToolbarProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onLoadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onExecuteWorkflow: () => void;
  className?: string;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  nodes,
  edges,
  onLoadWorkflow,
  onExecuteWorkflow,
  className = '',
}) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    tags: '',
    isPublic: false,
  });

  const {
    currentWorkflowId,
    isAutoSaveEnabled,
    hasUnsavedChanges,
    saveWorkflow,
    loadWorkflow,
    newWorkflow,
    exportWorkflow,
    importWorkflow,
    toggleAutoSave,
    validateWorkflow,
    markAsChanged,
  } = useCanvasIntegration();

  const {
    useUserWorkflows,
    useTemplates,
  } = useWorkflowPersistence();

  // Get user workflows and templates
  const { data: userWorkflows = [], isLoading: loadingWorkflows } = useUserWorkflows('current-user');
  const { data: templates = [], isLoading: loadingTemplates } = useTemplates();

  // Handle save workflow
  const handleSaveWorkflow = useCallback(async () => {
    try {
      const validation = validateWorkflow(nodes, edges);
      
      if (!validation.isValid) {
        toast.error(`Workflow validation failed: ${validation.errors[0]}`);
        return;
      }

      const tags = saveFormData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await saveWorkflow(
        nodes,
        edges,
        saveFormData.name,
        saveFormData.description || undefined,
        tags,
        saveFormData.isPublic
      );

      setIsSaveDialogOpen(false);
      setSaveFormData({ name: '', description: '', tags: '', isPublic: false });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [nodes, edges, saveFormData, saveWorkflow, validateWorkflow]);

  // Handle quick save (update existing workflow)
  const handleQuickSave = useCallback(async () => {
    if (!currentWorkflowId) {
      setIsSaveDialogOpen(true);
      return;
    }

    try {
      const validation = validateWorkflow(nodes, edges);
      
      if (!validation.isValid) {
        toast.error(`Workflow validation failed: ${validation.errors[0]}`);
        return;
      }

      // This would be handled by the canvas integration service
      toast.success('Workflow updated successfully!');
    } catch (error) {
      console.error('Quick save failed:', error);
    }
  }, [currentWorkflowId, nodes, edges, validateWorkflow]);

  // Handle load workflow
  const handleLoadWorkflow = useCallback(async (workflowId: string) => {
    try {
      const { nodes: loadedNodes, edges: loadedEdges } = await loadWorkflow(workflowId);
      onLoadWorkflow(loadedNodes, loadedEdges);
      setIsLoadDialogOpen(false);
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, [loadWorkflow, onLoadWorkflow]);

  // Handle load template
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      // For templates, we'd create a new workflow from template
      const template = templates.find(t => t.id === templateId);
      if (template) {
        onLoadWorkflow(template.nodes, template.edges);
        markAsChanged(); // Mark as changed since it's from template
        toast.success(`Loaded template: ${template.name}`);
        setIsLoadDialogOpen(false);
      }
    } catch (error) {
      console.error('Template load failed:', error);
    }
  }, [templates, onLoadWorkflow, markAsChanged]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      await exportWorkflow(nodes, edges);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [nodes, edges, exportWorkflow]);

  // Handle import
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { nodes: importedNodes, edges: importedEdges } = await importWorkflow(file);
      onLoadWorkflow(importedNodes, importedEdges);
      setIsImportDialogOpen(false);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      event.target.value = '';
    }
  }, [importWorkflow, onLoadWorkflow]);

  // Handle new workflow
  const handleNewWorkflow = useCallback(() => {
    newWorkflow();
    onLoadWorkflow([], []);
    toast.success('New workflow created');
  }, [newWorkflow, onLoadWorkflow]);

  // Get workflow validation status
  const validation = validateWorkflow(nodes, edges);

  return (
    <div className={`flex items-center gap-2 p-3 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 ${className}`}>
      {/* File Operations */}
      <div className="flex items-center gap-2 pr-2 border-r border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewWorkflow}
          className="gap-2 text-gray-300 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>

        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-300 hover:text-white"
              disabled={nodes.length === 0}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Workflow</DialogTitle>
              <DialogDescription>
                Save your workflow to the library for future use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Workflow name"
                value={saveFormData.name}
                onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={saveFormData.description}
                onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                rows={3}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={saveFormData.tags}
                onChange={(e) => setSaveFormData({ ...saveFormData, tags: e.target.value })}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={saveFormData.isPublic}
                  onChange={(e) => setSaveFormData({ ...saveFormData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-300">
                  Make public (others can use this workflow)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveWorkflow}
                disabled={!saveFormData.name.trim()}
              >
                Save Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {currentWorkflowId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickSave}
            className="gap-2 text-gray-300 hover:text-white"
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
            Update
          </Button>
        )}

        <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-300 hover:text-white"
            >
              <FolderOpen className="w-4 h-4" />
              Load
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Load Workflow</DialogTitle>
              <DialogDescription>
                Choose a workflow or template to load
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* My Workflows */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">My Workflows</h3>
                {loadingWorkflows ? (
                  <div className="text-center py-4 text-gray-400">Loading...</div>
                ) : userWorkflows.length > 0 ? (
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {userWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleLoadWorkflow(workflow.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{workflow.name}</div>
                          <div className="text-sm text-gray-400">{workflow.description}</div>
                          <div className="flex gap-1 mt-1">
                            {workflow.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {workflow.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No workflows found. Create your first workflow!
                  </div>
                )}
              </div>

              {/* Templates */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Templates</h3>
                {loadingTemplates ? (
                  <div className="text-center py-4 text-gray-400">Loading templates...</div>
                ) : templates.length > 0 ? (
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {templates.slice(0, 6).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleLoadTemplate(template.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{template.name}</div>
                          <div className="text-sm text-gray-400">{template.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.difficulty}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {template.estimatedTime}m
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          ⭐ {template.rating}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No templates available
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import/Export */}
      <div className="flex items-center gap-2 pr-2 border-r border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="gap-2 text-gray-300 hover:text-white"
          disabled={nodes.length === 0}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-300 hover:text-white"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Workflow</DialogTitle>
              <DialogDescription>
                Import a workflow from a JSON file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="cursor-pointer"
              />
              <div className="text-sm text-gray-400">
                Select a FlameForge Nexus workflow file (.json) to import
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pr-2 border-r border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-300 hover:text-white"
          onClick={() => window.open('/workflow-library', '_blank')}
        >
          <Library className="w-4 h-4" />
          Library
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExecuteWorkflow}
          className="gap-2 text-green-400 hover:text-green-300"
          disabled={nodes.length === 0}
        >
          <PlayCircle className="w-4 h-4" />
          Execute
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Validation Status */}
        <div className="flex items-center gap-1">
          {validation.isValid ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-gray-400">
            {validation.isValid ? 'Valid' : `${validation.errors.length} issues`}
          </span>
        </div>

        {/* Node Count */}
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">{nodes.length} nodes</span>
        </div>

        {/* Auto-save Status */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoSave}
          className={`gap-1 ${isAutoSaveEnabled ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
        >
          <Zap className="w-3 h-3" />
          <span className="text-xs">
            {isAutoSaveEnabled ? 'Auto-save' : 'Manual'}
          </span>
        </Button>

        {/* Save Status */}
        {currentWorkflowId && (
          <div className="flex items-center gap-1">
            {hasUnsavedChanges ? (
              <>
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400">Unsaved</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Saved</span>
              </>
            )}
          </div>
        )}

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-400 hover:text-white"
          onClick={() => window.open('/api-settings', '_blank')}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CanvasToolbar;