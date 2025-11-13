/**
 * Parsers for bulk importing agents from Markdown and JSON formats
 */

import {
  PromptNode,
  PromptEdge,
  PromptCategory,
  PromptNodeType,
  InvocationStrategy,
  PromptAltitude,
  PromptScope,
  AgentMetadata,
  ToolSchema,
  ConnectionType
} from '../types';
import { generateNodeId, generateEdgeId, createBaseNode } from './nodeUtils';

export interface ParseResult {
  nodes: PromptNode[];
  edges: PromptEdge[];
  errors: string[];
}

/**
 * Parse agents from Markdown format
 * Expected format:
 * # Agent Name
 * - type: orchestrator
 * - invocation: always_loaded
 * - triggers: keyword1, keyword2
 *
 * Content here...
 *
 * ## Tool Schema (optional)
 * ```json
 * { ... }
 * ```
 */
export function parseMarkdown(markdown: string): ParseResult {
  const nodes: PromptNode[] = [];
  const edges: PromptEdge[] = [];
  const errors: string[] = [];

  try {
    // Split by h1 headers to get individual agents
    const sections = markdown.split(/^# /gm).filter(s => s.trim());

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const lines = section.split('\n');

      if (lines.length === 0) continue;

      // Parse title (first line)
      const title = lines[0].trim();
      if (!title) {
        errors.push(`Section ${sectionIndex + 1}: Missing title`);
        continue;
      }

      // Parse metadata (lines starting with -)
      const metadata: Record<string, string> = {};
      let contentStartIndex = 1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('-')) {
          // Parse metadata line: - key: value
          const match = line.match(/^-\s*(\w+):\s*(.+)$/);
          if (match) {
            metadata[match[1].toLowerCase()] = match[2].trim();
          }
          contentStartIndex = i + 1;
        } else if (line) {
          // Non-metadata line, content starts here
          break;
        }
      }

      // Extract content (everything after metadata until tool schema)
      let contentEndIndex = lines.length;
      const toolSchemaIndex = lines.findIndex(line => line.trim().startsWith('## Tool Schema'));
      if (toolSchemaIndex !== -1) {
        contentEndIndex = toolSchemaIndex;
      }

      const content = lines
        .slice(contentStartIndex, contentEndIndex)
        .join('\n')
        .trim();

      if (!content) {
        errors.push(`Section "${title}": Missing content`);
        continue;
      }

      // Parse tool schema if present
      let toolSchema: ToolSchema | undefined;
      if (toolSchemaIndex !== -1) {
        const schemaText = lines.slice(toolSchemaIndex + 1).join('\n');
        const jsonMatch = schemaText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            toolSchema = JSON.parse(jsonMatch[1]);
          } catch (e) {
            errors.push(`Section "${title}": Invalid tool schema JSON`);
          }
        }
      }

      // Build agent metadata
      const nodeType = (metadata.type as PromptNodeType) || PromptNodeType.STATIC;
      const invocationStrategy = (metadata.invocation as InvocationStrategy) || InvocationStrategy.ALWAYS_LOADED;

      const agentMetadata: AgentMetadata = {
        nodeType,
        invocationStrategy,
        triggers: metadata.triggers ? metadata.triggers.split(',').map(t => t.trim()) : undefined,
        catalogSummary: metadata.summary || undefined,
        exampleUsage: metadata.example || undefined,
        capabilities: metadata.capabilities ? metadata.capabilities.split(',').map(c => c.trim()) : undefined,
        toolSchema,
        model: metadata.model || undefined,
        temperature: metadata.temperature ? parseFloat(metadata.temperature) : undefined,
        maxTokens: metadata.maxtokens ? parseInt(metadata.maxtokens) : undefined,
        availability: 'always',
        loadPriority: metadata.priority ? parseInt(metadata.priority) : 50
      };

      // Create node
      const baseNode = createBaseNode(
        title,
        content,
        (metadata.category as PromptCategory) || PromptCategory.UNCATEGORIZED
      );

      const node: PromptNode = {
        ...baseNode,
        id: generateNodeId('imported'),
        altitude: (metadata.altitude as PromptAltitude) || PromptAltitude.TACTICAL,
        scope: (metadata.scope as PromptScope) || PromptScope.TASK,
        contextPriority: metadata.priority ? parseInt(metadata.priority) : 50,
        nodeType,
        invocationStrategy,
        agentMetadata,
        position: { x: 0, y: 0 } // Will be auto-laid out
      } as PromptNode;

      nodes.push(node);

      // Parse relationships if specified
      if (metadata.uses) {
        const targets = metadata.uses.split(',').map(t => t.trim());
        // Store for later edge creation (after all nodes are parsed)
        targets.forEach(target => {
          edges.push({
            id: generateEdgeId(),
            source: node.id,
            target: `__placeholder__${target}`, // Will be resolved later
            type: ConnectionType.DEPENDS_ON,
            label: 'uses'
          } as PromptEdge);
        });
      }
    }

    // Resolve edge placeholders by matching titles
    const titleToId = new Map(nodes.map(n => [n.title.toLowerCase(), n.id]));
    edges.forEach(edge => {
      if (edge.target.startsWith('__placeholder__')) {
        const targetTitle = edge.target.replace('__placeholder__', '').toLowerCase();
        const targetId = titleToId.get(targetTitle);
        if (targetId) {
          edge.target = targetId;
        } else {
          errors.push(`Could not resolve relationship target: "${targetTitle}"`);
        }
      }
    });

    // Filter out unresolved edges
    const resolvedEdges = edges.filter(e => !e.target.startsWith('__placeholder__'));

    return { nodes, edges: resolvedEdges, errors };
  } catch (error) {
    errors.push(`Markdown parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { nodes: [], edges: [], errors };
  }
}

/**
 * Parse agents from JSON format
 * Expected format:
 * {
 *   "agents": [
 *     {
 *       "title": "Agent Name",
 *       "content": "...",
 *       "nodeType": "orchestrator",
 *       "invocationStrategy": "always_loaded",
 *       ...
 *     }
 *   ],
 *   "relationships": [
 *     { "from": "Agent Name", "to": "Tool Name", "type": "uses_tool" }
 *   ]
 * }
 */
export function parseJSON(json: string): ParseResult {
  const nodes: PromptNode[] = [];
  const edges: PromptEdge[] = [];
  const errors: string[] = [];

  try {
    const data = JSON.parse(json);

    if (!data.agents || !Array.isArray(data.agents)) {
      errors.push('JSON must contain an "agents" array');
      return { nodes: [], edges: [], errors };
    }

    // Parse agents
    for (let i = 0; i < data.agents.length; i++) {
      const agent = data.agents[i];

      if (!agent.title) {
        errors.push(`Agent ${i + 1}: Missing title`);
        continue;
      }

      if (!agent.content) {
        errors.push(`Agent "${agent.title}": Missing content`);
        continue;
      }

      const agentMetadata: AgentMetadata = {
        nodeType: agent.nodeType || PromptNodeType.STATIC,
        invocationStrategy: agent.invocationStrategy || InvocationStrategy.ALWAYS_LOADED,
        triggers: agent.triggers,
        catalogSummary: agent.catalogSummary,
        exampleUsage: agent.exampleUsage,
        capabilities: agent.capabilities,
        toolSchema: agent.toolSchema,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        availability: 'always',
        loadPriority: agent.loadPriority || 50
      };

      const baseNode = createBaseNode(
        agent.title,
        agent.content,
        agent.category || PromptCategory.UNCATEGORIZED
      );

      const node: PromptNode = {
        ...baseNode,
        id: generateNodeId('imported'),
        altitude: agent.altitude || PromptAltitude.TACTICAL,
        scope: agent.scope || PromptScope.TASK,
        contextPriority: agent.contextPriority || 50,
        nodeType: agent.nodeType || PromptNodeType.STATIC,
        invocationStrategy: agent.invocationStrategy || InvocationStrategy.ALWAYS_LOADED,
        agentMetadata,
        position: { x: 0, y: 0 } // Will be auto-laid out
      } as PromptNode;

      nodes.push(node);
    }

    // Parse relationships
    if (data.relationships && Array.isArray(data.relationships)) {
      const titleToId = new Map(nodes.map(n => [n.title.toLowerCase(), n.id]));

      for (const rel of data.relationships) {
        if (!rel.from || !rel.to) {
          errors.push('Relationship missing "from" or "to" field');
          continue;
        }

        const sourceId = titleToId.get(rel.from.toLowerCase());
        const targetId = titleToId.get(rel.to.toLowerCase());

        if (!sourceId) {
          errors.push(`Could not find agent: "${rel.from}"`);
          continue;
        }

        if (!targetId) {
          errors.push(`Could not find agent: "${rel.to}"`);
          continue;
        }

        edges.push({
          id: generateEdgeId(),
          source: sourceId,
          target: targetId,
          type: rel.type || ConnectionType.RELATED_TO,
          label: rel.label
        } as PromptEdge);
      }
    }

    return { nodes, edges, errors };
  } catch (error) {
    errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { nodes: [], edges: [], errors };
  }
}

/**
 * Auto-detect format and parse
 */
export function parseImport(content: string): ParseResult {
  const trimmed = content.trim();

  // Try JSON first (starts with { or [)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJSON(content);
  }

  // Otherwise assume Markdown
  return parseMarkdown(content);
}

/**
 * Generate example Markdown template
 */
export function generateMarkdownTemplate(): string {
  return `# Agent Name
- type: orchestrator
- invocation: always_loaded
- category: instruction
- altitude: strategic
- scope: session
- priority: 80
- triggers: keyword1, keyword2
- summary: Brief description for catalog
- capabilities: capability1, capability2
- model: gpt-4
- temperature: 0.7
- maxTokens: 2000

Your agent's system prompt content goes here.

You can use multiple paragraphs and markdown formatting.

## Tool Schema (optional for function-callable agents)
\`\`\`json
{
  "name": "function_name",
  "description": "What this function does",
  "parameters": [
    {
      "name": "param1",
      "type": "string",
      "description": "Description",
      "required": true
    }
  ]
}
\`\`\`

---

# Another Agent
- type: subagent
- invocation: function_call
- uses: Agent Name

This agent uses the previous one.
`;
}

/**
 * Generate example JSON template
 */
export function generateJSONTemplate(): string {
  return JSON.stringify({
    agents: [
      {
        title: "Orchestrator Agent",
        content: "You are an orchestrator that coordinates specialized agents...",
        nodeType: "orchestrator",
        invocationStrategy: "always_loaded",
        category: "instruction",
        altitude: "strategic",
        scope: "session",
        contextPriority: 80,
        capabilities: ["coordination", "delegation"],
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000
      },
      {
        title: "Query Agent",
        content: "You handle customer queries...",
        nodeType: "subagent",
        invocationStrategy: "function_call",
        category: "instruction",
        toolSchema: {
          name: "handle_query",
          description: "Handles customer queries",
          parameters: [
            {
              name: "query",
              type: "string",
              description: "The customer query",
              required: true
            }
          ]
        }
      },
      {
        title: "Email Skill",
        content: "Generate professional email responses...",
        nodeType: "skill",
        invocationStrategy: "on_demand",
        triggers: ["email", "respond", "communication"],
        catalogSummary: "Generates professional email responses"
      }
    ],
    relationships: [
      {
        from: "Orchestrator Agent",
        to: "Query Agent",
        type: "orchestrates",
        label: "delegates to"
      },
      {
        from: "Query Agent",
        to: "Email Skill",
        type: "loads_skill",
        label: "uses"
      }
    ]
  }, null, 2);
}
