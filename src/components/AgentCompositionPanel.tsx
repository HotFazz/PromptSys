import { Network, Users, Wrench, Sparkles, Cpu, ChevronRight } from 'lucide-react';
import { useOntologyStore } from '../stores/ontologyStore';
import { PromptNodeType, AgentRelationType } from '../types';
import { AgentCompositionAnalyzer } from '../services/agentServices';

const nodeTypeIcons: Record<PromptNodeType, typeof Network> = {
  [PromptNodeType.STATIC]: Network,
  [PromptNodeType.ORCHESTRATOR]: Network,
  [PromptNodeType.SUBAGENT]: Users,
  [PromptNodeType.TOOL]: Wrench,
  [PromptNodeType.SKILL]: Sparkles,
  [PromptNodeType.NATIVE_CAPABILITY]: Cpu,
  [PromptNodeType.SYSTEM_INSTRUCTION]: Network,
  [PromptNodeType.FUNCTION]: Wrench,
};

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

const relationshipLabels: Record<AgentRelationType, string> = {
  [AgentRelationType.ORCHESTRATES]: 'orchestrates',
  [AgentRelationType.DELEGATES_TO]: 'delegates to',
  [AgentRelationType.USES_TOOL]: 'uses',
  [AgentRelationType.LOADS_SKILL]: 'loads',
  [AgentRelationType.DEPENDS_ON]: 'depends on',
  [AgentRelationType.FALLBACK_TO]: 'falls back to',
  [AgentRelationType.CALLS_FUNCTION]: 'calls',
  [AgentRelationType.PROVIDES_CONTEXT]: 'provides context to',
};

