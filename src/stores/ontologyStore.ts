import { create } from 'zustand';
import {
  PromptNode,
  PromptEdge,
  Conflict,
  OntologyAnalysis,
  PromptAltitude,
  PromptScope
} from '../types';
import {
  ContextWindow,
  ContextAllocation,
  HierarchyMetrics
} from '../types/hierarchy';

interface OntologyStore {
  nodes: PromptNode[];
  edges: PromptEdge[];
  conflicts: Conflict[];
  selectedNodeId: string | null;
  isSidePanelOpen: boolean;
  isAnalyzing: boolean;

  // Hierarchy state
  contextWindow: ContextWindow | null;
  hierarchyMetrics: HierarchyMetrics | null;

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

  // Hierarchy navigation
  getChildren: (nodeId: string) => PromptNode[];
  getParent: (nodeId: string) => PromptNode | undefined;
  getSiblings: (nodeId: string) => PromptNode[];
  getAncestors: (nodeId: string) => PromptNode[];
  getDescendants: (nodeId: string) => PromptNode[];
  getRoot: (nodeId: string) => PromptNode | undefined;
  getRoots: () => PromptNode[];
  getNodeDepth: (nodeId: string) => number;

  // Hierarchy manipulation
  addChild: (parentId: string, childNode: PromptNode) => void;
  removeChild: (parentId: string, childId: string) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  setNodeAltitude: (nodeId: string, altitude: PromptAltitude) => void;
  setNodeScope: (nodeId: string, scope: PromptScope) => void;

  // Context management
  updateContextWindow: (contextWindow: ContextWindow) => void;
  updateContextAllocations: (allocations: ContextAllocation[]) => void;

  // Hierarchy metrics
  updateHierarchyMetrics: (metrics: HierarchyMetrics) => void;
}

export const useOntologyStore = create<OntologyStore>((set, get) => ({
  nodes: [],
  edges: [],
  conflicts: [],
  selectedNodeId: null,
  isSidePanelOpen: true,
  isAnalyzing: false,
  contextWindow: null,
  hierarchyMetrics: null,

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
  },

  // Hierarchy navigation methods
  getChildren: (nodeId) => {
    const node = get().getNodeById(nodeId);
    if (!node || !node.childIds || node.childIds.length === 0) return [];

    return node.childIds
      .map(childId => get().getNodeById(childId))
      .filter((child): child is PromptNode => child !== undefined);
  },

  getParent: (nodeId) => {
    const node = get().getNodeById(nodeId);
    if (!node || !node.parentId) return undefined;

    return get().getNodeById(node.parentId);
  },

  getSiblings: (nodeId) => {
    const node = get().getNodeById(nodeId);
    if (!node || !node.parentId) return [];

    const parent = get().getNodeById(node.parentId);
    if (!parent || !parent.childIds) return [];

    return parent.childIds
      .filter(childId => childId !== nodeId)
      .map(childId => get().getNodeById(childId))
      .filter((sibling): sibling is PromptNode => sibling !== undefined);
  },

  getAncestors: (nodeId) => {
    const ancestors: PromptNode[] = [];
    let currentNode = get().getNodeById(nodeId);

    while (currentNode && currentNode.parentId) {
      const parent = get().getNodeById(currentNode.parentId);
      if (!parent) break;
      ancestors.push(parent);
      currentNode = parent;
    }

    return ancestors;
  },

  getDescendants: (nodeId) => {
    const descendants: PromptNode[] = [];
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = get().getChildren(currentId);

      descendants.push(...children);
      queue.push(...children.map(child => child.id));
    }

    return descendants;
  },

  getRoot: (nodeId) => {
    const ancestors = get().getAncestors(nodeId);
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : get().getNodeById(nodeId);
  },

  getRoots: () => {
    return get().nodes.filter(node => !node.parentId);
  },

  getNodeDepth: (nodeId) => {
    const node = get().getNodeById(nodeId);
    if (!node) return -1;
    if (node.depth !== undefined) return node.depth;

    // Calculate depth from ancestors
    return get().getAncestors(nodeId).length;
  },

  // Hierarchy manipulation methods
  addChild: (parentId, childNode) => {
    const parent = get().getNodeById(parentId);
    if (!parent) return;

    // Update child node with parent reference
    const updatedChild = {
      ...childNode,
      parentId,
      depth: (parent.depth || 0) + 1
    };

    // Update parent's childIds
    set((state) => ({
      nodes: [
        ...state.nodes.map(node =>
          node.id === parentId
            ? { ...node, childIds: [...(node.childIds || []), childNode.id] }
            : node
        ),
        updatedChild
      ]
    }));
  },

  removeChild: (parentId, childId) => {
    set((state) => ({
      nodes: state.nodes.map(node => {
        if (node.id === parentId && node.childIds) {
          return {
            ...node,
            childIds: node.childIds.filter(id => id !== childId)
          };
        }
        if (node.id === childId) {
          return {
            ...node,
            parentId: undefined
          };
        }
        return node;
      })
    }));
  },

  moveNode: (nodeId, newParentId) => {
    const node = get().getNodeById(nodeId);
    if (!node) return;

    // Remove from old parent
    if (node.parentId) {
      get().removeChild(node.parentId, nodeId);
    }

    if (newParentId === null) {
      // Move to root level
      set((state) => ({
        nodes: state.nodes.map(n =>
          n.id === nodeId
            ? { ...n, parentId: undefined, depth: 0 }
            : n
        )
      }));
    } else {
      // Add to new parent
      const newParent = get().getNodeById(newParentId);
      if (!newParent) return;

      const newDepth = (newParent.depth || 0) + 1;

      set((state) => ({
        nodes: state.nodes.map(n => {
          if (n.id === nodeId) {
            return { ...n, parentId: newParentId, depth: newDepth };
          }
          if (n.id === newParentId) {
            return { ...n, childIds: [...(n.childIds || []), nodeId] };
          }
          return n;
        })
      }));

      // Recursively update depths of all descendants
      const updateDescendantDepths = (id: string, baseDepth: number) => {
        const children = get().getChildren(id);
        children.forEach(child => {
          get().updateNode(child.id, { depth: baseDepth + 1 });
          updateDescendantDepths(child.id, baseDepth + 1);
        });
      };
      updateDescendantDepths(nodeId, newDepth);
    }
  },

  setNodeAltitude: (nodeId, altitude) => {
    get().updateNode(nodeId, { altitude });
  },

  setNodeScope: (nodeId, scope) => {
    get().updateNode(nodeId, { scope });
  },

  // Context management methods
  updateContextWindow: (contextWindow) => {
    set({ contextWindow });
  },

  updateContextAllocations: (allocations) => {
    set((state) => {
      if (!state.contextWindow) return state;

      return {
        contextWindow: {
          ...state.contextWindow,
          allocations
        }
      };
    });
  },

  // Hierarchy metrics methods
  updateHierarchyMetrics: (metrics) => {
    set({ hierarchyMetrics: metrics });
  }
}));
