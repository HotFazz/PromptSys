import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  MarkerType,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOntologyStore } from '../stores/ontologyStore';
import { PromptNode } from './PromptNode';
import { ConnectionType, PromptEdge as PromptEdgeType } from '../types';
import { ConflictPanel } from './ConflictPanel';

const nodeTypes: NodeTypes = {
  promptNode: PromptNode as any,
};

const edgeColors: Record<ConnectionType, string> = {
  [ConnectionType.DEPENDS_ON]: '#3b82f6',
  [ConnectionType.EXTENDS]: '#10b981',
  [ConnectionType.CONFLICTS_WITH]: '#ef4444',
  [ConnectionType.RELATED_TO]: '#6b7280',
  [ConnectionType.PRECEDES]: '#8b5cf6',
  [ConnectionType.VALIDATES]: '#f59e0b',
  [ConnectionType.MODIFIES]: '#ec4899',
};

const OntologyGraphInner: React.FC = () => {
  const { nodes: storeNodes, edges: storeEdges, addEdge: addStoreEdge, updateNode, conflicts } = useOntologyStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Convert store nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = storeNodes.map(node => ({
      id: node.id,
      type: 'promptNode',
      position: node.position,
      data: node,
    }));
    setNodes(flowNodes);
  }, [storeNodes, setNodes]);

  // Convert store edges to React Flow edges
  useEffect(() => {
    const flowEdges: Edge[] = storeEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: edge.label || edge.type.replace(/_/g, ' '),
      animated: edge.type === ConnectionType.DEPENDS_ON || edge.type === ConnectionType.PRECEDES,
      style: {
        stroke: edgeColors[edge.type] || '#6b7280',
        strokeWidth: edge.type === ConnectionType.CONFLICTS_WITH ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors[edge.type] || '#6b7280',
      },
      labelStyle: {
        fontSize: 10,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: '#fff',
        fillOpacity: 0.8,
      },
    }));
    setEdges(flowEdges);
  }, [storeEdges, setEdges]);

  // Auto-fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        fitView({
          padding: 0.2,
          duration: 400,
          maxZoom: 1,
        });
      }, 50);
    }
  }, [nodes.length, fitView]);

  // Handle node position updates
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: PromptEdgeType = {
        id: `edge-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        type: ConnectionType.RELATED_TO,
      };

      addStoreEdge(newEdge);
    },
    [addStoreEdge]
  );

  // Minimap node colors based on category
  const minimapNodeColor = useCallback((node: Node) => {
    const category = node.data?.category;
    const colorMap: Record<string, string> = {
      instruction: '#3b82f6',
      context: '#10b981',
      constraint: '#ef4444',
      example: '#f59e0b',
      role: '#8b5cf6',
      objective: '#6366f1',
      format: '#ec4899',
      persona: '#f97316',
      guardrail: '#dc2626',
      tool: '#06b6d4',
      workflow: '#14b8a6',
    };
    return colorMap[category] || '#6b7280';
  }, []);

  return (
    <div className="w-full h-full absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: '#f9fafb',
          }}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10 pointer-events-auto">
        <h3 className="font-semibold text-sm mb-3">Connection Types</h3>
        <div className="space-y-2">
          {Object.entries(edgeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-6 h-0.5 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Panel */}
      {conflicts.length > 0 && <ConflictPanel />}
    </div>
  );
};

// Export wrapped in ReactFlowProvider
export const OntologyGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <OntologyGraphInner />
    </ReactFlowProvider>
  );
};
