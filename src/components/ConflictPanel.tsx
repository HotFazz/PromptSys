import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useOntologyStore } from '../stores/ontologyStore';
import { Conflict, ConflictType } from '../types';

const conflictTypeLabels: Record<ConflictType, string> = {
  [ConflictType.CIRCULAR_DEPENDENCY]: 'Circular Dependency',
  [ConflictType.CONTRADICTORY_INSTRUCTIONS]: 'Contradictory Instructions',
  [ConflictType.AMBIGUOUS_RELATIONSHIP]: 'Ambiguous Relationship',
  [ConflictType.MISSING_DEPENDENCY]: 'Missing Dependency',
  [ConflictType.DUPLICATE_CONTENT]: 'Duplicate Content',
  [ConflictType.ORPHANED_NODE]: 'Orphaned Node',
};

const severityColors = {
  low: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700' },
  medium: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
  high: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700' },
};

export const ConflictPanel: React.FC = () => {
  const { conflicts, clearConflict, getNodeById } = useOntologyStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);

  const sortedConflicts = [...conflicts].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const handleDismiss = (conflictId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    clearConflict(conflictId);
    if (selectedConflict === conflictId) {
      setSelectedConflict(null);
    }
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <div
        className="bg-red-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="font-semibold">
            {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {/* Conflicts List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {sortedConflicts.map((conflict) => (
            <ConflictItem
              key={conflict.id}
              conflict={conflict}
              isSelected={selectedConflict === conflict.id}
              onSelect={() => setSelectedConflict(
                selectedConflict === conflict.id ? null : conflict.id
              )}
              onDismiss={(e) => handleDismiss(conflict.id, e)}
              getNodeTitle={(id) => getNodeById(id)?.title || 'Unknown Node'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ConflictItemProps {
  conflict: Conflict;
  isSelected: boolean;
  onSelect: () => void;
  onDismiss: (e: React.MouseEvent) => void;
  getNodeTitle: (id: string) => string;
}

const ConflictItem: React.FC<ConflictItemProps> = ({
  conflict,
  isSelected,
  onSelect,
  onDismiss,
  getNodeTitle,
}) => {
  const colors = severityColors[conflict.severity];

  return (
    <div
      className={`border-b border-gray-200 ${isSelected ? colors.bg : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
      onClick={onSelect}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                {conflict.severity.toUpperCase()}
              </span>
              <span className="text-xs text-gray-600">
                {conflictTypeLabels[conflict.type]}
              </span>
            </div>
            <p className="text-sm text-gray-800">{conflict.description}</p>
          </div>
          <button
            onClick={onDismiss}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Affected Nodes */}
        {conflict.nodeIds.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-600 mb-1">Affected Nodes:</p>
            <div className="flex flex-wrap gap-1">
              {conflict.nodeIds.map((nodeId) => (
                <span
                  key={nodeId}
                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                >
                  {getNodeTitle(nodeId)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {isSelected && conflict.suggestions && conflict.suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Suggestions:</p>
            <ul className="space-y-1">
              {conflict.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-gray-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
