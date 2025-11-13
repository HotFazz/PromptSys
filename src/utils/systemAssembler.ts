/**
 * System prompt assembler - generates complete system prompts from ontology
 */

import {
  PromptNode,
  PromptNodeType,
  InvocationStrategy,
  OpenAIFunction
} from '../types';

export interface AssembledSystem {
  mainPrompt: string;
  orchestrators: PromptNode[];
  subagents: PromptNode[];
  tools: PromptNode[];
  skills: PromptNode[];
  skillsCatalog: string;
  openAIFunctions: OpenAIFunction[];
  markdown: string;
  json: string;
}

/**
 * Assemble complete system from nodes
 */
export function assembleSystem(nodes: PromptNode[]): AssembledSystem {
  // Categorize nodes
  const orchestrators = nodes.filter(n => n.nodeType === PromptNodeType.ORCHESTRATOR);
  const subagents = nodes.filter(n => n.nodeType === PromptNodeType.SUBAGENT);
  const tools = nodes.filter(n =>
    n.nodeType === PromptNodeType.TOOL ||
    n.nodeType === PromptNodeType.NATIVE_CAPABILITY ||
    n.nodeType === PromptNodeType.FUNCTION
  );
  const skills = nodes.filter(n => n.nodeType === PromptNodeType.SKILL);
  const systemInstructions = nodes.filter(n => n.nodeType === PromptNodeType.SYSTEM_INSTRUCTION);
  const alwaysLoaded = nodes.filter(n =>
    n.invocationStrategy === InvocationStrategy.ALWAYS_LOADED &&
    n.nodeType === PromptNodeType.STATIC
  );

  // Build main prompt
  const sections: string[] = [];

  // System instructions first
  if (systemInstructions.length > 0) {
    sections.push('# System Instructions\n');
    systemInstructions.forEach(node => {
      sections.push(`## ${node.title}\n\n${node.content}\n`);
    });
  }

  // Orchestrators
  if (orchestrators.length > 0) {
    sections.push('# Orchestrator\n');
    orchestrators.forEach(node => {
      sections.push(`## ${node.title}\n\n${node.content}\n`);
      if (node.agentMetadata?.capabilities && node.agentMetadata.capabilities.length > 0) {
        sections.push(`**Capabilities:** ${node.agentMetadata.capabilities.join(', ')}\n`);
      }
    });
  }

  // Always-loaded content
  if (alwaysLoaded.length > 0) {
    sections.push('# Core Instructions\n');
    alwaysLoaded.forEach(node => {
      sections.push(`## ${node.title}\n\n${node.content}\n`);
    });
  }

  // Sub-agents (if always loaded)
  const alwaysLoadedSubagents = subagents.filter(n =>
    n.invocationStrategy === InvocationStrategy.ALWAYS_LOADED
  );
  if (alwaysLoadedSubagents.length > 0) {
    sections.push('# Specialized Agents\n');
    alwaysLoadedSubagents.forEach(node => {
      sections.push(`## ${node.title}\n\n${node.content}\n`);
      if (node.agentMetadata?.capabilities && node.agentMetadata.capabilities.length > 0) {
        sections.push(`**Capabilities:** ${node.agentMetadata.capabilities.join(', ')}\n`);
      }
    });
  }

  // Skills catalog
  const skillsCatalog = generateSkillsCatalog(skills);
  if (skills.length > 0) {
    sections.push('# Available Skills\n\n');
    sections.push(skillsCatalog);
  }

  const mainPrompt = sections.join('\n');

  // Generate OpenAI functions
  const openAIFunctions = generateOpenAIFunctions(nodes);

  // Generate export formats
  const markdown = generateMarkdownExport(nodes, orchestrators, subagents, tools, skills);
  const json = generateJSONExport(nodes);

  return {
    mainPrompt,
    orchestrators,
    subagents,
    tools,
    skills,
    skillsCatalog,
    openAIFunctions,
    markdown,
    json
  };
}

/**
 * Generate skills catalog (compact format)
 */
function generateSkillsCatalog(skills: PromptNode[]): string {
  if (skills.length === 0) return '';

  const catalogLines: string[] = [
    'You have access to the following on-demand skills. Load them using `load_skill(skill_name)` when needed:\n'
  ];

  skills.forEach((skill, index) => {
    const triggers = skill.agentMetadata?.triggers?.join(', ') || '';
    const summary = skill.agentMetadata?.catalogSummary || skill.content.substring(0, 100);
    const tokens = skill.estimatedTokens || Math.ceil(skill.content.length / 4);

    catalogLines.push(
      `${index + 1}. **${skill.title}**`,
      `   - Triggers: ${triggers}`,
      `   - Description: ${summary}`,
      `   - Est. tokens: ~${tokens}`,
      ''
    );
  });

  const totalTokens = skills.reduce((sum, s) => sum + (s.estimatedTokens || 0), 0);
  const savedTokens = Math.ceil(totalTokens * 0.75); // Assuming 75% savings

  catalogLines.push(`\n*Token efficiency: ~${savedTokens} tokens saved by loading on-demand*\n`);

  return catalogLines.join('\n');
}

