/**
 * Hierarchy Analyzer
 * Analyzes hierarchical structure, calculates metrics, and provides recommendations
 */

import {
  PromptNode,
  PromptEdge,
  PromptAltitude,
  PromptScope,
  HierarchyMetrics,
  HierarchyAnalysis,
  HierarchyIssue,
  HierarchyRecommendation,
  HierarchyHotspot
} from '../types';
import { TokenEstimator } from './contextManager';

export class HierarchyAnalyzer {
  /**
   * Perform complete hierarchy analysis
   */
  static analyze(nodes: PromptNode[], edges: PromptEdge[]): HierarchyAnalysis {
    const metrics = this.calculateMetrics(nodes, edges);
    const issues = this.detectIssues(nodes, edges, metrics);
    const recommendations = this.generateRecommendations(issues, metrics);
    const hotspots = this.findHotspots(nodes, edges, issues);

    return {
      metrics,
      issues,
      recommendations,
      hotspots
    };
  }

  /**
   * Calculate comprehensive hierarchy metrics
   */
  static calculateMetrics(nodes: PromptNode[], edges: PromptEdge[]): HierarchyMetrics {
    // Structure metrics
    const depths = nodes.map(n => n.depth || 0);
    const maxDepth = Math.max(...depths, 0);
    const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
    const leafNodes = nodes.filter(n => !n.childIds || n.childIds.length === 0).length;
    const rootNodes = nodes.filter(n => !n.parentId).length;

    // Balance factor
    const balanceFactor = this.calculateBalanceFactor(nodes);

    // Fanout (children per node)
    const fanouts = nodes.filter(n => n.childIds && n.childIds.length > 0)
      .map(n => n.childIds!.length);
    const fanout = {
      min: fanouts.length > 0 ? Math.min(...fanouts) : 0,
      max: fanouts.length > 0 ? Math.max(...fanouts) : 0,
      avg: fanouts.length > 0 ? fanouts.reduce((a, b) => a + b, 0) / fanouts.length : 0
    };

    // Altitude distribution
    const altitudeDistribution = this.calculateDistribution(
      nodes,
      n => n.altitude || PromptAltitude.TACTICAL,
      Object.values(PromptAltitude)
    );

    // Specificity and flexibility ranges
    const specificities = nodes.map(n => n.specificity || 0.5).filter(s => s > 0);
    const flexibilities = nodes.map(n => n.flexibility || 0.5).filter(f => f > 0);

    const specificityRange = {
      min: specificities.length > 0 ? Math.min(...specificities) : 0,
      max: specificities.length > 0 ? Math.max(...specificities) : 1,
      avg: specificities.length > 0 ? specificities.reduce((a, b) => a + b, 0) / specificities.length : 0.5
    };

    const flexibilityRange = {
      min: flexibilities.length > 0 ? Math.min(...flexibilities) : 0,
      max: flexibilities.length > 0 ? Math.max(...flexibilities) : 1,
      avg: flexibilities.length > 0 ? flexibilities.reduce((a, b) => a + b, 0) / flexibilities.length : 0.5
    };

    // Context metrics
    const totalTokens = TokenEstimator.estimateTotal(nodes);
    const avgTokensPerNode = nodes.length > 0 ? totalTokens / nodes.length : 0;
    const budgetUtilization = this.calculateBudgetUtilization(nodes);

    // Scope distribution
    const scopeDistribution = this.calculateDistribution(
      nodes,
      n => n.scope || PromptScope.TASK,
      Object.values(PromptScope)
    );

    // Complexity metrics
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(nodes, edges);
    const couplingScore = this.calculateCoupling(nodes, edges);
    const cohesionScore = this.calculateCohesion(nodes);

    // Quality metrics
    const orphanedNodes = this.findOrphanedNodes(nodes, edges).length;
    const redundancyScore = this.calculateRedundancy(nodes);
    const conflictDensity = 0; // Would be calculated from actual conflicts
    const templateUsage = nodes.filter(n => n.isTemplate).length / nodes.length;

    return {
      maxDepth,
      avgDepth,
      totalNodes: nodes.length,
      leafNodes,
      rootNodes,
      balanceFactor,
      fanout,
      altitudeDistribution,
      specificityRange,
      flexibilityRange,
      totalTokens,
      avgTokensPerNode,
      budgetUtilization,
      scopeDistribution,
      cyclomaticComplexity,
      couplingScore,
      cohesionScore,
      orphanedNodes,
      redundancyScore,
      conflictDensity,
      templateUsage
    };
  }