export const AgentCompositionPanel: React.FC = () => {
  const { nodes, edges, setSelectedNode } = useOntologyStore();

  // Analyze agent composition
  const composition = AgentCompositionAnalyzer.analyzeComposition(nodes, edges);

  // Early return if no composition found
  if (!composition) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Network size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orchestrator Found</h3>
        <p className="text-sm text-gray-600">
          Load the agentic demo to see agent composition visualization.
        </p>
      </div>
    );
  }

  // Get orchestrator node
  const orchestratorNode = nodes.find(n => n.id === composition.orchestrator);

  // Get agent nodes
  const subagentNodes = composition.subagents.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  const toolNodes = composition.tools.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  const skillNodes = composition.skills.map(id => nodes.find(n => n.id === id)).filter(Boolean);

  if (!orchestratorNode) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Network size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Orchestrator Node Not Found</h3>
        <p className="text-sm text-gray-600">
          The orchestrator node could not be found in the graph.
        </p>
      </div>
    );
  }

  // Group relationships by source
  const relationshipsBySource = new Map<string, typeof composition.relationships>();
  composition.relationships.forEach(rel => {
    if (!relationshipsBySource.has(rel.from)) {
      relationshipsBySource.set(rel.from, []);
    }
    relationshipsBySource.get(rel.from)!.push(rel);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Network size={32} />
          <div>
            <h2 className="text-2xl font-bold">Agent Composition</h2>
            <p className="text-purple-100 text-sm mt-1">
              Hierarchical view of orchestrator, agents, tools, and skills
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-purple-100 text-xs mb-1">Sub-Agents</p>
            <p className="text-2xl font-bold">{subagentNodes.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-purple-100 text-xs mb-1">Tools</p>
            <p className="text-2xl font-bold">{toolNodes.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-purple-100 text-xs mb-1">Skills</p>
            <p className="text-2xl font-bold">{skillNodes.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-purple-100 text-xs mb-1">Relationships</p>
            <p className="text-2xl font-bold">{composition.relationships.length}</p>
          </div>
        </div>
      </div>

      {/* Composition Tree */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Orchestrator */}
        <div className="mb-6">
          <div
            className="bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-400 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedNode(orchestratorNode.id)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 text-white rounded-lg">
                <Network size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-purple-900">{orchestratorNode.title}</h3>
                  <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-semibold">
                    ORCHESTRATOR
                  </span>
                </div>
                <p className="text-sm text-purple-700">
                  {orchestratorNode.agentMetadata?.capabilities?.join(', ') || 'Main coordinating agent'}
                </p>
              </div>
              {orchestratorNode.agentMetadata?.model && (
                <span className="text-xs bg-white text-purple-700 px-3 py-1 rounded border border-purple-300 font-mono">
                  {orchestratorNode.agentMetadata.model}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Agents */}
        {subagentNodes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users size={16} />
              Sub-Agents ({subagentNodes.length})
            </h4>
            <div className="space-y-3 pl-8 border-l-2 border-purple-300">
              {subagentNodes.map((agent) => {
                const Icon = nodeTypeIcons[agent!.nodeType || PromptNodeType.SUBAGENT];
                const relationships = relationshipsBySource.get(agent!.id) || [];

                return (
                  <div key={agent!.id}>
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${nodeTypeColors[agent!.nodeType || PromptNodeType.SUBAGENT]}`}
                      onClick={() => setSelectedNode(agent!.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={20} className="mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{agent!.title}</h5>
                          <p className="text-xs opacity-80 mb-2">
                            {agent!.agentMetadata?.toolSchema?.description || agent!.content.substring(0, 80) + '...'}
                          </p>

                          {/* Relationships from this agent */}
                          {relationships.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <p className="text-xs opacity-60 mb-1">Uses:</p>
                              <div className="flex flex-wrap gap-1">
                                {relationships.map((rel, idx) => {
                                  const targetNode = nodes.find(n => n.id === rel.to);
                                  if (!targetNode) return null;

                                  return (
                                    <span
                                      key={idx}
                                      className="text-xs bg-white/50 px-2 py-0.5 rounded flex items-center gap-1"
                                      title={relationshipLabels[rel.type]}
                                    >
                                      {targetNode.title}
                                      {rel.type === AgentRelationType.USES_TOOL && ' 🔧'}
                                      {rel.type === AgentRelationType.LOADS_SKILL && ' ✨'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        {agent!.agentMetadata?.model && (
                          <span className="text-xs bg-white px-2 py-1 rounded border font-mono">
                            {agent!.agentMetadata.model}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tools */}
        {toolNodes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Wrench size={16} />
              Tools ({toolNodes.length})
            </h4>
            <div className="grid grid-cols-2 gap-3 pl-8 border-l-2 border-emerald-300">
              {toolNodes.map((tool) => {
                const Icon = nodeTypeIcons[tool!.nodeType || PromptNodeType.TOOL];

                return (
                  <div
                    key={tool!.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${nodeTypeColors[tool!.nodeType || PromptNodeType.TOOL]}`}
                    onClick={() => setSelectedNode(tool!.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon size={16} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm truncate">{tool!.title}</h5>
                        <p className="text-xs opacity-70 mt-1 line-clamp-2">
                          {tool!.agentMetadata?.toolSchema?.description || tool!.content.substring(0, 60)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {skillNodes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Skills ({skillNodes.length}) - On-Demand
            </h4>
            <div className="grid grid-cols-3 gap-3 pl-8 border-l-2 border-amber-300">
              {skillNodes.map((skill) => (
                <div
                  key={skill!.id}
                  className={`border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${nodeTypeColors[skill!.nodeType || PromptNodeType.SKILL]}`}
                  onClick={() => setSelectedNode(skill!.id)}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-xs truncate">{skill!.title}</h5>
                      {skill!.agentMetadata?.triggers && skill!.agentMetadata.triggers.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {skill!.agentMetadata.triggers.slice(0, 2).map((trigger, idx) => (
                            <span key={idx} className="text-xs bg-yellow-200 text-yellow-900 px-1 rounded">
                              {trigger}
                            </span>
                          ))}
                          {skill!.agentMetadata.triggers.length > 2 && (
                            <span className="text-xs text-gray-500">+{skill!.agentMetadata.triggers.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Relationship Map */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChevronRight size={20} />
          Relationship Map
        </h3>

        <div className="space-y-2">
          {composition.relationships.map((rel, idx) => {
            const fromNode = nodes.find(n => n.id === rel.from);
            const toNode = nodes.find(n => n.id === rel.to);

            if (!fromNode || !toNode) return null;

            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-sm text-gray-900">{fromNode.title}</span>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {relationshipLabels[rel.type]}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="font-medium text-sm text-gray-900">{toNode.title}</span>

                {rel.frequency !== undefined && (
                  <span className="ml-auto text-xs text-gray-500">
                    Used {rel.frequency} times
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Understanding Agent Composition</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Orchestrator:</strong> The main coordinating agent that manages task planning
            and delegates to specialized sub-agents.
          </div>
          <div>
            <strong>Sub-Agents:</strong> Specialized agents with specific capabilities (e.g., research,
            data analysis) invoked by the orchestrator.
          </div>
          <div>
            <strong>Tools:</strong> External APIs, functions, or native capabilities used by agents
            to perform specific operations.
          </div>
          <div>
            <strong>Skills:</strong> On-demand capabilities loaded only when needed, triggered by
            keywords or explicit requests.
          </div>
        </div>
      </div>
    </div>
  );
};
