/**
 * Utility services for agent management, tool schemas, and export functions
 */

import {
  PromptNode,
  PromptNodeType,
  ToolSchema,
  ToolParameter,
  OpenAIFunction,
  SkillsCatalog,
  SkillCatalogEntry,
  AgentComposition,
  AgentRelationship
} from '../types';

// ============================================================================
// Skills Catalog Generator
// ============================================================================

export class SkillsCatalogGenerator {
  /**
   * Generate lightweight catalog for system prompt
   */
  static generateCatalog(nodes: PromptNode[]): SkillsCatalog {
    const skills = nodes.filter(n => n.nodeType === PromptNodeType.SKILL);

    const entries: SkillCatalogEntry[] = skills.map(skill => ({
      id: skill.id,
      name: skill.title,
      triggers: skill.agentMetadata?.triggers || [],
      summary: skill.agentMetadata?.catalogSummary || skill.content.substring(0, 100) + '...',
      estimatedTokens: skill.estimatedTokens || 0,
      category: skill.category,
      tags: skill.metadata.tags || [],
      loadPriority: skill.agentMetadata?.loadPriority || 50
    }));

    // Sort by load priority descending
    entries.sort((a, b) => (b.loadPriority || 50) - (a.loadPriority || 50));

    const categories = [...new Set(entries.map(e => e.category).filter((c): c is string => !!c))];

    return {
      version: '1.0',
      generated: new Date(),
      totalSkills: entries.length,
      entries,
      categories
    };
  }

  /**
   * Generate catalog text for embedding in system prompt
   */
  static generateCatalogText(nodes: PromptNode[]): string {
    const catalog = this.generateCatalog(nodes);

    if (catalog.totalSkills === 0) {
      return 'No skills available.';
    }

    const lines = [
      '## Skills Catalog',
      `Available skills (load with \`load_skill(id)\`): ${catalog.totalSkills} total`,
      ''
    ];

    // Group by category
    const byCategory = new Map<string, SkillCatalogEntry[]>();
    catalog.entries.forEach(entry => {
      const cat = entry.category || 'uncategorized';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(entry);
    });

    byCategory.forEach((entries, category) => {
      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
      entries.forEach(entry => {
        const triggers = entry.triggers.length > 0
          ? `Triggers: \`${entry.triggers.join('`, `')}\``
          : '';
        lines.push(
          `- **${entry.name}** (\`${entry.id}\`, ~${entry.estimatedTokens}t): ${entry.summary}`,
          triggers ? `  ${triggers}` : ''
        );
      });
      lines.push('');
    });

    return lines.filter(Boolean).join('\n');
  }

  /**
   * Find skills matching triggers
   */
  static findSkillsByTriggers(nodes: PromptNode[], text: string): PromptNode[] {
    const skills = nodes.filter(n => n.nodeType === PromptNodeType.SKILL);
    const lowerText = text.toLowerCase();

    return skills.filter(skill => {
      const triggers = skill.agentMetadata?.triggers || [];
      return triggers.some(trigger => lowerText.includes(trigger.toLowerCase()));
    });
  }
}

// ============================================================================
// OpenAI Function Export
// ============================================================================

export class OpenAIExporter {
  /**
   * Export node as OpenAI function format
   */
  static exportToOpenAIFunction(node: PromptNode): OpenAIFunction | null {
    if (!node.agentMetadata?.toolSchema) {
      return null;
    }

    const schema = node.agentMetadata.toolSchema;

    // Convert parameters to OpenAI format
    const properties: Record<string, any> = {};
    const required: string[] = [];

    schema.parameters.forEach(param => {
      properties[param.name] = this.parameterToSchema(param);
      if (param.required) {
        required.push(param.name);
      }
    });

    return {
      type: 'function',
      name: schema.name,
      description: schema.description,
      parameters: {
        type: 'object',
        properties,
        required,
        additionalProperties: false
      },
      strict: schema.strict ?? true
    };
  }

