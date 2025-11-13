import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useOntologyStore } from '../../stores/ontologyStore';
import {
  PromptNode,
  PromptCategory,
  PromptNodeType,
  InvocationStrategy,
  PromptAltitude,
  PromptScope,
  AgentMetadata,
  ToolSchema
} from '../../types';
import {
  generateNodeId,
  createBaseNode,
  validateNodeData,
  calculateNewNodePosition
} from '../../utils/nodeUtils';
import { ToolSchemaBuilder } from './ToolSchemaBuilder';

interface FormState {
  // Basic fields
  title: string;
  content: string;
  category: PromptCategory;

  // Node classification
  nodeType: PromptNodeType;
  invocationStrategy: InvocationStrategy;

  // Hierarchy
  altitude: PromptAltitude;
  scope: PromptScope;
  contextPriority: number;

  // Agent metadata
  triggers: string;
  catalogSummary: string;
  exampleUsage: string;
  capabilities: string;
  toolSchema?: ToolSchema;

  // Advanced
  model: string;
  temperature: number;
  maxTokens: number;
}

const initialFormState: FormState = {
  title: '',
  content: '',
  category: PromptCategory.UNCATEGORIZED,
  nodeType: PromptNodeType.STATIC,
  invocationStrategy: InvocationStrategy.ALWAYS_LOADED,
  altitude: PromptAltitude.TACTICAL,
  scope: PromptScope.TASK,
  contextPriority: 50,
  triggers: '',
  catalogSummary: '',
  exampleUsage: '',
  capabilities: '',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
};