  /**
   * Detect issues in hierarchy
   */
  static detectIssues(
    nodes: PromptNode[],
    edges: PromptEdge[],
    metrics: HierarchyMetrics
  ): HierarchyIssue[] {
    const issues: HierarchyIssue[] = [];

    // Check for excessive depth
    if (metrics.maxDepth > 5) {
      const deepNodes = nodes.filter(n => (n.depth || 0) > 5);
      issues.push({
        id: `depth-${Date.now()}`,
        type: 'depth_exceeded',
        severity: metrics.maxDepth > 7 ? 'high' : 'medium',
        nodeIds: deepNodes.map(n => n.id),
        description: `Hierarchy depth of ${metrics.maxDepth} exceeds recommended maximum of 5`,
        impact: 'Deep hierarchies are harder to understand and maintain'
      });
    }

    // Check for imbalance
    if (metrics.balanceFactor < 0.5) {
      issues.push({
        id: `balance-${Date.now()}`,
        type: 'imbalanced',
        severity: 'medium',
        nodeIds: [],
        description: `Hierarchy is imbalanced (factor: ${metrics.balanceFactor.toFixed(2)})`,
        impact: 'Imbalanced hierarchies suggest poor organization'
      });
    }

    // Check for orphaned nodes
    if (metrics.orphanedNodes > 0) {
      const orphaned = this.findOrphanedNodes(nodes, edges);
      issues.push({
        id: `orphaned-${Date.now()}`,
        type: 'orphaned',
        severity: 'low',
        nodeIds: orphaned.map(n => n.id),
        description: `${metrics.orphanedNodes} orphaned nodes found`,
        impact: 'Orphaned nodes suggest missing relationships'
      });
    }

    // Check for over-allocation
    const overallocated = nodes.filter(n =>
      n.estimatedTokens && n.tokenBudget && n.estimatedTokens > n.tokenBudget
    );
    if (overallocated.length > 0) {
      issues.push({
        id: `overalloc-${Date.now()}`,
        type: 'over_allocated',
        severity: 'high',
        nodeIds: overallocated.map(n => n.id),
        description: `${overallocated.length} nodes exceed their token budget`,
        impact: 'May cause context window overflow'
      });
    }

    // Check for under-specified nodes
    const underspecified = nodes.filter(n =>
      (n.specificity || 0) < 0.3 && n.altitude !== PromptAltitude.META
    );
    if (underspecified.length > nodes.length * 0.3) {
      issues.push({
        id: `underspec-${Date.now()}`,
        type: 'under_specified',
        severity: 'medium',
        nodeIds: underspecified.slice(0, 10).map(n => n.id),
        description: `${underspecified.length} nodes are under-specified`,
        impact: 'Vague prompts reduce effectiveness'
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues and metrics
   */
  static generateRecommendations(
    issues: HierarchyIssue[],
    metrics: HierarchyMetrics
  ): HierarchyRecommendation[] {
    const recommendations: HierarchyRecommendation[] = [];

    // Recommend flattening deep hierarchies
    const depthIssue = issues.find(i => i.type === 'depth_exceeded');
    if (depthIssue) {
      recommendations.push({
        id: `rec-flatten-${Date.now()}`,
        type: 'restructure',
        priority: 80,
        description: 'Consider flattening deep hierarchy levels',
        affectedNodes: depthIssue.nodeIds,
        expectedImprovement: 'Improved readability and maintainability'
      });
    }

    // Recommend rebalancing
    if (metrics.balanceFactor < 0.5) {
      recommendations.push({
        id: `rec-rebalance-${Date.now()}`,
        type: 'rebalance',
        priority: 60,
        description: 'Rebalance hierarchy to distribute nodes more evenly',
        affectedNodes: [],
        expectedImprovement: 'Better structural organization'
      });
    }

    // Recommend merging similar nodes
    if (metrics.redundancyScore > 0.3) {
      recommendations.push({
        id: `rec-merge-${Date.now()}`,
        type: 'merge',
        priority: 70,
        description: 'Merge nodes with similar content to reduce redundancy',
        affectedNodes: [],
        expectedImprovement: 'Reduced token usage and clearer structure'
      });
    }

    // Recommend adding layers for organization
    if (metrics.fanout.max > 10) {
      recommendations.push({
        id: `rec-layer-${Date.now()}`,
        type: 'add_layer',
        priority: 50,
        description: 'Add intermediate layers to nodes with many children',
        affectedNodes: [],
        expectedImprovement: 'Better organization and navigation'
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find hotspots (problematic areas)
   */
  static findHotspots(
    nodes: PromptNode[],
    _edges: PromptEdge[],
    issues: HierarchyIssue[]
  ): HierarchyHotspot[] {
    const hotspots: HierarchyHotspot[] = [];
    const scoreMap = new Map<string, { score: number; reasons: string[] }>();

    // Score nodes based on issues
    issues.forEach(issue => {
      issue.nodeIds.forEach(nodeId => {
        const current = scoreMap.get(nodeId) || { score: 0, reasons: [] };
        const severityScore = issue.severity === 'high' ? 30 : issue.severity === 'medium' ? 20 : 10;
        current.score += severityScore;
        current.reasons.push(issue.description);
        scoreMap.set(nodeId, current);
      });
    });

    // Add scores for structural issues
    nodes.forEach(node => {
      const current = scoreMap.get(node.id) || { score: 0, reasons: [] };

      // Deep nesting
      if ((node.depth || 0) > 4) {
        current.score += 15;
        current.reasons.push(`Deep nesting (depth: ${node.depth})`);
      }

      // Many children
      if (node.childIds && node.childIds.length > 8) {
        current.score += 10;
        current.reasons.push(`Many children (${node.childIds.length})`);
      }

      // High token usage
      if (node.estimatedTokens && node.estimatedTokens > 5000) {
        current.score += 20;
        current.reasons.push(`High token count (${node.estimatedTokens})`);
      }

      scoreMap.set(node.id, current);
    });

    // Convert to hotspots
    scoreMap.forEach((data, nodeId) => {
      if (data.score > 20) {
        hotspots.push({
          nodeId,
          score: Math.min(data.score, 100),
          reasons: data.reasons,
          suggestedActions: this.getSuggestedActions(data.reasons)
        });
      }
    });

    return hotspots.sort((a, b) => b.score - a.score);
  }

  /**
   * Helper: Calculate balance factor (0 = imbalanced, 1 = perfect balance)
   */
  private static calculateBalanceFactor(nodes: PromptNode[]): number {
    const roots = nodes.filter(n => !n.parentId);
    if (roots.length === 0) return 1;

    const depths = roots.map(root => this.calculateSubtreeDepth(root.id, nodes));
    const maxDepth = Math.max(...depths);
    const minDepth = Math.min(...depths);

    if (maxDepth === 0) return 1;
    return minDepth / maxDepth;
  }

  /**
   * Helper: Calculate subtree depth
   */
  private static calculateSubtreeDepth(nodeId: string, nodes: PromptNode[]): number {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.childIds || node.childIds.length === 0) return 1;

    const childDepths = node.childIds.map(childId =>
      this.calculateSubtreeDepth(childId, nodes)
    );

    return 1 + Math.max(...childDepths);
  }

  /**
   * Helper: Calculate distribution of values
   */
  private static calculateDistribution<T, K extends string>(
    items: T[],
    getValue: (item: T) => K,
    allKeys: K[]
  ): Record<K, number> {
    const dist = {} as Record<K, number>;

    allKeys.forEach(key => {
      dist[key] = 0;
    });

    items.forEach(item => {
      const key = getValue(item);
      dist[key] = (dist[key] || 0) + 1;
    });

    return dist;
  }

  /**
   * Helper: Calculate budget utilization
   */
  private static calculateBudgetUtilization(nodes: PromptNode[]): number {
    const budgeted = nodes.filter(n => n.tokenBudget);
    if (budgeted.length === 0) return 0;

    const totalBudget = budgeted.reduce((sum, n) => sum + (n.tokenBudget || 0), 0);
    const totalUsed = budgeted.reduce((sum, n) => sum + (n.estimatedTokens || 0), 0);

    return totalBudget > 0 ? totalUsed / totalBudget : 0;
  }

  /**
   * Helper: Calculate cyclomatic complexity
   */
  private static calculateCyclomaticComplexity(nodes: PromptNode[], edges: PromptEdge[]): number {
    // Simplified: E - N + 2P (edges - nodes + 2 * connected components)
    const connectedComponents = this.countConnectedComponents(nodes, edges);
    return edges.length - nodes.length + 2 * connectedComponents;
  }

  /**
   * Helper: Calculate coupling (interconnectedness)
   */
  private static calculateCoupling(nodes: PromptNode[], edges: PromptEdge[]): number {
    if (nodes.length <= 1) return 0;

    const maxEdges = nodes.length * (nodes.length - 1) / 2;
    return edges.length / maxEdges;
  }

  /**
   * Helper: Calculate cohesion (how focused)
   */
  private static calculateCohesion(nodes: PromptNode[]): number {
    // Measure by category and scope uniformity
    const categories = new Set(nodes.map(n => n.category));
    const scopes = new Set(nodes.map(n => n.scope || PromptScope.TASK));

    const categoryUniformity = 1 - (categories.size / nodes.length);
    const scopeUniformity = 1 - (scopes.size / nodes.length);

    return (categoryUniformity + scopeUniformity) / 2;
  }

  /**
   * Helper: Find orphaned nodes
   */
  private static findOrphanedNodes(nodes: PromptNode[], edges: PromptEdge[]): PromptNode[] {
    if (nodes.length <= 1) return [];

    const connected = new Set<string>();
    edges.forEach(edge => {
      connected.add(edge.source);
      connected.add(edge.target);
    });

    return nodes.filter(n => !connected.has(n.id));
  }

  /**
   * Helper: Calculate redundancy
   */
  private static calculateRedundancy(nodes: PromptNode[]): number {
    if (nodes.length <= 1) return 0;

    let similarPairs = 0;
    const threshold = 0.7;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.calculateSimilarity(nodes[i].content, nodes[j].content);
        if (similarity > threshold) {
          similarPairs++;
        }
      }
    }

    const totalPairs = nodes.length * (nodes.length - 1) / 2;
    return similarPairs / totalPairs;
  }

  /**
   * Helper: Calculate text similarity (Jaccard)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Helper: Count connected components
   */
  private static countConnectedComponents(nodes: PromptNode[], edges: PromptEdge[]): number {
    const visited = new Set<string>();
    let components = 0;

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      edges
        .filter(e => e.source === nodeId || e.target === nodeId)
        .forEach(e => {
          const nextId = e.source === nodeId ? e.target : e.source;
          dfs(nextId);
        });
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        components++;
        dfs(node.id);
      }
    });

    return components;
  }

  /**
   * Helper: Get suggested actions based on reasons
   */
  private static getSuggestedActions(reasons: string[]): string[] {
    const actions: string[] = [];

    if (reasons.some(r => r.includes('Deep nesting'))) {
      actions.push('Consider flattening or restructuring this branch');
    }

    if (reasons.some(r => r.includes('Many children'))) {
      actions.push('Add intermediate grouping nodes');
    }

    if (reasons.some(r => r.includes('High token count'))) {
      actions.push('Split into smaller, focused prompts');
      actions.push('Enable compression for this node');
    }

    if (reasons.some(r => r.includes('exceed'))) {
      actions.push('Review and optimize content');
      actions.push('Increase token budget or enable compression');
    }

    return actions;
  }
}