  /**
   * Convert ToolParameter to JSON Schema format
   */
  private static parameterToSchema(param: ToolParameter): any {
    const schema: any = {
      type: param.type,
      description: param.description
    };

    // Add constraints
    if (param.enum) schema.enum = param.enum;
    if (param.default !== undefined) schema.default = param.default;
    if (param.minimum !== undefined) schema.minimum = param.minimum;
    if (param.maximum !== undefined) schema.maximum = param.maximum;
    if (param.minLength !== undefined) schema.minLength = param.minLength;
    if (param.maxLength !== undefined) schema.maxLength = param.maxLength;
    if (param.pattern) schema.pattern = param.pattern;

    // Handle nested structures
    if (param.type === 'array' && param.items) {
      schema.items = this.parameterToSchema(param.items);
    }

    if (param.type === 'object' && param.properties) {
      schema.properties = {};
      Object.entries(param.properties).forEach(([key, prop]) => {
        schema.properties[key] = this.parameterToSchema(prop);
      });
      if (param.additionalProperties !== undefined) {
        schema.additionalProperties = param.additionalProperties;
      }
    }

    return schema;
  }

  /**
   * Export all tools and functions from ontology
   */
  static exportAllFunctions(nodes: PromptNode[]): OpenAIFunction[] {
    const functions: OpenAIFunction[] = [];

    nodes.forEach(node => {
      if (node.nodeType === PromptNodeType.TOOL ||
          node.nodeType === PromptNodeType.FUNCTION ||
          node.nodeType === PromptNodeType.SUBAGENT) {
        const func = this.exportToOpenAIFunction(node);
        if (func) functions.push(func);
      }
    });

    return functions;
  }

  /**
   * Generate function calling code example
   */
  static generateUsageExample(func: OpenAIFunction): string {
    const exampleParams: Record<string, any> = {};

    Object.entries(func.parameters.properties).forEach(([key, schema]: [string, any]) => {
      if (func.parameters.required.includes(key)) {
        // Generate example value based on type
        if (schema.enum) {
          exampleParams[key] = schema.enum[0];
        } else if (schema.type === 'string') {
          exampleParams[key] = schema.default || 'example_value';
        } else if (schema.type === 'number') {
          exampleParams[key] = schema.default || 0;
        } else if (schema.type === 'boolean') {
          exampleParams[key] = schema.default || true;
        }
      }
    });

    return JSON.stringify({
      name: func.name,
      parameters: exampleParams
    }, null, 2);
  }
}

// ============================================================================
// Tool Schema Validator
// ============================================================================

export class ToolSchemaValidator {
  /**
   * Validate tool schema structure
   */
  static validate(schema: ToolSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check name
    if (!schema.name || schema.name.trim().length === 0) {
      errors.push('Tool name is required');
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema.name)) {
      errors.push('Tool name must be valid identifier (letters, numbers, underscores)');
    }

    // Check description
    if (!schema.description || schema.description.trim().length === 0) {
      errors.push('Tool description is required');
    }

