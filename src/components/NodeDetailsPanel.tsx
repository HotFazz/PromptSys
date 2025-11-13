import { useState, useEffect } from 'react';
import { X, Tag, Zap, Code, Settings, Hash, Edit2, Save, XCircle, Trash2 } from 'lucide-react';
import { PromptNodeType, InvocationStrategy, PromptCategory, PromptAltitude, PromptScope, ToolSchema } from '../types';
import { useOntologyStore } from '../stores/ontologyStore';
import { validateNodeData } from '../utils/nodeUtils';
import { ToolSchemaBuilder } from './console/ToolSchemaBuilder';

const nodeTypeColors: Record<PromptNodeType, string> = {
  [PromptNodeType.STATIC]: 'bg-gray-100 text-gray-700 border-gray-300',
  [PromptNodeType.ORCHESTRATOR]: 'bg-purple-100 text-purple-800 border-purple-400',
  [PromptNodeType.SUBAGENT]: 'bg-blue-100 text-blue-800 border-blue-400',
  [PromptNodeType.TOOL]: 'bg-emerald-100 text-emerald-800 border-emerald-400',
  [PromptNodeType.SKILL]: 'bg-amber-100 text-amber-800 border-amber-400',
  [PromptNodeType.NATIVE_CAPABILITY]: 'bg-cyan-100 text-cyan-800 border-cyan-400',
  [PromptNodeType.SYSTEM_INSTRUCTION]: 'bg-indigo-100 text-indigo-800 border-indigo-400',
  [PromptNodeType.FUNCTION]: 'bg-pink-100 text-pink-800 border-pink-400',
};

const invocationStrategyDescriptions: Record<InvocationStrategy, string> = {
  [InvocationStrategy.ALWAYS_LOADED]: 'Loaded in the main system prompt at all times',
  [InvocationStrategy.ON_DEMAND]: 'Loaded dynamically when requested via load_skill()',
  [InvocationStrategy.FUNCTION_CALL]: 'Invoked as a function/tool call',
  [InvocationStrategy.CONDITIONAL]: 'Loaded based on runtime conditions',
  [InvocationStrategy.IMPLICIT]: 'Triggered automatically by keyword detection',
  [InvocationStrategy.MANUAL]: 'Requires explicit user or system action',
};

interface EditState {
  title: string;
  content: string;
  category: PromptCategory;
  nodeType?: PromptNodeType;
  invocationStrategy?: InvocationStrategy;
  altitude?: PromptAltitude;
  scope?: PromptScope;
  contextPriority?: number;
  triggers?: string;
  capabilities?: string;
  catalogSummary?: string;
  model?: string;
  toolSchema?: ToolSchema;
}

