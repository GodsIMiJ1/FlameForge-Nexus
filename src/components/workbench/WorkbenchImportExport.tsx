import { useState } from 'react';
import { Download, Upload, FileJson, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface WorkflowExportData {
  version: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
    nodeCount: number;
    edgeCount: number;
  };
}

interface WorkbenchImportExportProps {
  nodes: any[];
  edges: any[];
  onImport: (data: { nodes: any[]; edges: any[] }) => void;
}

export const WorkbenchImportExport = ({ nodes, edges, onImport }: WorkbenchImportExportProps) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateExportData = (): WorkflowExportData => {
    return {
      version: '0.2.0',
      name: 'FlameForge Workflow',
      description: 'Exported workflow from FlameForge Workbench',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'FlameForge User',
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  };

  const handleExport = () => {
    const data = generateExportData();
    const json = JSON.stringify(data, null, 2);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flameforge-workflow-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workflow Exported",
      description: "Workflow has been exported successfully",
    });
    
    setIsExportOpen(false);
  };

  const handleCopyJson = async () => {
    const data = generateExportData();
    const json = JSON.stringify(data, null, 2);
    
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "JSON Copied",
        description: "Workflow JSON copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      
      // Validate structure
      if (!data.nodes || !data.edges || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error('Invalid workflow format');
      }
      
      onImport({
        nodes: data.nodes,
        edges: data.edges
      });
      
      toast({
        title: "Workflow Imported",
        description: `Imported ${data.nodes.length} nodes and ${data.edges.length} edges`,
      });
      
      setImportText('');
      setIsImportOpen(false);
    } catch (err) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format or structure",
        variant: "destructive"
      });
    }
  };

  const exportData = generateExportData();

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Workflow
            </DialogTitle>
            <DialogDescription>
              Paste your workflow JSON below to import nodes and edges
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                This will replace your current workflow
              </span>
            </div>
            
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste workflow JSON here..."
              className="min-h-[200px] font-mono text-xs"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Supports FlameForge v0.2+ format
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importText.trim()}>
                  Import Workflow
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Workflow
            </DialogTitle>
            <DialogDescription>
              Export your current workflow as JSON for backup or sharing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    Nodes
                  </Badge>
                  <span className="font-medium">{exportData.metadata.nodeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Workflow components</p>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    Edges
                  </Badge>
                  <span className="font-medium">{exportData.metadata.edgeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg border">
              <h4 className="font-medium mb-2 text-sm">Preview</h4>
              <pre className="text-xs text-muted-foreground overflow-hidden">
                {JSON.stringify(exportData, null, 2).substring(0, 200)}...
              </pre>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  FlameForge v{exportData.version}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCopyJson}>
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
                <Button onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};