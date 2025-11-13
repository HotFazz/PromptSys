import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, Code, Download } from 'lucide-react';
import { useOntologyStore } from '../../stores/ontologyStore';
import {
  parseImport,
  parseMarkdown,
  parseJSON,
  generateMarkdownTemplate,
  generateJSONTemplate,
  ParseResult
} from '../../utils/importParsers';
import { validateNodeData } from '../../utils/nodeUtils';

type Format = 'auto' | 'markdown' | 'json';

export const BulkImportTab: React.FC = () => {
  const { bulkCreateNodes, nodes: existingNodes } = useOntologyStore();
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<Format>('auto');
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleParse = () => {
    setErrors([]);
    setPreview(null);
    setSuccess(false);

    if (!content.trim()) {
      setErrors(['Please enter content to import']);
      return;
    }

    let result: ParseResult;

    try {
      switch (format) {
        case 'markdown':
          result = parseMarkdown(content);
          break;
        case 'json':
          result = parseJSON(content);
          break;
        default:
          result = parseImport(content);
      }

      // Validate all nodes
      const validationErrors: string[] = [...result.errors];
      result.nodes.forEach((node) => {
        const validation = validateNodeData(node);
        if (!validation.valid) {
          validationErrors.push(`"${node.title}": ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
      }

      setPreview(result);
      setShowPreview(true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to parse content']);
    }
  };

  const handleImport = () => {
    if (!preview || preview.nodes.length === 0) {
      setErrors(['No agents to import']);
      return;
    }

    // Auto-layout the nodes
    const layoutNodes = preview.nodes.map((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...node,
        position: {
          x: col * 450,
          y: row * 300 + (existingNodes.length > 0 ? 500 : 0)
        }
      };
    });

    bulkCreateNodes(layoutNodes, preview.edges);

    setSuccess(true);
    setContent('');
    setPreview(null);
    setShowPreview(false);
    setErrors([]);

    // Clear success after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);

      // Auto-detect format based on file extension
      if (file.name.endsWith('.json')) {
        setFormat('json');
      } else if (file.name.endsWith('.md')) {
        setFormat('markdown');
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (templateFormat: 'markdown' | 'json') => {
    const template = templateFormat === 'markdown'
      ? generateMarkdownTemplate()
      : generateJSONTemplate();

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFormat === 'markdown' ? 'template.md' : 'template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      <div>
        <h3 className="text-lg font-semibold text-white">Bulk Import Agents</h3>
        <p className="text-sm text-gray-400 mt-1">
          Import multiple agents at once from Markdown or JSON format
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2 text-green-400" />
          <span className="text-sm text-green-200">
            Successfully imported {preview?.nodes.length || 0} agent(s)!
          </span>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start mb-2">
            <AlertCircle size={20} className="mr-2 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-semibold text-red-200">Errors:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-200 ml-6 space-y-1 max-h-40 overflow-y-auto">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFormat('auto')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              format === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Auto-detect
          </button>
          <button
            onClick={() => setFormat('markdown')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              format === 'markdown'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <FileText size={16} className="mr-1" />
            Markdown
          </button>
          <button
            onClick={() => setFormat('json')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              format === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Code size={16} className="mr-1" />
            JSON
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label
          htmlFor="bulk-file-upload"
          className="flex items-center justify-center w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload size={20} className="mr-2" />
          <span>Upload File (.md or .json)</span>
          <input
            id="bulk-file-upload"
            type="file"
            accept=".md,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Paste Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Paste your ${format === 'markdown' ? 'Markdown' : format === 'json' ? 'JSON' : 'Markdown or JSON'} content here...`}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
          rows={12}
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length} characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleParse}
          disabled={!content.trim()}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          Parse & Preview
        </button>
        {preview && preview.nodes.length > 0 && errors.length === 0 && (
          <button
            onClick={handleImport}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Import {preview.nodes.length} Agent(s)
          </button>
        )}
      </div>

      {/* Preview */}
      {showPreview && preview && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
          <h4 className="font-semibold text-white mb-3">Preview</h4>

          {preview.nodes.length === 0 ? (
            <p className="text-sm text-gray-400">No agents found in content</p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                Found {preview.nodes.length} agent(s) and {preview.edges.length} relationship(s)
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {preview.nodes.map((node, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-900 rounded border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-white">{node.title}</div>
                      <div className="flex gap-1">
                        <span className="px-2 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                          {node.nodeType}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-900 text-purple-200 text-xs rounded">
                          {node.invocationStrategy}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2">
                      {node.content}
                    </div>
                    {node.agentMetadata?.triggers && (
                      <div className="text-xs text-gray-500 mt-2">
                        Triggers: {node.agentMetadata.triggers.join(', ')}
                      </div>
                    )}
                    {node.agentMetadata?.toolSchema && (
                      <div className="text-xs text-green-400 mt-2">
                        ✓ Tool schema defined
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
        <h4 className="font-semibold text-white mb-3">Download Templates</h4>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate('markdown')}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Download size={16} className="mr-1" />
            Markdown Template
          </button>
          <button
            onClick={() => downloadTemplate('json')}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Download size={16} className="mr-1" />
            JSON Template
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="p-4 bg-gray-800 rounded-lg text-sm">
        <h4 className="font-semibold text-white mb-2">How to use:</h4>
        <ol className="list-decimal list-inside space-y-1 text-gray-300">
          <li>Download a template to see the expected format</li>
          <li>Fill in your agents' details following the template structure</li>
          <li>Paste the content or upload a file</li>
          <li>Click "Parse & Preview" to validate</li>
          <li>Review the preview and fix any errors</li>
          <li>Click "Import" to add agents to your ontology</li>
        </ol>
      </div>
    </div>
  );
};
