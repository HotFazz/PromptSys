/**
 * Context Window Manager
 * Manages token budget allocation, compaction, and just-in-time loading
 * Based on Anthropic's context engineering principles
 */

import {
  PromptNode,
  PromptAltitude,
  PromptScope,
  ContextWindow,
  ContextAllocation,
  CompactionResult,
  CompactedNode,
  CompactionEvent
} from '../types';

export class ContextManager {
  private window: ContextWindow;

  constructor(totalBudget: number = 200000) {
    this.window = {
      totalBudget,
      used: 0,
      remaining: totalBudget,
      allocations: [],
      compactionEnabled: true,
      compactionThreshold: 0.8,
      preserveNodeIds: [],
      compactionHistory: []
    };
  }

  /**
   * Get current context window state
   */
  getWindow(): ContextWindow {
    return { ...this.window };
  }

  /**
   * Set nodes that should never be compacted
   */
  setPreserveNodes(nodeIds: string[]): void {
    this.window.preserveNodeIds = nodeIds;
  }

  /**
   * Allocate context budget based on priority, altitude, and scope
   */
  allocateBudget(nodes: PromptNode[]): ContextAllocation[] {
    // Step 1: Reserve budget for GLOBAL scope nodes (30%)
    const globalNodes = nodes.filter(n => n.scope === PromptScope.GLOBAL);
    const globalBudget = this.window.totalBudget * 0.3;
    const globalAllocs = this.allocateEqually(globalNodes, globalBudget, 100, false);

    // Step 2: Allocate by altitude (40%)
    const altitudeBudget = this.window.totalBudget * 0.4;
    const altitudeAllocs = this.allocateByAltitude(nodes, altitudeBudget);

    // Step 3: Allocate by priority (30%)
    const priorityBudget = this.window.totalBudget * 0.3;
    const priorityAllocs = this.allocateByPriority(nodes, priorityBudget);

    // Step 4: Merge allocations
    const merged = this.mergeAllocations([globalAllocs, altitudeAllocs, priorityAllocs]);

    this.window.allocations = merged;
    this.updateUsage();

    return merged;
  }

  /**
   * Allocate budget by altitude with weighted distribution
   */
  private allocateByAltitude(nodes: PromptNode[], budget: number): ContextAllocation[] {
    const weights: Record<PromptAltitude, number> = {
      [PromptAltitude.META]: 0.30,
      [PromptAltitude.STRATEGIC]: 0.25,
      [PromptAltitude.TACTICAL]: 0.20,
      [PromptAltitude.OPERATIONAL]: 0.15,
      [PromptAltitude.IMPLEMENTATION]: 0.10
    };

    const altitudeGroups = this.groupByAltitude(nodes);
    const allocations: ContextAllocation[] = [];

    Object.entries(altitudeGroups).forEach(([altitude, groupNodes]) => {
      const altitudeBudget = budget * weights[altitude as PromptAltitude];
      const groupAllocs = this.allocateEqually(
        groupNodes,
        altitudeBudget,
        this.altitudeToPriority(altitude as PromptAltitude),
        this.isAltitudeCompressible(altitude as PromptAltitude)
      );
      allocations.push(...groupAllocs);
    });

    return allocations;
  }

  /**
   * Allocate budget by explicit priority
   */
  private allocateByPriority(nodes: PromptNode[], budget: number): ContextAllocation[] {
    const totalPriority = nodes.reduce((sum, n) => sum + (n.contextPriority || 50), 0);

    return nodes.map(node => {
      const priority = node.contextPriority || 50;
      const allocated = (priority / totalPriority) * budget;

      return {
        nodeId: node.id,
        allocated: Math.floor(allocated),
        used: node.estimatedTokens || Math.floor(allocated * 0.8),
        priority,
        compressible: node.compressionHint !== 'preserve',
        compressionRatio: 1.0
      };
    });
  }

  /**
   * Allocate equally among nodes
   */
  private allocateEqually(
    nodes: PromptNode[],
    budget: number,
    priority: number,
    compressible: boolean
  ): ContextAllocation[] {
    if (nodes.length === 0) return [];

    const perNode = Math.floor(budget / nodes.length);

    return nodes.map(node => ({
      nodeId: node.id,
      allocated: perNode,
      used: node.estimatedTokens || Math.floor(perNode * 0.8),
      priority,
      compressible,
      compressionRatio: 1.0
    }));
  }

  /**
   * Merge multiple allocation sets, taking the maximum for each node
   */
  private mergeAllocations(allocationSets: ContextAllocation[][]): ContextAllocation[] {
    const merged = new Map<string, ContextAllocation>();

    allocationSets.forEach(allocSet => {
      allocSet.forEach(alloc => {
        const existing = merged.get(alloc.nodeId);
        if (!existing || alloc.allocated > existing.allocated) {
          merged.set(alloc.nodeId, alloc);
        }
      });
    });

    return Array.from(merged.values());
  }

