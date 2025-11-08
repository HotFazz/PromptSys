import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useOntologyStore } from '../stores/ontologyStore';
import { getOpenAIService } from '../services/openaiService';

export const SidePanel: React.FC = () => {
  const { isSidePanelOpen, toggleSidePanel, isAnalyzing, setIsAnalyzing, loadOntology, nodes, edges } = useOntologyStore();
  const [content, setContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const service = getOpenAIService();
      service.setApiKey(apiKey);

      const analysis = await service.analyzePrompts({
        content,
        existingOntology: nodes.length > 0 ? {
          nodes,
          edges,
          conflicts: [],
          suggestions: [],
          metadata: {
            totalTokens: 0,
            nodeCount: nodes.length,
            edgeCount: edges.length,
            analyzedAt: new Date()
          }
        } : undefined,
        options: {
          detectConflicts: true,
          suggestConnections: true,
          categorize: true
        }
      });

      // Transform AI response to ontology format
      const newNodes = analysis.nodes.map((node, index) => ({
        id: `node-${Date.now()}-${index}`,
        ...node,
        position: { x: Math.random() * 500, y: Math.random() * 500 }
      }));

      // Map node titles to IDs for edges
      const titleToId = new Map(newNodes.map(n => [n.title, n.id]));

      const newEdges = analysis.edges
        .filter(edge => titleToId.has(edge.source) && titleToId.has(edge.target))
        .map((edge, index) => ({
          id: `edge-${Date.now()}-${index}`,
          source: titleToId.get(edge.source)!,
          target: titleToId.get(edge.target)!,
          type: edge.type,
          label: edge.label
        }));

      // Auto-layout
      const positions = await service.suggestLayout(newNodes, newEdges);
      newNodes.forEach(node => {
        const pos = positions.get(node.id);
        if (pos) {
          node.position = pos;
        }
      });

      // Update conflicts with actual node IDs
      const conflicts = analysis.conflicts.map(conflict => ({
        ...conflict,
        nodeIds: conflict.nodeIds
          .map(title => titleToId.get(title))
          .filter((id): id is string => id !== undefined)
      }));

      loadOntology({
        nodes: [...nodes, ...newNodes],
        edges: [...edges, ...newEdges],
        conflicts,
        suggestions: analysis.suggestions,
        metadata: {
          totalTokens: 0,
          nodeCount: newNodes.length,
          edgeCount: newEdges.length,
          analyzedAt: new Date()
        }
      });

      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        onClick={toggleSidePanel}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors"
        style={{ left: isSidePanelOpen ? '400px' : '0' }}
      >
        {isSidePanelOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white shadow-2xl transition-transform duration-300 z-40 ${
          isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '400px' }}
      >
        <div className="h-full flex flex-col p-6">
          <h2 className="text-2xl font-bold mb-6">System Prompts Analysis</h2>

          {/* API Key Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Your key is stored locally and never sent to our servers</p>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload size={20} className="mr-2" />
              <span>Upload Markdown File</span>
              <input
                id="file-upload"
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Text Input */}
          <div className="flex-1 flex flex-col mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center">
              <FileText size={16} className="mr-2" />
              Paste or type your system prompt
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your system prompt here... Supports markdown formatting."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim() || !apiKey.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Prompts'
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Enter your OpenAI API key</li>
              <li>Paste or upload your system prompts</li>
              <li>Click "Analyze" to generate the ontology</li>
              <li>View and edit the graph in the main panel</li>
              <li>Conflicts will be highlighted automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};
