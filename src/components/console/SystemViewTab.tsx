import { useState, useMemo } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronRight,
  FileText,
  Code
} from 'lucide-react';
import { useOntologyStore } from '../../stores/ontologyStore';
import { assembleSystem, copyToClipboard, AssembledSystem } from '../../utils/systemAssembler';

type ViewMode = 'assembled' | 'tree' | 'catalog' | 'functions';

export const SystemViewTab: React.FC = () => {
  const { nodes } = useOntologyStore();
  const [viewMode, setViewMode] = useState<ViewMode>('assembled');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['orchestrators', 'skills']));

  const assembled: AssembledSystem = useMemo(() => {
    return assembleSystem(nodes);
  }, [nodes]);

  const handleCopy = async (text: string, section: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (nodes.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <FileCode size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No System Defined</h3>
          <p className="text-sm text-gray-400">
            Create or import agents to view the assembled system prompt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      <div>
        <h3 className="text-lg font-semibold text-white">System View</h3>
        <p className="text-sm text-gray-400 mt-1">
          View and export your assembled system prompt
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setViewMode('assembled')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'assembled'
              ? 'text-blue-400 border-blue-500'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Assembled Prompt
        </button>
        <button
          onClick={() => setViewMode('tree')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'tree'
              ? 'text-blue-400 border-blue-500'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          System Tree
        </button>
        <button
          onClick={() => setViewMode('catalog')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'catalog'
              ? 'text-blue-400 border-blue-500'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          Skills Catalog
        </button>
        <button
          onClick={() => setViewMode('functions')}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'functions'
              ? 'text-blue-400 border-blue-500'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          OpenAI Functions
        </button>
      </div>

      {/* Assembled Prompt View */}
      {viewMode === 'assembled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Complete system prompt ready to use
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(assembled.mainPrompt, 'main')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
              >
                {copiedSection === 'main' ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownload(assembled.mainPrompt, 'system-prompt.md')}
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors flex items-center"
              >
                <Download size={14} className="mr-1" />
                Download
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {assembled.mainPrompt}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{assembled.orchestrators.length}</div>
              <div className="text-gray-400">Orchestrators</div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{assembled.subagents.length}</div>
              <div className="text-gray-400">Sub-Agents</div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{assembled.skills.length}</div>
              <div className="text-gray-400">Skills</div>
            </div>
          </div>
        </div>
      )}

      {/* System Tree View */}
      {viewMode === 'tree' && (
        <div className="space-y-3">
          {/* Orchestrators */}
          {assembled.orchestrators.length > 0 && (
            <div className="border border-gray-700 rounded-lg bg-gray-800/50">
              <button
                onClick={() => toggleSection('orchestrators')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center">
                  {expandedSections.has('orchestrators') ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="ml-2 font-medium text-white">
                    Orchestrators ({assembled.orchestrators.length})
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                  Always Loaded
                </span>
              </button>
              {expandedSections.has('orchestrators') && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {assembled.orchestrators.map(node => (
                    <div key={node.id} className="p-3 bg-gray-900 rounded border border-gray-700">
                      <div className="font-medium text-white mb-1">{node.title}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{node.content}</div>
                      {node.agentMetadata?.capabilities && (
                        <div className="mt-2 text-xs text-gray-500">
                          Capabilities: {node.agentMetadata.capabilities.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Agents */}
          {assembled.subagents.length > 0 && (
            <div className="border border-gray-700 rounded-lg bg-gray-800/50">
              <button
                onClick={() => toggleSection('subagents')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center">
                  {expandedSections.has('subagents') ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="ml-2 font-medium text-white">
                    Sub-Agents ({assembled.subagents.length})
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-purple-900 text-purple-200 text-xs rounded">
                  Function Call
                </span>
              </button>
              {expandedSections.has('subagents') && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {assembled.subagents.map(node => (
                    <div key={node.id} className="p-3 bg-gray-900 rounded border border-gray-700">
                      <div className="font-medium text-white mb-1">{node.title}</div>
                      {node.agentMetadata?.toolSchema && (
                        <div className="text-xs text-green-400 mb-1">
                          ✓ Function: {node.agentMetadata.toolSchema.name}()
                        </div>
                      )}
                      <div className="text-xs text-gray-400 line-clamp-2">{node.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {assembled.skills.length > 0 && (
            <div className="border border-gray-700 rounded-lg bg-gray-800/50">
              <button
                onClick={() => toggleSection('skills')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center">
                  {expandedSections.has('skills') ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="ml-2 font-medium text-white">
                    Skills ({assembled.skills.length})
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-green-900 text-green-200 text-xs rounded">
                  On Demand
                </span>
              </button>
              {expandedSections.has('skills') && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {assembled.skills.map(node => (
                    <div key={node.id} className="p-3 bg-gray-900 rounded border border-gray-700">
                      <div className="font-medium text-white mb-1">{node.title}</div>
                      {node.agentMetadata?.triggers && (
                        <div className="text-xs text-yellow-400 mb-1">
                          Triggers: {node.agentMetadata.triggers.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 line-clamp-2">
                        {node.agentMetadata?.catalogSummary || node.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tools */}
          {assembled.tools.length > 0 && (
            <div className="border border-gray-700 rounded-lg bg-gray-800/50">
              <button
                onClick={() => toggleSection('tools')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center">
                  {expandedSections.has('tools') ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="ml-2 font-medium text-white">
                    Tools & Functions ({assembled.tools.length})
                  </span>
                </div>
              </button>
              {expandedSections.has('tools') && (
                <div className="p-3 border-t border-gray-700 space-y-2">
                  {assembled.tools.map(node => (
                    <div key={node.id} className="p-3 bg-gray-900 rounded border border-gray-700">
                      <div className="font-medium text-white mb-1">{node.title}</div>
                      {node.agentMetadata?.toolSchema && (
                        <div className="text-xs text-green-400 mb-1">
                          ✓ Schema: {node.agentMetadata.toolSchema.name}()
                        </div>
                      )}
                      <div className="text-xs text-gray-400 line-clamp-2">{node.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills Catalog View */}
      {viewMode === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Compact skills catalog for context efficiency
            </div>
            <button
              onClick={() => handleCopy(assembled.skillsCatalog, 'catalog')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
            >
              {copiedSection === 'catalog' ? (
                <>
                  <Check size={14} className="mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {assembled.skillsCatalog || 'No skills defined'}
            </pre>
          </div>
        </div>
      )}

      {/* OpenAI Functions View */}
      {viewMode === 'functions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              OpenAI function definitions for tool calling
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(JSON.stringify(assembled.openAIFunctions, null, 2), 'functions')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
              >
                {copiedSection === 'functions' ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy JSON
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownload(JSON.stringify(assembled.openAIFunctions, null, 2), 'functions.json')}
                className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-600 transition-colors flex items-center"
              >
                <Download size={14} className="mr-1" />
                Download
              </button>
            </div>
          </div>

          {assembled.openAIFunctions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No function-callable agents defined
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {JSON.stringify(assembled.openAIFunctions, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Export Section */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
        <h4 className="font-semibold text-white mb-3">Export System</h4>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload(assembled.markdown, 'system-export.md')}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <FileText size={16} className="mr-1" />
            Export as Markdown
          </button>
          <button
            onClick={() => handleDownload(assembled.json, 'system-export.json')}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Code size={16} className="mr-1" />
            Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
};
