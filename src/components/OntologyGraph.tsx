import { useCallback, useEffect, useState } from 'react';
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
  Panel,
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
  const [isInitialized, setIsInitialized] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Debug logging
  useEffect(() => {
    console.log('Store nodes changed:', storeNodes.length, storeNodes);
    console.log('Store edges changed:', storeEdges.length, storeEdges);
  }, [storeNodes, storeEdges]);

  // Convert store nodes to React Flow nodes
  useEffect(() => {
    if (storeNodes.length === 0) {
      setNodes([]);
      setIsInitialized(false);
      return;
    }

    const flowNodes: Node[] = storeNodes.map(node => ({
      id: node.id,
      type: 'promptNode',
      position: node.position,
      data: node,
      draggable: true,
      selectable: true,
    }));

    console.log('Setting React Flow nodes:', flowNodes.length, flowNodes);
    setNodes(flowNodes);
    setIsInitialized(true);
  }, [storeNodes, setNodes]);

  // Convert store edges to React Flow edges
  useEffect(() => {
    if (storeEdges.length === 0) {
      setEdges([]);
      return;
    }

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

    console.log('Setting React Flow edges:', flowEdges.length, flowEdges);
    setEdges(flowEdges);
  }, [storeEdges, setEdges]);

  // Auto-fit view when nodes are initialized or change
  useEffect(() => {
    if (isInitialized && nodes.length > 0 && reactFlowInstance) {
      console.log('Fitting view to nodes...');
      // Longer delay to ensure DOM is ready
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.3,
          duration: 800,
          maxZoom: 1.5,
          minZoom: 0.5,
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, nodes.length, reactFlowInstance]);

  // Handle node position updates
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      console.log('Node dragged:', node.id, node.position);
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      console.log('New connection:', connection);

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

  console.log('Rendering OntologyGraphInner with nodes:', nodes.length, 'edges:', edges.length);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView={false}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
      >
        <Background
          gap={16}
          size={1}
          color="#e5e7eb"
          style={{ backgroundColor: '#fafafa' }}
        />
        <Controls
          showInteractive={false}
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
          zoomable
          pannable
        />

        {/* Legend as Panel */}
        <Panel position="bottom-left" style={{ marginBottom: 60 }}>
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs border border-gray-200">
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
        </Panel>

        {/* Node count panel */}
        <Panel position="top-right">
          <div className="bg-white rounded shadow px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {nodes.length} {nodes.length === 1 ? 'Node' : 'Nodes'} • {edges.length} {edges.length === 1 ? 'Edge' : 'Edges'}
          </div>
        </Panel>
      </ReactFlow>

      {/* Conflict Panel - outside ReactFlow */}
      {conflicts.length > 0 && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <ConflictPanel />
        </div>
      )}
    </div>
  );
};

// Export wrapped in ReactFlowProvider
export const OntologyGraph: React.FC = () => {
  console.log('Rendering OntologyGraph wrapper');

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <OntologyGraphInner />
      </ReactFlowProvider>
    </div>
  );
};