export const CreateAgentTab: React.FC = () => {
  const { nodes, addNode } = useOntologyStore();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showToolSchema, setShowToolSchema] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors([]);
    setSuccess(false);
  };

  const handleNodeTypeChange = (nodeType: PromptNodeType) => {
    updateField('nodeType', nodeType);

    // Auto-set invocation strategy based on node type
    switch (nodeType) {
      case PromptNodeType.ORCHESTRATOR:
      case PromptNodeType.SYSTEM_INSTRUCTION:
        updateField('invocationStrategy', InvocationStrategy.ALWAYS_LOADED);
        break;
      case PromptNodeType.SKILL:
        updateField('invocationStrategy', InvocationStrategy.ON_DEMAND);
        break;
      case PromptNodeType.TOOL:
      case PromptNodeType.FUNCTION:
        updateField('invocationStrategy', InvocationStrategy.FUNCTION_CALL);
        setShowToolSchema(true);
        break;
      case PromptNodeType.SUBAGENT:
        updateField('invocationStrategy', InvocationStrategy.FUNCTION_CALL);
        break;
      default:
        updateField('invocationStrategy', InvocationStrategy.ALWAYS_LOADED);
    }
  };

  const handleCreate = () => {
    // Build the node object
    const baseNode = createBaseNode(
      formState.title,
      formState.content,
      formState.category
    );

    const agentMetadata: AgentMetadata = {
      nodeType: formState.nodeType,
      invocationStrategy: formState.invocationStrategy,
      triggers: formState.triggers ? formState.triggers.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      catalogSummary: formState.catalogSummary || undefined,
      exampleUsage: formState.exampleUsage || undefined,
      capabilities: formState.capabilities ? formState.capabilities.split(',').map(c => c.trim()).filter(Boolean) : undefined,
      toolSchema: formState.toolSchema,
      model: formState.model || undefined,
      temperature: formState.temperature,
      maxTokens: formState.maxTokens,
      availability: 'always',
      loadPriority: formState.contextPriority
    };

    const newNode: PromptNode = {
      ...baseNode,
      id: generateNodeId('agent'),
      altitude: formState.altitude,
      scope: formState.scope,
      contextPriority: formState.contextPriority,
      nodeType: formState.nodeType,
      invocationStrategy: formState.invocationStrategy,
      agentMetadata,
      position: calculateNewNodePosition(nodes, formState.nodeType)
    } as PromptNode;

    // Validate
    const validation = validateNodeData(newNode);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Add to store
    addNode(newNode);

    // Reset form and show success
    setFormState(initialFormState);
    setShowToolSchema(false);
    setShowAdvanced(false);
    setErrors([]);
    setSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const needsToolSchema =
    formState.nodeType === PromptNodeType.TOOL ||
    formState.nodeType === PromptNodeType.FUNCTION ||
    (formState.invocationStrategy === InvocationStrategy.FUNCTION_CALL &&
      (formState.nodeType === PromptNodeType.SUBAGENT || formState.nodeType === PromptNodeType.SKILL));

  const needsTriggers = formState.nodeType === PromptNodeType.SKILL;

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Create New Agent</h3>
          <p className="text-sm text-gray-400 mt-1">
            Add a new orchestrator, agent, skill, or tool to your system
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2 text-green-400" />
          <span className="text-sm text-green-200">Agent created successfully!</span>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start mb-2">
            <AlertCircle size={20} className="mr-2 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-semibold text-red-200">Validation Errors:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-200 ml-6 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formState.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., Customer Query Agent"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{formState.title.length}/100 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content / System Prompt <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formState.content}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Enter the agent's system prompt or description..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            Estimated tokens: ~{Math.ceil(formState.content.length / 4)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Node Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formState.nodeType}
              onChange={(e) => handleNodeTypeChange(e.target.value as PromptNodeType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value={PromptNodeType.STATIC}>Static Content</option>
              <option value={PromptNodeType.ORCHESTRATOR}>Orchestrator</option>
              <option value={PromptNodeType.SUBAGENT}>Sub-Agent</option>
              <option value={PromptNodeType.TOOL}>Tool</option>
              <option value={PromptNodeType.SKILL}>Skill</option>
              <option value={PromptNodeType.NATIVE_CAPABILITY}>Native Capability</option>
              <option value={PromptNodeType.SYSTEM_INSTRUCTION}>System Instruction</option>
              <option value={PromptNodeType.FUNCTION}>Function</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invocation Strategy
            </label>
            <select
              value={formState.invocationStrategy}
              onChange={(e) => updateField('invocationStrategy', e.target.value as InvocationStrategy)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value={InvocationStrategy.ALWAYS_LOADED}>Always Loaded</option>
              <option value={InvocationStrategy.ON_DEMAND}>On Demand</option>
              <option value={InvocationStrategy.FUNCTION_CALL}>Function Call</option>
              <option value={InvocationStrategy.CONDITIONAL}>Conditional</option>
              <option value={InvocationStrategy.IMPLICIT}>Implicit</option>
              <option value={InvocationStrategy.MANUAL}>Manual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={formState.category}
            onChange={(e) => updateField('category', e.target.value as PromptCategory)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {Object.values(PromptCategory).map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional: Triggers for Skills */}
        {needsTriggers && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Triggers <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formState.triggers}
              onChange={(e) => updateField('triggers', e.target.value)}
              placeholder="e.g., email, respond, customer, communication"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated keywords that activate this skill</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Catalog Summary</label>
          <input
            type="text"
            value={formState.catalogSummary}
            onChange={(e) => updateField('catalogSummary', e.target.value)}
            placeholder="Brief description for skills catalog"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Capabilities</label>
          <input
            type="text"
            value={formState.capabilities}
            onChange={(e) => updateField('capabilities', e.target.value)}
            placeholder="e.g., search, analysis, data retrieval"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated capabilities</p>
        </div>
      </div>

      {/* Tool Schema Builder */}
      {needsToolSchema && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
          <button
            onClick={() => setShowToolSchema(!showToolSchema)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              {showToolSchema ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="ml-2 font-medium text-white">
                Tool Schema {needsToolSchema && <span className="text-red-400">*</span>}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {formState.toolSchema ? '✓ Configured' : 'Not configured'}
            </span>
          </button>

          {showToolSchema && (
            <div className="mt-4">
              <ToolSchemaBuilder
                schema={formState.toolSchema}
                onChange={(schema) => updateField('toolSchema', schema)}
              />
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center w-full text-left"
        >
          {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="ml-2 font-medium text-white">Advanced Settings</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Altitude</label>
                <select
                  value={formState.altitude}
                  onChange={(e) => updateField('altitude', e.target.value as PromptAltitude)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.values(PromptAltitude).map(alt => (
                    <option key={alt} value={alt}>
                      {alt.charAt(0).toUpperCase() + alt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scope</label>
                <select
                  value={formState.scope}
                  onChange={(e) => updateField('scope', e.target.value as PromptScope)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.values(PromptScope).map(scope => (
                    <option key={scope} value={scope}>
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Context Priority: {formState.contextPriority}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formState.contextPriority}
                onChange={(e) => updateField('contextPriority', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
              <input
                type="text"
                value={formState.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="e.g., gpt-4, claude-3"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {formState.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formState.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={formState.maxTokens}
                  onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Example Usage</label>
              <textarea
                value={formState.exampleUsage}
                onChange={(e) => updateField('exampleUsage', e.target.value)}
                placeholder="Show an example of how to use this agent..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <Plus size={20} className="mr-2" />
        Create Agent
      </button>
    </div>
  );
};