    // Check parameters
    if (!Array.isArray(schema.parameters)) {
      errors.push('Parameters must be an array');
    } else {
      schema.parameters.forEach((param, index) => {
        const paramErrors = this.validateParameter(param, `parameters[${index}]`);
        errors.push(...paramErrors);
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual parameter
   */
  private static validateParameter(param: ToolParameter, path: string): string[] {
    const errors: string[] = [];

    if (!param.name) {
      errors.push(`${path}: Parameter name is required`);
    }

    if (!param.type) {
      errors.push(`${path}: Parameter type is required`);
    } else if (!['string', 'number', 'boolean', 'object', 'array', 'null'].includes(param.type)) {
      errors.push(`${path}: Invalid parameter type "${param.type}"`);
    }

    if (!param.description) {
      errors.push(`${path}: Parameter description is required`);
    }

    // Validate constraints
    if (param.minimum !== undefined && param.maximum !== undefined && param.minimum > param.maximum) {
      errors.push(`${path}: minimum cannot be greater than maximum`);
    }

    if (param.minLength !== undefined && param.maxLength !== undefined && param.minLength > param.maxLength) {
      errors.push(`${path}: minLength cannot be greater than maxLength`);
    }

    // Validate nested structures
    if (param.type === 'array') {
      if (!param.items) {
        errors.push(`${path}: Array type requires "items" definition`);
      } else {
        const itemErrors = this.validateParameter(param.items, `${path}.items`);
        errors.push(...itemErrors);
      }
    }

    if (param.type === 'object') {
      if (!param.properties || Object.keys(param.properties).length === 0) {
        errors.push(`${path}: Object type requires "properties" definition`);
      } else {
        Object.entries(param.properties).forEach(([key, prop]) => {
          const propErrors = this.validateParameter(prop, `${path}.properties.${key}`);
          errors.push(...propErrors);
        });
      }
    }

    return errors;
  }
}

// ============================================================================
// Agent Composition Analyzer
// ============================================================================

export class AgentCompositionAnalyzer {
  /**
   * Analyze agent composition structure
   */
  static analyzeComposition(nodes: PromptNode[], edges: any[]): AgentComposition | null {
    // Find orchestrator (typically the root node with nodeType=ORCHESTRATOR)
    const orchestrators = nodes.filter(n => n.nodeType === PromptNodeType.ORCHESTRATOR);

    if (orchestrators.length === 0) {
      return null;
    }

    const orchestrator = orchestrators[0]; // Use first if multiple

    // Find all agent components
    const subagents = nodes.filter(n => n.nodeType === PromptNodeType.SUBAGENT).map(n => n.id);
    const tools = nodes.filter(n => n.nodeType === PromptNodeType.TOOL || n.nodeType === PromptNodeType.FUNCTION).map(n => n.id);
    const skills = nodes.filter(n => n.nodeType === PromptNodeType.SKILL).map(n => n.id);

    // Build relationships
    const relationships: AgentRelationship[] = edges
      .filter(e => e.agentRelationType)
      .map(e => ({
        from: e.source,
        to: e.target,
        type: e.agentRelationType,
        conditional: e.conditional,
        frequency: e.invocationCount || 0
      }));

    return {
      orchestrator: orchestrator.id,
      subagents,
      tools,
      skills,
      relationships
    };
  }

  /**
   * Generate composition summary text
   */
  static generateCompositionSummary(composition: AgentComposition, nodes: PromptNode[]): string {
    const getNodeTitle = (id: string) => nodes.find(n => n.id === id)?.title || id;

    const lines = [
      '## Agent Composition',
      '',
      `**Orchestrator**: ${getNodeTitle(composition.orchestrator)}`,
      '',
      `**Sub-agents** (${composition.subagents.length}):`,
      ...composition.subagents.map(id => `- ${getNodeTitle(id)}`),
      '',
      `**Tools** (${composition.tools.length}):`,
      ...composition.tools.map(id => `- ${getNodeTitle(id)}`),
      '',
      `**Skills** (${composition.skills.length}):`,
      ...composition.skills.map(id => `- ${getNodeTitle(id)}`)
    ];

    return lines.join('\n');
  }
}

// ============================================================================
// Token Estimator for Agent Content
// ============================================================================

export class AgentTokenEstimator {
  /**
   * Estimate tokens for agent node including metadata
   */
  static estimateNode(node: PromptNode): number {
    let tokens = 0;

    // Base content
    tokens += Math.ceil(node.content.length / 4);

    // Title and category
    tokens += Math.ceil(node.title.length / 4);
    tokens += 2; // category

    // Agent metadata
    if (node.agentMetadata) {
      // Tool schema
      if (node.agentMetadata.toolSchema) {
        const schemaStr = JSON.stringify(node.agentMetadata.toolSchema);
        tokens += Math.ceil(schemaStr.length / 4);
      }

      // Catalog summary
      if (node.agentMetadata.catalogSummary) {
        tokens += Math.ceil(node.agentMetadata.catalogSummary.length / 4);
      }

      // Example usage
      if (node.agentMetadata.exampleUsage) {
        tokens += Math.ceil(node.agentMetadata.exampleUsage.length / 4);
      }

      // Capabilities and tools
      if (node.agentMetadata.capabilities) {
        tokens += node.agentMetadata.capabilities.length * 3;
      }
      if (node.agentMetadata.tools) {
        tokens += node.agentMetadata.tools.length * 3;
      }
    }

    return Math.ceil(tokens);
  }
}