export const NodeDetailsPanel: React.FC = () => {
  const { selectedNodeId, nodes, setSelectedNode, updateNode, updateNodeMetadata, deleteNode } = useOntologyStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const node = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  useEffect(() => {
    if (node && !isEditing) {
      // Initialize edit state from node
      setEditState({
        title: node.title,
        content: node.content,
        category: node.category,
        nodeType: node.nodeType,
        invocationStrategy: node.invocationStrategy,
        altitude: node.altitude,
        scope: node.scope,
        contextPriority: node.contextPriority,
        triggers: node.agentMetadata?.triggers?.join(', '),
        capabilities: node.agentMetadata?.capabilities?.join(', '),
        catalogSummary: node.agentMetadata?.catalogSummary,
        model: node.agentMetadata?.model,
        toolSchema: node.agentMetadata?.toolSchema
      });
      setErrors([]);
    }
  }, [node, isEditing]);

  if (!selectedNodeId || !node) return null;

  const hasAgentMetadata = node.nodeType || node.agentMetadata;

  const handleSave = () => {
    if (!editState) return;

    // Build updated node
    const updates: any = {
      title: editState.title,
      content: editState.content,
      category: editState.category,
      nodeType: editState.nodeType,
      invocationStrategy: editState.invocationStrategy,
      altitude: editState.altitude,
      scope: editState.scope,
      contextPriority: editState.contextPriority,
      estimatedTokens: Math.ceil(editState.content.length / 4)
    };

    // Build agent metadata updates
    if (editState.nodeType || node.agentMetadata) {
      const metadataUpdates: any = {
        nodeType: editState.nodeType || PromptNodeType.STATIC,
        invocationStrategy: editState.invocationStrategy || InvocationStrategy.ALWAYS_LOADED,
        triggers: editState.triggers ? editState.triggers.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        capabilities: editState.capabilities ? editState.capabilities.split(',').map(c => c.trim()).filter(Boolean) : undefined,
        catalogSummary: editState.catalogSummary || undefined,
        model: editState.model || undefined,
        toolSchema: editState.toolSchema
      };

      updateNodeMetadata(node.id, metadataUpdates);
    }

    // Validate
    const updatedNode = { ...node, ...updates };
    const validation = validateNodeData(updatedNode);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Save
    updateNode(node.id, updates);
    setIsEditing(false);
    setErrors([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors([]);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${node.title}"?`)) {
      deleteNode(node.id);
      setSelectedNode(null);
    }
  };

  const updateEditField = <K extends keyof EditState>(field: K, value: EditState[K]) => {
    if (!editState) return;
    setEditState({ ...editState, [field]: value });
    setErrors([]);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-30 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Node Details</h2>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-500/30 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-1 hover:bg-green-500/30 rounded transition-colors"
                title="Save"
              >
                <Save size={18} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-red-500/30 rounded transition-colors"
                title="Cancel"
              >
                <XCircle size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-sm font-semibold text-red-800 mb-1">Validation Errors:</p>
          <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title & Category */}
        <div className="px-6 py-4 border-b border-gray-200">
          {isEditing && editState ? (
            <>
              <input
                type="text"
                value={editState.title}
                onChange={(e) => updateEditField('title', e.target.value)}
                className="w-full text-xl font-semibold text-gray-900 mb-2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                maxLength={100}
              />
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-500" />
                <select
                  value={editState.category}
                  onChange={(e) => updateEditField('category', e.target.value as PromptCategory)}
                  className="text-sm text-gray-600 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  {Object.values(PromptCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{node.title}</h3>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-500" />
                <span className="text-sm text-gray-600">{node.category}</span>
              </div>
            </>
          )}
        </div>

        {/* Agent Type & Invocation */}
        {(hasAgentMetadata || isEditing) && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap size={16} />
              Agent Configuration
            </h4>

            {isEditing && editState ? (
              <>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Node Type</p>
                  <select
                    value={editState.nodeType || PromptNodeType.STATIC}
                    onChange={(e) => updateEditField('nodeType', e.target.value as PromptNodeType)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.values(PromptNodeType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Invocation Strategy</p>
                  <select
                    value={editState.invocationStrategy || InvocationStrategy.ALWAYS_LOADED}
                    onChange={(e) => updateEditField('invocationStrategy', e.target.value as InvocationStrategy)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.values(InvocationStrategy).map(strategy => (
                      <option key={strategy} value={strategy}>
                        {strategy.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Model</p>
                  <input
                    type="text"
                    value={editState.model || ''}
                    onChange={(e) => updateEditField('model', e.target.value)}
                    placeholder="e.g., gpt-4, claude-3"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                {node.nodeType && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Node Type</p>
                    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded border ${nodeTypeColors[node.nodeType]}`}>
                      {node.nodeType}
                    </span>
                  </div>
                )}

                {node.invocationStrategy && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Invocation Strategy</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {node.invocationStrategy.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {invocationStrategyDescriptions[node.invocationStrategy]}
                      </p>
                    </div>
                  </div>
                )}

                {node.agentMetadata?.model && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Model</p>
                    <span className="inline-block text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded border border-indigo-200 font-mono">
                      {node.agentMetadata.model}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
          {isEditing && editState ? (
            <textarea
              value={editState.content}
              onChange={(e) => updateEditField('content', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
              rows={8}
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{node.content}</p>
          )}
        </div>

        {/* Tool Schema */}
        {((node.agentMetadata?.toolSchema || isEditing) && (editState?.nodeType === PromptNodeType.TOOL || editState?.nodeType === PromptNodeType.FUNCTION || node.agentMetadata?.toolSchema)) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Code size={16} />
              Tool Schema
            </h4>

            {isEditing && editState ? (
              <ToolSchemaBuilder
                schema={editState.toolSchema}
                onChange={(schema) => updateEditField('toolSchema', schema)}
              />
            ) : node.agentMetadata?.toolSchema ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Function Name</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                    {node.agentMetadata.toolSchema.name}
                  </code>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">
                    {node.agentMetadata.toolSchema.description}
                  </p>
                </div>

                {node.agentMetadata.toolSchema.parameters && node.agentMetadata.toolSchema.parameters.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Parameters</p>
                    <div className="space-y-2">
                      {node.agentMetadata.toolSchema.parameters.map((param, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-sm font-mono font-semibold text-gray-900">
                              {param.name}
                            </code>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {param.type}
                              </span>
                              {param.required && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  required
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Capabilities */}
        {((node.agentMetadata?.capabilities && node.agentMetadata.capabilities.length > 0) || isEditing) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings size={16} />
              Capabilities
            </h4>
            {isEditing && editState ? (
              <>
                <input
                  type="text"
                  value={editState.capabilities || ''}
                  onChange={(e) => updateEditField('capabilities', e.target.value)}
                  placeholder="e.g., search, analysis, retrieval"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {node.agentMetadata?.capabilities?.map((cap, idx) => (
                  <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trigger Keywords */}
        {((node.agentMetadata?.triggers && node.agentMetadata.triggers.length > 0) || (isEditing && editState?.nodeType === PromptNodeType.SKILL)) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Trigger Keywords</h4>
            {isEditing && editState ? (
              <>
                <input
                  type="text"
                  value={editState.triggers || ''}
                  onChange={(e) => updateEditField('triggers', e.target.value)}
                  placeholder="e.g., email, respond, communication"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated keywords</p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  This skill is activated when these keywords appear:
                </p>
                <div className="flex flex-wrap gap-2">
                  {node.agentMetadata?.triggers?.map((trigger, idx) => (
                    <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 font-mono">
                      {trigger}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Catalog Summary */}
        {(node.agentMetadata?.catalogSummary || isEditing) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Catalog Summary</h4>
            {isEditing && editState ? (
              <input
                type="text"
                value={editState.catalogSummary || ''}
                onChange={(e) => updateEditField('catalogSummary', e.target.value)}
                placeholder="Brief description for catalog"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-600 italic">
                "{node.agentMetadata?.catalogSummary}"
              </p>
            )}
          </div>
        )}

        {/* Hierarchy */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Hash size={16} />
            Hierarchy
          </h4>
          <div className="space-y-2">
            {isEditing && editState ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Altitude</p>
                  <select
                    value={editState.altitude || PromptAltitude.TACTICAL}
                    onChange={(e) => updateEditField('altitude', e.target.value as PromptAltitude)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.values(PromptAltitude).map(alt => (
                      <option key={alt} value={alt}>{alt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Scope</p>
                  <select
                    value={editState.scope || PromptScope.TASK}
                    onChange={(e) => updateEditField('scope', e.target.value as PromptScope)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.values(PromptScope).map(scope => (
                      <option key={scope} value={scope}>{scope}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Context Priority: {editState.contextPriority || 50}</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editState.contextPriority || 50}
                    onChange={(e) => updateEditField('contextPriority', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Altitude</p>
                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {node.altitude}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Scope</p>
                  <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                    {node.scope}
                  </span>
                </div>
                {node.estimatedTokens && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated Tokens</p>
                    <span className="text-sm font-mono text-gray-900">
                      {node.estimatedTokens.toLocaleString()}
                    </span>
                  </div>
                )}
                {node.contextPriority !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Context Priority</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${node.contextPriority}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                        {node.contextPriority}%
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
