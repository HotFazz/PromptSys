import { X, Tag, Zap, Code, Settings, Clock, Hash } from 'lucide-react';
import { PromptNodeType, InvocationStrategy } from '../types';
import { useOntologyStore } from '../stores/ontologyStore';

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

export const NodeDetailsPanel: React.FC = () => {
  const { selectedNodeId, nodes, setSelectedNode } = useOntologyStore();

  if (!selectedNodeId) return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const hasAgentMetadata = node.nodeType || node.agentMetadata;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-30 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Node Details</h2>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Title & Category */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{node.title}</h3>
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600">{node.category}</span>
          </div>
        </div>

        {/* Agent Type & Invocation */}
        {hasAgentMetadata && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap size={16} />
              Agent Configuration
            </h4>

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
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{node.content}</p>
        </div>

        {/* Tool Schema */}
        {node.agentMetadata?.toolSchema && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Code size={16} />
              Tool Schema
            </h4>

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
                        {param.default !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Default: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(param.default)}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capabilities */}
        {node.agentMetadata?.capabilities && node.agentMetadata.capabilities.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings size={16} />
              Capabilities
            </h4>
            <div className="flex flex-wrap gap-2">
              {node.agentMetadata.capabilities.map((cap, idx) => (
                <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Keywords (for skills) */}
        {node.agentMetadata?.triggers && node.agentMetadata.triggers.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Trigger Keywords</h4>
            <p className="text-xs text-gray-500 mb-2">
              This skill is activated when these keywords appear in the conversation:
            </p>
            <div className="flex flex-wrap gap-2">
              {node.agentMetadata.triggers.map((trigger, idx) => (
                <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200 font-mono">
                  {trigger}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Summary */}
        {node.agentMetadata?.catalogSummary && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Catalog Summary</h4>
            <p className="text-sm text-gray-600 italic">
              "{node.agentMetadata.catalogSummary}"
            </p>
          </div>
        )}

        {/* Tools Used */}
        {node.agentMetadata?.tools && node.agentMetadata.tools.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools Used</h4>
            <div className="space-y-1">
              {node.agentMetadata.tools.map((tool, idx) => (
                <div key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <code className="text-xs font-mono">{tool}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {(node.agentMetadata?.invocationCount !== undefined || node.agentMetadata?.avgLatencyMs !== undefined) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {node.agentMetadata.invocationCount !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invocations</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {node.agentMetadata.invocationCount.toLocaleString()}
                  </p>
                </div>
              )}
              {node.agentMetadata.avgLatencyMs !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Avg Latency</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {node.agentMetadata.avgLatencyMs}ms
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hierarchical Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Hash size={16} />
            Hierarchy
          </h4>
          <div className="space-y-2">
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
          </div>
        </div>

        {/* Metadata */}
        {Object.keys(node.metadata).length > 0 && (
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h4>
            <div className="space-y-1">
              {Object.entries(node.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 min-w-24">{key}:</span>
                  <span className="text-gray-700 flex-1 break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
