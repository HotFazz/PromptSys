import { create } from 'zustand';
import { PromptNode, PromptEdge, Conflict, OntologyAnalysis } from '../types';

interface OntologyStore {
  nodes: PromptNode[];
  edges: PromptEdge[];
  conflicts: Conflict[];
  selectedNodeId: string | null;
  isSidePanelOpen: boolean;
  isAnalyzing: boolean;

  // Actions
  addNode: (node: PromptNode) => void;
  updateNode: (id: string, updates: Partial<PromptNode>) => void;
  deleteNode: (id: string) => void;

  addEdge: (edge: PromptEdge) => void;
  updateEdge: (id: string, updates: Partial<PromptEdge>) => void;
  deleteEdge: (id: string) => void;

  setConflicts: (conflicts: Conflict[]) => void;
  clearConflict: (id: string) => void;

  setSelectedNode: (id: string | null) => void;
  toggleSidePanel: () => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;

  loadOntology: (analysis: OntologyAnalysis) => void;
  clearOntology: () => void;

  // Getters
  getNodeById: (id: string) => PromptNode | undefined;
  getConnectedNodes: (nodeId: string) => PromptNode[];
  getNodeConflicts: (nodeId: string) => Conflict[];
}

export const useOntologyStore = create<OntologyStore>((set, get) => ({
  nodes: [],
  edges: [],
  conflicts: [],
  selectedNodeId: null,
  isSidePanelOpen: true,
  isAnalyzing: false,

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === id ? { ...node, ...updates, metadata: { ...node.metadata, updatedAt: new Date() } } : node
    )
  })),

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    edges: state.edges.filter(edge => edge.source !== id && edge.target !== id),
    conflicts: state.conflicts.filter(conflict => !conflict.nodeIds.includes(id))
  })),

  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),

  updateEdge: (id, updates) => set((state) => ({
    edges: state.edges.map(edge =>
      edge.id === id ? { ...edge, ...updates } : edge
    )
  })),

  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== id),
    conflicts: state.conflicts.filter(conflict => !conflict.edgeIds?.includes(id))
  })),

  setConflicts: (conflicts) => set({ conflicts }),

  clearConflict: (id) => set((state) => ({
    conflicts: state.conflicts.filter(c => c.id !== id)
  })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  toggleSidePanel: () => set((state) => ({
    isSidePanelOpen: !state.isSidePanelOpen
  })),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  loadOntology: (analysis) => set({
    nodes: analysis.nodes,
    edges: analysis.edges,
    conflicts: analysis.conflicts
  }),

  clearOntology: () => set({
    nodes: [],
    edges: [],
    conflicts: [],
    selectedNodeId: null
  }),

  getNodeById: (id) => {
    return get().nodes.find(node => node.id === id);
  },

  getConnectedNodes: (nodeId) => {
    const { nodes, edges } = get();
    const connectedIds = new Set<string>();

    edges.forEach(edge => {
      if (edge.source === nodeId) connectedIds.add(edge.target);
      if (edge.target === nodeId) connectedIds.add(edge.source);
    });

    return nodes.filter(node => connectedIds.has(node.id));
  },

  getNodeConflicts: (nodeId) => {
    return get().conflicts.filter(conflict => conflict.nodeIds.includes(nodeId));
  }
}));