  /**
   * Compact context to free up budget
   */
  async compact(targetReduction: number): Promise<CompactionResult> {
    const compactableNodes = this.window.allocations
      .filter(a => a.compressible && !this.window.preserveNodeIds.includes(a.nodeId))
      .sort((a, b) => a.priority - b.priority); // Lowest priority first

    const compacted: CompactedNode[] = [];
    let tokensSaved = 0;
    const errors: string[] = [];

    for (const allocation of compactableNodes) {
      if (tokensSaved >= targetReduction) break;

      try {
        const compactedNode = await this.compactNode(allocation);
        compacted.push(compactedNode);
        tokensSaved += compactedNode.originalTokens - compactedNode.compressedTokens;
      } catch (error) {
        errors.push(`Failed to compact node ${allocation.nodeId}: ${error}`);
      }
    }

    // Update allocations
    const newAllocations = this.window.allocations.map(alloc => {
      const compactedInfo = compacted.find(c => c.nodeId === alloc.nodeId);
      if (compactedInfo) {
        return {
          ...alloc,
          used: compactedInfo.compressedTokens,
          compressionRatio: compactedInfo.originalTokens / compactedInfo.compressedTokens
        };
      }
      return alloc;
    });

    // Record compaction event
    const event: CompactionEvent = {
      timestamp: new Date(),
      trigger: 'manual',
      beforeUsed: this.window.used,
      afterUsed: this.window.used - tokensSaved,
      nodesCompacted: compacted.map(c => c.nodeId),
      savedTokens: tokensSaved
    };

    this.window.compactionHistory.push(event);
    this.window.allocations = newAllocations;
    this.updateUsage();

    return {
      success: tokensSaved >= targetReduction,
      tokensSaved,
      nodesCompacted: compacted,
      newAllocations,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Compact a single node (stub for now, would use AI summarization)
   */
  private async compactNode(allocation: ContextAllocation): Promise<CompactedNode> {
    // In real implementation, this would call an AI service to summarize
    const compressionRatio = 0.5; // 50% reduction
    const originalTokens = allocation.used;
    const compressedTokens = Math.floor(originalTokens * compressionRatio);

    return {
      nodeId: allocation.nodeId,
      originalTokens,
      compressedTokens,
      compressionMethod: 'summarize',
      canRestore: true
    };
  }

  /**
   * Check if compaction is needed
   */
  shouldCompact(): boolean {
    if (!this.window.compactionEnabled) return false;

    const utilization = this.window.used / this.window.totalBudget;
    return utilization > this.window.compactionThreshold;
  }

  /**
   * Get recommendations for budget optimization
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const utilization = this.window.used / this.window.totalBudget;

    if (utilization > 0.9) {
      recommendations.push('Context budget critically high. Consider compaction or defer optional nodes.');
    } else if (utilization > 0.8) {
      recommendations.push('Context budget high. Review low-priority nodes for compaction.');
    }

    // Find nodes using more than allocated
    const overallocated = this.window.allocations.filter(a => a.used > a.allocated);
    if (overallocated.length > 0) {
      recommendations.push(`${overallocated.length} nodes exceed their allocation. Review token usage.`);
    }

    // Find highly compressible nodes
    const highlyCompressed = this.window.allocations.filter(
      a => a.compressionRatio && a.compressionRatio > 2.0
    );
    if (highlyCompressed.length > 0) {
      recommendations.push(`${highlyCompressed.length} nodes heavily compressed. Consider content simplification.`);
    }

    return recommendations;
  }

  /**
   * Update total usage statistics
   */
  private updateUsage(): void {
    this.window.used = this.window.allocations.reduce((sum, a) => sum + a.used, 0);
    this.window.remaining = this.window.totalBudget - this.window.used;
  }

  /**
   * Helper: Group nodes by altitude
   */
  private groupByAltitude(nodes: PromptNode[]): Record<PromptAltitude, PromptNode[]> {
    const groups: Record<string, PromptNode[]> = {};

    Object.values(PromptAltitude).forEach(alt => {
      groups[alt] = [];
    });

    nodes.forEach(node => {
      const altitude = node.altitude || PromptAltitude.TACTICAL;
      if (!groups[altitude]) groups[altitude] = [];
      groups[altitude].push(node);
    });

    return groups as Record<PromptAltitude, PromptNode[]>;
  }

  /**
   * Helper: Convert altitude to priority score
   */
  private altitudeToPriority(altitude: PromptAltitude): number {
    const map: Record<PromptAltitude, number> = {
      [PromptAltitude.META]: 100,
      [PromptAltitude.STRATEGIC]: 80,
      [PromptAltitude.TACTICAL]: 60,
      [PromptAltitude.OPERATIONAL]: 40,
      [PromptAltitude.IMPLEMENTATION]: 20
    };
    return map[altitude];
  }

  /**
   * Helper: Determine if altitude is compressible
   */
  private isAltitudeCompressible(altitude: PromptAltitude): boolean {
    return altitude === PromptAltitude.IMPLEMENTATION ||
           altitude === PromptAltitude.OPERATIONAL;
  }

  /**
   * Export context state for persistence
   */
  export(): string {
    return JSON.stringify(this.window);
  }

  /**
   * Import context state
   */
  import(data: string): void {
    this.window = JSON.parse(data);
  }
}

/**
 * Token estimation utilities
 */
export class TokenEstimator {
  /**
   * Estimate tokens for text (rough approximation)
   * Real implementation would use tiktoken or similar
   */
  static estimate(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate tokens for a prompt node
   */
  static estimateNode(node: PromptNode): number {
    const titleTokens = this.estimate(node.title);
    const contentTokens = this.estimate(node.content);
    const metadataTokens = 10; // Rough overhead

    return titleTokens + contentTokens + metadataTokens;
  }

  /**
   * Estimate total tokens for multiple nodes
   */
  static estimateTotal(nodes: PromptNode[]): number {
    return nodes.reduce((sum, node) => sum + this.estimateNode(node), 0);
  }
}
