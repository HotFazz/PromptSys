import { useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Sparkles, Network } from 'lucide-react';
import { useOntologyStore } from '../../stores/ontologyStore';
import { getOpenAIService } from '../../services/openaiService';
import { generateDemoData } from '../../utils/demoData';
import { generateAgenticDemoData } from '../../utils/agenticDemoData';

export const AnalyzeTab: React.FC = () => {
  const { isAnalyzing, setIsAnalyzing, loadOntology, nodes, edges } = useOntologyStore();
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

  const handleLoadDemo = () => {
    const { nodes: demoNodes, edges: demoEdges } = generateDemoData();
    loadOntology({
      nodes: demoNodes,
      edges: demoEdges,
      conflicts: [],
      suggestions: ['This is demo data showing a customer support AI system prompt ontology'],
      metadata: {
        totalTokens: 0,
        nodeCount: demoNodes.length,
        edgeCount: demoEdges.length,
        analyzedAt: new Date()
      }
    });
    setError(null);
  };

  const handleLoadAgenticDemo = () => {
    const { nodes: demoNodes, edges: demoEdges } = generateAgenticDemoData();
    loadOntology({
      nodes: demoNodes,
      edges: demoEdges,
      conflicts: [],
      suggestions: [
        'This is agentic demo data showing a Customer Service Orchestrator system',
        'Includes 1 orchestrator, 3 sub-agents (Query, Order, Tech Support), 3 on-demand skills, and 1 CRM integration',
        'Demonstrates tool schemas, invocation strategies, and agent relationships'
      ],
      metadata: {
        totalTokens: 0,
        nodeCount: demoNodes.length,
        edgeCount: demoEdges.length,
        analyzedAt: new Date()
      }
    });
    setError(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Stored locally, never sent to our servers
        </p>
      </div>

      {/* File Upload */}
      <div>
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload size={18} className="mr-2" />
          <span className="text-sm">Upload Markdown File</span>
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
      <div className="flex flex-col">
        <label className="block text-sm font-medium mb-2 flex items-center">
          <FileText size={16} className="mr-2" />
          Paste your system prompt
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your system prompt here..."
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-sm h-40"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start">
          <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !content.trim() || !apiKey.trim()}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Prompts'
        )}
      </button>

      {/* Demo Data Buttons */}
      <div className="pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Or try demo data:</p>
        <div className="space-y-2">
          <button
            onClick={handleLoadDemo}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
          >
            <Sparkles size={18} className="mr-2" />
            Hierarchical Demo
          </button>

          <button
            onClick={handleLoadAgenticDemo}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
          >
            <Network size={18} className="mr-2" />
            Agentic Demo
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
        <h3 className="font-semibold mb-2 text-sm">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-300">
          <li>Try demo data to explore instantly</li>
          <li>Or enter your OpenAI API key</li>
          <li>Paste/upload your system prompts</li>
          <li>Click "Analyze" to generate ontology</li>
          <li>View and edit in the main panel</li>
        </ol>
      </div>
    </div>
  );
};