/**
 * Generate OpenAI function definitions
 */
function generateOpenAIFunctions(nodes: PromptNode[]): OpenAIFunction[] {
  const functions: OpenAIFunction[] = [];

  nodes.forEach(node => {
    if (!node.agentMetadata?.toolSchema) return;

    const schema = node.agentMetadata.toolSchema;
    const func: OpenAIFunction = {
      type: 'function',
      name: schema.name,
      description: schema.description,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: schema.strict ? false : true
      },
      strict: schema.strict
    };

    // Convert parameters to OpenAI format
    schema.parameters?.forEach(param => {
      func.parameters.properties[param.name] = {
        type: param.type,
        description: param.description,
        ...(param.enum && { enum: param.enum }),
        ...(param.minimum !== undefined && { minimum: param.minimum }),
        ...(param.maximum !== undefined && { maximum: param.maximum }),
        ...(param.minLength !== undefined && { minLength: param.minLength }),
        ...(param.maxLength !== undefined && { maxLength: param.maxLength }),
        ...(param.pattern && { pattern: param.pattern })
      };

      if (param.required) {
        func.parameters.required.push(param.name);
      }
    });

    functions.push(func);
  });

  return functions;
}

/**
 * Generate Markdown export
 */
function generateMarkdownExport(
  nodes: PromptNode[],
  orchestrators: PromptNode[],
  subagents: PromptNode[],
  tools: PromptNode[],
  skills: PromptNode[]
): string {
  const lines: string[] = [
    '# System Prompt Ontology',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total Nodes: ${nodes.length}`,
    '',
    '---',
    ''
  ];

  if (orchestrators.length > 0) {
    lines.push('## Orchestrators\n');
    orchestrators.forEach(node => {
      lines.push(`### ${node.title}\n`);
      lines.push(`**Type:** ${node.nodeType}`);
      lines.push(`**Invocation:** ${node.invocationStrategy}`);
      if (node.agentMetadata?.capabilities) {
        lines.push(`**Capabilities:** ${node.agentMetadata.capabilities.join(', ')}`);
      }
      lines.push('');
      lines.push(node.content);
      lines.push('\n---\n');
    });
  }

  if (subagents.length > 0) {
    lines.push('## Sub-Agents\n');
    subagents.forEach(node => {
      lines.push(`### ${node.title}\n`);
      lines.push(`**Type:** ${node.nodeType}`);
      lines.push(`**Invocation:** ${node.invocationStrategy}`);
      if (node.agentMetadata?.toolSchema) {
        lines.push(`**Function:** \`${node.agentMetadata.toolSchema.name}()\``);
      }
      lines.push('');
      lines.push(node.content);
      lines.push('\n---\n');
    });
  }

  if (skills.length > 0) {
    lines.push('## Skills (On-Demand)\n');
    skills.forEach(node => {
      lines.push(`### ${node.title}\n`);
      if (node.agentMetadata?.triggers) {
        lines.push(`**Triggers:** ${node.agentMetadata.triggers.join(', ')}`);
      }
      if (node.agentMetadata?.catalogSummary) {
        lines.push(`**Summary:** ${node.agentMetadata.catalogSummary}`);
      }
      lines.push('');
      lines.push(node.content);
      lines.push('\n---\n');
    });
  }

  if (tools.length > 0) {
    lines.push('## Tools & Functions\n');
    tools.forEach(node => {
      lines.push(`### ${node.title}\n`);
      if (node.agentMetadata?.toolSchema) {
        lines.push('**Function Schema:**\n');
        lines.push('```json');
        lines.push(JSON.stringify(node.agentMetadata.toolSchema, null, 2));
        lines.push('```\n');
      }
      lines.push(node.content);
      lines.push('\n---\n');
    });
  }

  return lines.join('\n');
}

/**
 * Generate JSON export
 */
function generateJSONExport(nodes: PromptNode[]): string {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      totalNodes: nodes.length
    },
    agents: nodes.map(node => ({
      title: node.title,
      content: node.content,
      nodeType: node.nodeType,
      invocationStrategy: node.invocationStrategy,
      category: node.category,
      altitude: node.altitude,
      scope: node.scope,
      contextPriority: node.contextPriority,
      estimatedTokens: node.estimatedTokens,
      agentMetadata: node.agentMetadata
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
