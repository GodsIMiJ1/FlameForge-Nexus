import { useCallback, useRef, DragEvent, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AgentNode } from './nodes/AgentNode';
import { ToolNode } from './nodes/ToolNode';
import { DataSourceNode } from './nodes/DataSourceNode';
import { DecisionNode } from './nodes/DecisionNode';
import { OllamaNode } from './nodes/OllamaNode';
import { AdvancedOllamaNode } from './nodes/AdvancedOllamaNode';
import { OllamaEdge } from './edges/OllamaEdge';

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  dataSource: DataSourceNode,
  decision: DecisionNode,
  advancedOllama: AdvancedOllamaNode,
  ollama: OllamaNode,
};

const edgeTypes = {
  ollama: OllamaEdge,
};

const initialNodes: Node[] = [
  {
    id: 'demo-agent',
    type: 'agent',
    position: { x: 300, y: 100 },
    data: { 
      label: 'Support Agent',
      description: 'Handles customer support queries'
    },
  },
  {
    id: 'demo-tool',
    type: 'tool',
    position: { x: 100, y: 250 },
    data: { 
      label: 'FAQ Search',
      description: 'Searches knowledge base'
    },
  },
  {
    id: 'demo-data',
    type: 'dataSource',
    position: { x: 500, y: 250 },
    data: {
      label: 'Postgres DB',
      description: 'Customer data storage'
    },
  },
  {
    id: 'demo-ollama',
    type: 'ollama',
    position: { x: 700, y: 100 },
    data: {
      label: 'Local AI Model',
      description: 'Ollama-powered local AI processing',
      type: 'ollama',
      config: {
        endpoint: 'http://localhost:11434',
        model: '',
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        topK: 40,
        stream: false
      },
      inputs: {
        prompt: 'Hello, how can you help me today?',
        context: {}
      },
      outputs: {
        response: '',
        metadata: {
          model: '',
          tokens: 0,
          duration: 0
        }
      }
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'demo-agent',
    target: 'demo-tool',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e1-3',
    source: 'demo-agent',
    target: 'demo-data',
    type: 'smoothstep',
  },
  {
    id: 'e1-4',
    source: 'demo-agent',
    target: 'demo-ollama',
    type: 'ollama',
    animated: true,
    data: {
      label: 'AI Processing',
      isActive: true
    }
  },
];

const WorkbenchCanvasInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Handle keyboard shortcuts for node deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes when Delete or Backspace is pressed
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();

          // Remove selected nodes
          if (selectedNodes.length > 0) {
            const selectedNodeIds = selectedNodes.map(node => node.id);
            setNodes(nodes => nodes.filter(node => !selectedNodeIds.includes(node.id)));

            // Also remove edges connected to deleted nodes
            setEdges(edges => edges.filter(edge =>
              !selectedNodeIds.includes(edge.source) &&
              !selectedNodeIds.includes(edge.target)
            ));
          }

          // Remove selected edges
          if (selectedEdges.length > 0) {
            const selectedEdgeIds = selectedEdges.map(edge => edge.id);
            setEdges(edges => edges.filter(edge => !selectedEdgeIds.includes(edge.id)));
          }
        }
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, edges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'ollama':
        return {
          label: 'Ollama Node',
          description: 'Local AI model execution',
          type: 'ollama',
          config: {
            endpoint: 'http://localhost:11434',
            model: '',
            systemPrompt: 'You are a helpful AI assistant.',
            temperature: 0.7,
            maxTokens: 2048,
            topP: 0.9,
            topK: 40,
            stream: false
          },
          inputs: {
            prompt: '',
            context: {}
          },
          outputs: {
            response: '',
            metadata: {
              model: '',
              tokens: 0,
              duration: 0
            }
          }
        };
      case 'agent':
        return {
          label: 'Agent Node',
          description: 'AI agent for task execution'
        };
      case 'tool':
        return {
          label: 'Tool Node',
          description: 'External tool or API'
        };
      case 'dataSource':
        return {
          label: 'Data Source',
          description: 'Database or data store'
        };
      case 'decision':
        return {
          label: 'Decision Node',
          description: 'Conditional logic node'
        };
      default:
        return {
          label: 'Unknown Node',
          description: 'Unknown node type'
        };
    }
  };

  return (
    <div className="flex-1 bg-workbench-canvas relative" ref={reactFlowWrapper}>
      {/* Subtle watermark */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-5"
        style={{
          backgroundImage: 'url(/NODE_watermark.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '200px 200px'
        }}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="workbench-flow relative z-10"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        selectionKeyCode={null}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="bg-workbench-canvas"
          color="#374151"
        />
        <Controls
          className="workbench-controls"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap
          className="workbench-minimap"
          maskColor="hsl(215 25% 8% / 0.8)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'ollama': return '#8b5cf6';
              case 'agent': return '#3b82f6';
              case 'tool': return '#10b981';
              case 'dataSource': return '#f59e0b';
              case 'decision': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};

export const WorkbenchCanvas = () => {
  return (
    <ReactFlowProvider>
      <WorkbenchCanvasInner />
    </ReactFlowProvider>
  );
};