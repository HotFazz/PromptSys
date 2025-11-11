import { useEffect } from 'react';
import { useOntologyStore } from '../stores/ontologyStore';
import { ContextManager, TokenEstimator } from '../services/contextManager';
import { PromptAltitude } from '../types';

const altitudeColors: Record<PromptAltitude, string> = {
  [PromptAltitude.META]: '#9333ea',
  [PromptAltitude.STRATEGIC]: '#3b82f6',
  [PromptAltitude.TACTICAL]: '#10b981',
  [PromptAltitude.OPERATIONAL]: '#f59e0b',
  [PromptAltitude.IMPLEMENTATION]: '#6b7280',
};

export const ContextBudgetPanel: React.FC = () => {
  const { nodes, contextWindow, updateContextWindow } = useOntologyStore();
  const contextManager = new ContextManager();

  // Update context window when nodes change
  useEffect(() => {
    if (nodes.length === 0) {
      updateContextWindow({
        totalBudget: 200000,
        used: 0,
        remaining: 200000,
        allocations: [],
        compactionEnabled: true,
        compactionThreshold: 0.8,
        preserveNodeIds: [],
        compactionHistory: []
      });
      return;
    }

    // Calculate token estimates for all nodes
    const nodesWithTokens = nodes.map(node => ({
      ...node,
      estimatedTokens: node.estimatedTokens || TokenEstimator.estimateNode(node)
    }));

    // Allocate budget
    const allocations = contextManager.allocateBudget(nodesWithTokens);

    // Get window state
    const window = contextManager.getWindow();
    window.allocations = allocations;

    updateContextWindow(window);
  }, [nodes]);

  if (!contextWindow || nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Context Budget</h3>
        <p className="text-sm text-gray-500">
          No nodes to analyze. Add nodes to see context allocation.
        </p>
      </div>
    );
  }

  const utilization = (contextWindow.used / contextWindow.totalBudget) * 100;
  const shouldCompact = utilization > (contextWindow.compactionThreshold * 100);

  // Group allocations by altitude
  const allocationsByAltitude = contextWindow.allocations.reduce((acc, alloc) => {
    const node = nodes.find(n => n.id === alloc.nodeId);
    const altitude = node?.altitude || PromptAltitude.TACTICAL;
    if (!acc[altitude]) acc[altitude] = [];
    acc[altitude].push(alloc);
    return acc;
  }, {} as Record<PromptAltitude, typeof contextWindow.allocations>);

  // Calculate totals by altitude
  const altitudeTotals = Object.entries(allocationsByAltitude).map(([altitude, allocs]) => ({
    altitude: altitude as PromptAltitude,
    used: allocs.reduce((sum, a) => sum + a.used, 0),
    allocated: allocs.reduce((sum, a) => sum + a.allocated, 0),
    count: allocs.length
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900 text-lg">Context Budget</h3>
        <p className="text-sm text-gray-500 mt-1">
          Token allocation across {nodes.length} nodes
        </p>
      </div>

      {/* Overall utilization */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Total Utilization</span>
          <span className="text-sm font-mono text-gray-900">
            {contextWindow.used.toLocaleString()} / {contextWindow.totalBudget.toLocaleString()} tokens
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              utilization > 90
                ? 'bg-red-500'
                : utilization > 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {utilization.toFixed(1)}% used
          </span>
          <span className="text-xs text-gray-500">
            {contextWindow.remaining.toLocaleString()} remaining
          </span>
        </div>
      </div>

      {/* Compaction warning */}
      {shouldCompact && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Compaction Recommended
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                Context usage exceeds {(contextWindow.compactionThreshold * 100).toFixed(0)}% threshold.
                Consider compacting low-priority nodes or deferring optional content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Allocation by altitude */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Allocation by Altitude</h4>
        <div className="space-y-3">
          {altitudeTotals
            .sort((a, b) => {
              const order = [
                PromptAltitude.META,
                PromptAltitude.STRATEGIC,
                PromptAltitude.TACTICAL,
                PromptAltitude.OPERATIONAL,
                PromptAltitude.IMPLEMENTATION
              ];
              return order.indexOf(a.altitude) - order.indexOf(b.altitude);
            })
            .map(({ altitude, used, allocated, count }) => {
              const percentage = (used / contextWindow.totalBudget) * 100;
              return (
                <div key={altitude}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: altitudeColors[altitude] }}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {altitude}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({count} {count === 1 ? 'node' : 'nodes'})
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-600">
                      {used.toLocaleString()}t
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: altitudeColors[altitude]
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% of total
                    </span>
                    {used > allocated && (
                      <span className="text-xs text-red-600 font-medium">
                        Over by {(used - allocated).toLocaleString()}t
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg per Node</p>
          <p className="text-lg font-semibold text-gray-900">
            {Math.round(contextWindow.used / nodes.length).toLocaleString()}
            <span className="text-sm text-gray-500 font-normal ml-1">tokens</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compaction Events</p>
          <p className="text-lg font-semibold text-gray-900">
            {contextWindow.compactionHistory.length}
            <span className="text-sm text-gray-500 font-normal ml-1">events</span>
          </p>
        </div>
      </div>

      {/* Top consumers */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Token Consumers</h4>
        <div className="space-y-2">
          {contextWindow.allocations
            .sort((a, b) => b.used - a.used)
            .slice(0, 5)
            .map(alloc => {
              const node = nodes.find(n => n.id === alloc.nodeId);
              if (!node) return null;
              return (
                <div key={alloc.nodeId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2">
                    {node.title}
                  </span>
                  <span className="font-mono text-gray-600 text-xs">
                    {alloc.used.toLocaleString()}t
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
