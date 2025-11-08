import { PromptNode, PromptEdge, Conflict, ConflictType, ConnectionType } from '../types';

export class ConflictDetector {
  /**
   * Detect all conflicts in the ontology
   */
  static detectConflicts(nodes: PromptNode[], edges: PromptEdge[]): Conflict[] {
    const conflicts: Conflict[] = [];

    conflicts.push(...this.detectCircularDependencies(nodes, edges));
    conflicts.push(...this.detectContradictions(nodes, edges));
    conflicts.push(...this.detectOrphanedNodes(nodes, edges));
    conflicts.push(...this.detectDuplicates(nodes));
    conflicts.push(...this.detectAmbiguousRelationships(nodes, edges));

    return conflicts;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private static detectCircularDependencies(nodes: PromptNode[], edges: PromptEdge[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathMap = new Map<string, string[]>();

    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      pathMap.set(nodeId, [...path, nodeId]);

      const outgoingEdges = edges.filter(e =>
        e.source === nodeId &&
        (e.type === ConnectionType.DEPENDS_ON || e.type === ConnectionType.PRECEDES)
      );

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target, pathMap.get(nodeId) || [])) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          // Found a cycle
          const cyclePath = pathMap.get(nodeId) || [];
          const cycleStart = cyclePath.indexOf(edge.target);
          const cycleNodes = cyclePath.slice(cycleStart);

          conflicts.push({
            id: `circular-${Date.now()}-${nodeId}`,
            type: ConflictType.CIRCULAR_DEPENDENCY,
            severity: 'high',
            nodeIds: cycleNodes,
            edgeIds: edges.filter(e =>
              cycleNodes.includes(e.source) && cycleNodes.includes(e.target)
            ).map(e => e.id),
            description: `Circular dependency detected: ${cycleNodes.map(id =>
              nodes.find(n => n.id === id)?.title || id
            ).join(' → ')}`,
            suggestions: ['Break the cycle by removing one of the dependencies', 'Consider restructuring the relationship hierarchy']
          });

          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return conflicts;
  }

  /**
   * Detect contradictory instructions
   */
  private static detectContradictions(nodes: PromptNode[], edges: PromptEdge[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const conflictEdges = edges.filter(e => e.type === ConnectionType.CONFLICTS_WITH);

    conflictEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        conflicts.push({
          id: `contradiction-${edge.id}`,
          type: ConflictType.CONTRADICTORY_INSTRUCTIONS,
          severity: 'high',
          nodeIds: [edge.source, edge.target],
          edgeIds: [edge.id],
          description: `Conflicting prompts: "${sourceNode.title}" and "${targetNode.title}" have contradictory instructions`,
          suggestions: [
            'Reconcile the conflicting instructions',
            'Remove one of the conflicting prompts',
            'Add conditional logic to handle both cases'
          ]
        });
      }
    });

    // Also detect semantic contradictions in content
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.hasSemanticConflict(nodes[i].content, nodes[j].content)) {
          conflicts.push({
            id: `semantic-conflict-${nodes[i].id}-${nodes[j].id}`,
            type: ConflictType.CONTRADICTORY_INSTRUCTIONS,
            severity: 'medium',
            nodeIds: [nodes[i].id, nodes[j].id],
            description: `Potential semantic conflict between "${nodes[i].title}" and "${nodes[j].title}"`,
            suggestions: ['Review both prompts for contradictory instructions']
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect orphaned nodes (no connections)
   */
  private static detectOrphanedNodes(nodes: PromptNode[], edges: PromptEdge[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const connectedNodes = new Set<string>();

    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && nodes.length > 1) {
        conflicts.push({
          id: `orphaned-${node.id}`,
          type: ConflictType.ORPHANED_NODE,
          severity: 'low',
          nodeIds: [node.id],
          description: `"${node.title}" is not connected to any other prompts`,
          suggestions: [
            'Connect this prompt to related prompts',
            'Remove if not needed in the ontology'
          ]
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect duplicate content
   */
  private static detectDuplicates(nodes: PromptNode[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const contentMap = new Map<string, string[]>();

    nodes.forEach(node => {
      const normalized = node.content.toLowerCase().trim();
      const similarityThreshold = 0.8;

      // Check for exact duplicates
      if (contentMap.has(normalized)) {
        contentMap.get(normalized)!.push(node.id);
      } else {
        contentMap.set(normalized, [node.id]);
      }

      // Check for high similarity
      nodes.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          const similarity = this.calculateSimilarity(node.content, otherNode.content);
          if (similarity > similarityThreshold) {
            const conflictId = `duplicate-${[node.id, otherNode.id].sort().join('-')}`;
            if (!conflicts.find(c => c.id === conflictId)) {
              conflicts.push({
                id: conflictId,
                type: ConflictType.DUPLICATE_CONTENT,
                severity: 'medium',
                nodeIds: [node.id, otherNode.id],
                description: `"${node.title}" and "${otherNode.title}" have similar content (${Math.round(similarity * 100)}% match)`,
                suggestions: [
                  'Merge these prompts if they serve the same purpose',
                  'Differentiate them more clearly if they have distinct roles'
                ]
              });
            }
          }
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect ambiguous relationships
   */
  private static detectAmbiguousRelationships(nodes: PromptNode[], edges: PromptEdge[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Find nodes with multiple conflicting edge types
    nodes.forEach(node => {
      const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
      const edgeTypes = new Set(nodeEdges.map(e => e.type));

      if (edgeTypes.has(ConnectionType.DEPENDS_ON) && edgeTypes.has(ConnectionType.CONFLICTS_WITH)) {
        conflicts.push({
          id: `ambiguous-${node.id}`,
          type: ConflictType.AMBIGUOUS_RELATIONSHIP,
          severity: 'medium',
          nodeIds: [node.id],
          edgeIds: nodeEdges.map(e => e.id),
          description: `"${node.title}" has both dependency and conflict relationships, which may be ambiguous`,
          suggestions: ['Clarify the relationship types', 'Consider restructuring the connections']
        });
      }
    });

    return conflicts;
  }

  /**
   * Calculate text similarity (Jaccard similarity)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Detect semantic conflicts in text
   */
  private static hasSemanticConflict(text1: string, text2: string): boolean {
    const negationPatterns = [
      { positive: /always/i, negative: /never|sometimes|rarely/i },
      { positive: /must/i, negative: /must not|should not|don't/i },
      { positive: /required/i, negative: /optional|not required/i },
      { positive: /include/i, negative: /exclude|omit/i },
      { positive: /allow/i, negative: /forbid|prohibit|prevent/i }
    ];

    return negationPatterns.some(pattern =>
      pattern.positive.test(text1) && pattern.negative.test(text2) ||
      pattern.positive.test(text2) && pattern.negative.test(text1)
    );
  }
}
