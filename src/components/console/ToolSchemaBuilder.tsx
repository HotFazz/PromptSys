import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { ToolSchema, ToolParameter, ParameterType } from '../../types';

interface ToolSchemaBuilderProps {
  schema?: ToolSchema;
  onChange: (schema: ToolSchema | undefined) => void;
}

export const ToolSchemaBuilder: React.FC<ToolSchemaBuilderProps> = ({ schema, onChange }) => {
  const [name, setName] = useState(schema?.name || '');
  const [description, setDescription] = useState(schema?.description || '');
  const [parameters, setParameters] = useState<ToolParameter[]>(schema?.parameters || []);
  const [strict, setStrict] = useState(schema?.strict || false);

  const updateSchema = (updates: Partial<ToolSchema>) => {
    const newSchema: ToolSchema = {
      name: updates.name !== undefined ? updates.name : name,
      description: updates.description !== undefined ? updates.description : description,
      parameters: updates.parameters !== undefined ? updates.parameters : parameters,
      strict: updates.strict !== undefined ? updates.strict : strict
    };
    onChange(newSchema);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    updateSchema({ name: newName });
  };

  const handleDescriptionChange = (newDesc: string) => {
    setDescription(newDesc);
    updateSchema({ description: newDesc });
  };

  const handleStrictChange = (newStrict: boolean) => {
    setStrict(newStrict);
    updateSchema({ strict: newStrict });
  };

  const addParameter = () => {
    const newParam: ToolParameter = {
      name: '',
      type: 'string',
      description: '',
      required: false
    };
    const newParams = [...parameters, newParam];
    setParameters(newParams);
    updateSchema({ parameters: newParams });
  };

  const updateParameter = (index: number, updates: Partial<ToolParameter>) => {
    const newParams = parameters.map((param, i) =>
      i === index ? { ...param, ...updates } : param
    );
    setParameters(newParams);
    updateSchema({ parameters: newParams });
  };

  const removeParameter = (index: number) => {
    const newParams = parameters.filter((_, i) => i !== index);
    setParameters(newParams);
    updateSchema({ parameters: newParams });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Function Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., query_customer_data"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be a valid identifier (letters, numbers, underscores only)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe what this function does..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="strict-mode"
          checked={strict}
          onChange={(e) => handleStrictChange(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="strict-mode" className="text-sm text-gray-300">
          Enable strict mode (OpenAI structured outputs)
        </label>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Parameters</label>
          <button
            onClick={addParameter}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={14} className="mr-1" />
            Add Parameter
          </button>
        </div>

        {parameters.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
            No parameters defined. Click "Add Parameter" to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {parameters.map((param, index) => (
              <ParameterEditor
                key={index}
                parameter={param}
                onChange={(updates) => updateParameter(index, updates)}
                onRemove={() => removeParameter(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ParameterEditorProps {
  parameter: ToolParameter;
  onChange: (updates: Partial<ToolParameter>) => void;
  onRemove: () => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ parameter, onChange, onRemove }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-900/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <input
            type="text"
            value={parameter.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="parameter_name"
            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono"
          />
          <select
            value={parameter.type}
            onChange={(e) => onChange({ type: e.target.value as ParameterType })}
            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
            <option value="null">null</option>
          </select>
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`required-${parameter.name}`}
              checked={parameter.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="mr-1"
            />
            <label htmlFor={`required-${parameter.name}`} className="text-xs text-gray-300">
              Required
            </label>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
          title="Remove parameter"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mb-2">
        <input
          type="text"
          value={parameter.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe this parameter..."
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
        />
      </div>

      {/* Advanced Options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center text-xs text-gray-400 hover:text-gray-300"
      >
        {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="ml-1">Advanced constraints</span>
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-700">
          {/* String constraints */}
          {parameter.type === 'string' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Min Length</label>
                  <input
                    type="number"
                    value={parameter.minLength || ''}
                    onChange={(e) => onChange({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Length</label>
                  <input
                    type="number"
                    value={parameter.maxLength || ''}
                    onChange={(e) => onChange({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="∞"
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Pattern (Regex)</label>
                <input
                  type="text"
                  value={parameter.pattern || ''}
                  onChange={(e) => onChange({ pattern: e.target.value || undefined })}
                  placeholder="^[A-Za-z]+$"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs font-mono"
                />
              </div>
            </>
          )}

          {/* Number constraints */}
          {parameter.type === 'number' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                <input
                  type="number"
                  value={parameter.minimum ?? ''}
                  onChange={(e) => onChange({ minimum: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="-∞"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                <input
                  type="number"
                  value={parameter.maximum ?? ''}
                  onChange={(e) => onChange({ maximum: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="∞"
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Enum values for any type */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Allowed Values (comma-separated)</label>
            <input
              type="text"
              value={parameter.enum?.join(', ') || ''}
              onChange={(e) => onChange({
                enum: e.target.value ? e.target.value.split(',').map(v => v.trim()).filter(Boolean) : undefined
              })}
              placeholder="option1, option2, option3"
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
            />
          </div>

          {/* Default value */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Default Value</label>
            <input
              type="text"
              value={parameter.default ?? ''}
              onChange={(e) => {
                let defaultValue: any = e.target.value;
                // Try to parse as appropriate type
                if (parameter.type === 'number') {
                  defaultValue = defaultValue ? parseFloat(defaultValue) : undefined;
                } else if (parameter.type === 'boolean') {
                  defaultValue = defaultValue === 'true';
                }
                onChange({ default: defaultValue });
              }}
              placeholder={parameter.type === 'boolean' ? 'true/false' : 'default value'}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
