import { useState } from 'react';
import { useOntologyStore } from '../stores/ontologyStore';
import { PromptNode, PromptAltitude, PromptScope } from '../types';

// Altitude colors
const altitudeColors: Record<PromptAltitude, string> = {
  [PromptAltitude.META]: 'text-purple-700 bg-purple-50',
  [PromptAltitude.STRATEGIC]: 'text-blue-700 bg-blue-50',
  [PromptAltitude.TACTICAL]: 'text-green-700 bg-green-50',
  [PromptAltitude.OPERATIONAL]: 'text-yellow-700 bg-yellow-50',
  [PromptAltitude.IMPLEMENTATION]: 'text-gray-700 bg-gray-50',
};

// Altitude badges
const altitudeBadges: Record<PromptAltitude, string> = {
  [PromptAltitude.META]: 'META',
  [PromptAltitude.STRATEGIC]: 'STRAT',
  [PromptAltitude.TACTICAL]: 'TACT',
  [PromptAltitude.OPERATIONAL]: 'OPS',
  [PromptAltitude.IMPLEMENTATION]: 'IMPL',
};

// Scope badges
const scopeBadges: Record<PromptScope, string> = {
  [PromptScope.GLOBAL]: 'GLOBAL',
  [PromptScope.SESSION]: 'SESSION',
  [PromptScope.TASK]: 'TASK',
  [PromptScope.LOCAL]: 'LOCAL',
  [PromptScope.CONDITIONAL]: 'COND',
};

const scopeColors: Record<PromptScope, string> = {
  [PromptScope.GLOBAL]: 'bg-indigo-100 text-indigo-800',
  [PromptScope.SESSION]: 'bg-cyan-100 text-cyan-800',
  [PromptScope.TASK]: 'bg-teal-100 text-teal-800',
  [PromptScope.LOCAL]: 'bg-amber-100 text-amber-800',
  [PromptScope.CONDITIONAL]: 'bg-rose-100 text-rose-800',
};

interface TreeNodeProps {
  node: PromptNode;
  depth: number;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getChildren } = useOntologyStore();
  const children = getChildren(node.id);
  const hasChildren = children.length > 0;

  const altitude = node.altitude || PromptAltitude.TACTICAL;
  const scope = node.scope || PromptScope.TASK;

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer
          hover:bg-gray-50 transition-colors
          ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
        `}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
          >
            <svg
              className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Altitude indicator */}
        <span
          className={`
            text-xs font-bold px-1.5 py-0.5 rounded
            ${altitudeColors[altitude]}
          `}
        >
          {altitudeBadges[altitude]}
        </span>

        {/* Node title */}
        <span className="font-medium text-gray-900 flex-1 truncate">
          {node.title}
        </span>

        {/* Scope badge */}
        <span className={`text-xs px-2 py-0.5 rounded ${scopeColors[scope]}`}>
          {scopeBadges[scope]}
        </span>

        {/* Token budget indicator */}
        {node.estimatedTokens && (
          <span className="text-xs text-gray-500 font-mono">
            {node.estimatedTokens}t
          </span>
        )}

        {/* Priority indicator */}
        {node.contextPriority !== undefined && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${node.contextPriority}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-6">
              {node.contextPriority}
            </span>
          </div>
        )}

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs text-gray-400 font-medium">
            {children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-gray-200 ml-3">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTree: React.FC = () => {
  const { getRoots, selectedNodeId, setSelectedNode } = useOntologyStore();
  const rootNodes = getRoots();

  if (rootNodes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">No hierarchy available</p>
        <p className="text-xs mt-1">Add nodes to see the hierarchical structure</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Hierarchy View</h3>
        <p className="text-xs text-gray-500 mt-1">
          {rootNodes.length} root {rootNodes.length === 1 ? 'node' : 'nodes'}
        </p>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="space-y-2">
          {/* Altitude legend */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Altitude</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(altitudeBadges).map(([altitude, badge]) => (
                <span
                  key={altitude}
                  className={`text-xs px-1.5 py-0.5 rounded ${altitudeColors[altitude as PromptAltitude]}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Scope legend */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Scope</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(scopeBadges).map(([scope, badge]) => (
                <span
                  key={scope}
                  className={`text-xs px-2 py-0.5 rounded ${scopeColors[scope as PromptScope]}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="p-2">
        {rootNodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            isSelected={selectedNodeId === node.id}
            onSelect={setSelectedNode}
          />
        ))}
      </div>
    </div>
  );
};
