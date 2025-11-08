import { useState, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Edit2, Check, X, AlertTriangle, Tag } from 'lucide-react';
import { PromptNode as PromptNodeType, PromptCategory } from '../types';
import { useOntologyStore } from '../stores/ontologyStore';

const categoryColors: Record<PromptCategory, { bg: string; border: string; text: string }> = {
  [PromptCategory.INSTRUCTION]: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  [PromptCategory.CONTEXT]: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700' },
  [PromptCategory.CONSTRAINT]: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700' },
  [PromptCategory.EXAMPLE]: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700' },
  [PromptCategory.ROLE]: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
  [PromptCategory.OBJECTIVE]: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' },
  [PromptCategory.FORMAT]: { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-700' },
  [PromptCategory.PERSONA]: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
  [PromptCategory.GUARDRAIL]: { bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-800' },
  [PromptCategory.TOOL]: { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
  [PromptCategory.WORKFLOW]: { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700' },
  [PromptCategory.UNCATEGORIZED]: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700' },
};

export const PromptNode = memo(({ data, id }: NodeProps<PromptNodeType>) => {
  const { updateNode, getNodeConflicts, deleteNode } = useOntologyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editContent, setEditContent] = useState(data.content);

  const conflicts = getNodeConflicts(id);
  const hasConflicts = conflicts.length > 0;
  const colors = categoryColors[data.category] || categoryColors[PromptCategory.UNCATEGORIZED];

  const handleSave = () => {
    updateNode(id, {
      title: editTitle,
      content: editContent
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(data.title);
    setEditContent(data.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete node "${data.title}"?`)) {
      deleteNode(id);
    }
  };

  return (
    <div
      className={`relative rounded-lg shadow-lg border-2 ${colors.border} ${colors.bg} min-w-[280px] max-w-[400px]`}
    >
      {/* Conflict Indicator */}
      {hasConflicts && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg z-10" title={`${conflicts.length} conflict(s)`}>
          <AlertTriangle size={16} />
        </div>
      )}

      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />

      {/* Header */}
      <div className={`px-4 py-2 border-b-2 ${colors.border} flex items-center justify-between`}>
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 bg-white px-2 py-1 rounded border border-gray-300 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <h3 className={`font-semibold ${colors.text} text-sm flex-1`}>{data.title}</h3>
        )}

        <div className="flex items-center gap-1 ml-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Save"
              >
                <Check size={16} className="text-green-600" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Cancel"
              >
                <X size={16} className="text-red-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={16} className={colors.text} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Delete"
              >
                <X size={16} className="text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-white px-2 py-1 rounded border border-gray-300 text-xs resize-none"
            rows={6}
          />
        ) : (
          <p className="text-xs text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {data.content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t ${colors.border} bg-white/50 flex items-center justify-between text-xs`}>
        <div className="flex items-center gap-1">
          <Tag size={12} className={colors.text} />
          <span className={colors.text}>{data.category}</span>
        </div>
        {data.metadata.complexity && (
          <span className={`px-2 py-0.5 rounded ${
            data.metadata.complexity === 'high' ? 'bg-red-200 text-red-700' :
            data.metadata.complexity === 'medium' ? 'bg-yellow-200 text-yellow-700' :
            'bg-green-200 text-green-700'
          }`}>
            {data.metadata.complexity}
          </span>
        )}
      </div>

      {/* Conflict Details */}
      {hasConflicts && (
        <div className="px-4 py-2 bg-red-50 border-t-2 border-red-400">
          <p className="text-xs text-red-800 font-semibold mb-1">Conflicts:</p>
          {conflicts.slice(0, 2).map(conflict => (
            <p key={conflict.id} className="text-xs text-red-700">
              • {conflict.description}
            </p>
          ))}
          {conflicts.length > 2 && (
            <p className="text-xs text-red-600 mt-1">+{conflicts.length - 2} more...</p>
          )}
        </div>
      )}
    </div>
  );
});

PromptNode.displayName = 'PromptNode';
