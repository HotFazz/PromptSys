import { useEffect, useState } from 'react';
import { SidePanel } from './components/SidePanel';
import { OntologyGraph } from './components/OntologyGraph';
import { HierarchyTree } from './components/HierarchyTree';
import { ContextBudgetPanel } from './components/ContextBudgetPanel';
import { NodeDetailsPanel } from './components/NodeDetailsPanel';
import { useOntologyStore } from './stores/ontologyStore';
import { ConflictDetector } from './utils/conflictDetector';

type ViewMode = 'graph' | 'tree' | 'budget';

function App() {
  const { nodes, edges, setConflicts } = useOntologyStore();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  // Run conflict detection whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 0) {
      const detectedConflicts = ConflictDetector.detectConflicts(nodes, edges);
      setConflicts(detectedConflicts);
    }
  }, [nodes, edges, setConflicts]);

  return (
    <div className="h-screen w-screen flex bg-gray-100">
      <SidePanel />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PromptSys</h1>
              <p className="text-sm text-gray-600 mt-1">
                System Prompts Ontology Designer & Analyzer
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {nodes.length} Node{nodes.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {edges.length} Connection{edges.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* View tabs */}
          {nodes.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-6 flex gap-1">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`
                    px-4 py-2 text-sm font-medium transition-colors relative
                    ${viewMode === 'graph'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Graph View
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`
                    px-4 py-2 text-sm font-medium transition-colors relative
                    ${viewMode === 'tree'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Hierarchy Tree
                </button>
                <button
                  onClick={() => setViewMode('budget')}
                  className={`
                    px-4 py-2 text-sm font-medium transition-colors relative
                    ${viewMode === 'budget'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Context Budget
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome to PromptSys
                </h2>
                <p className="text-gray-600 mb-6">
                  Build, analyze, and visualize your AI system prompts as an interactive ontology.
                  Get started by pasting or uploading your prompts in the side panel.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Quick Start:</h3>
                  <ol className="text-left text-sm text-blue-800 space-y-1">
                    <li>1. Enter your OpenAI API key in the side panel</li>
                    <li>2. Paste or upload your system prompts</li>
                    <li>3. Click "Analyze" to generate the ontology</li>
                    <li>4. Edit nodes and connections directly in the graph</li>
                    <li>5. Conflicts will be detected and highlighted automatically</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'graph' && <OntologyGraph />}
              {viewMode === 'tree' && <HierarchyTree />}
              {viewMode === 'budget' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <ContextBudgetPanel />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Node Details Panel */}
      <NodeDetailsPanel />
    </div>
  );
}

export default App;
