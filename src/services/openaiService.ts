import OpenAI from 'openai';
import {
  AIAnalysisRequest,
  AIAnalysisResponse,
  PromptCategory,
  ConnectionType,
  PromptNode,
  PromptEdge
} from '../types';

export class OpenAIService {
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // For demo purposes only
      });
    }
  }

  setApiKey(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Analyze markdown content and extract prompt ontology
   */
  async analyzePrompts(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not set');
    }

    const systemPrompt = this.buildAnalysisSystemPrompt(request);
    const userPrompt = this.buildAnalysisUserPrompt(request);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return this.validateAndTransformResponse(parsed);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to analyze prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt for analysis
   */
  private buildAnalysisSystemPrompt(_request: AIAnalysisRequest): string {
    return `You are an expert in analyzing and structuring AI system prompts into ontologies.

Your task is to analyze the provided system prompt content and extract a structured ontology that shows:
1. Individual prompt components (nodes)
2. Relationships between components (edges)
3. Potential conflicts or ambiguities
4. Suggestions for improvement

Categories for prompt nodes:
- instruction: Direct instructions or commands
- context: Background information or context setting
- constraint: Limitations, rules, or guardrails
- example: Examples or demonstrations
- role: Role or persona definitions
- objective: Goals or desired outcomes
- format: Output format specifications
- persona: Character or behavioral traits
- guardrail: Safety or ethical constraints
- tool: Tool usage instructions
- workflow: Process or step definitions
- uncategorized: Default category

Connection types:
- depends_on: Node A requires Node B to function properly
- extends: Node A builds upon or extends Node B
- conflicts_with: Node A contradicts Node B
- related_to: Node A is semantically related to Node B
- precedes: Node A should come before Node B
- validates: Node A validates or checks Node B
- modifies: Node A modifies the behavior of Node B

Respond with a JSON object containing:
{
  "nodes": [{ "title": string, "content": string, "category": string, "metadata": { "complexity": "low"|"medium"|"high", "tags": string[] } }],
  "edges": [{ "source": string (node title), "target": string (node title), "type": string, "label": string? }],
  "conflicts": [{ "type": string, "severity": "low"|"medium"|"high", "description": string, "suggestions": string[] }],
  "suggestions": string[]
}

Be thorough in identifying logical connections and potential conflicts.`;
  }

  /**
   * Build user prompt for analysis
   */
  private buildAnalysisUserPrompt(request: AIAnalysisRequest): string {
    let prompt = `Analyze the following system prompt content and extract its ontological structure:\n\n${request.content}`;

    if (request.existingOntology) {
      prompt += `\n\nExisting ontology context:\n`;
      prompt += `- Current nodes: ${request.existingOntology.nodes.length}\n`;
      prompt += `- Current edges: ${request.existingOntology.edges.length}\n`;
      prompt += `Please integrate the new content with the existing structure.`;
    }

    if (request.options?.detectConflicts) {
      prompt += `\n\nPay special attention to detecting conflicts and contradictions.`;
    }

    if (request.options?.suggestConnections) {
      prompt += `\n\nSuggest additional connections that might not be explicitly stated but are logically implied.`;
    }

    return prompt;
  }

  /**
   * Validate and transform API response
   */
  private validateAndTransformResponse(parsed: any): AIAnalysisResponse {
    const response: AIAnalysisResponse = {
      nodes: [],
      edges: [],
      conflicts: [],
      suggestions: []
    };

    // Process nodes
    if (Array.isArray(parsed.nodes)) {
      response.nodes = parsed.nodes.map((node: any) => ({
        title: node.title || 'Untitled',
        content: node.content || '',
        category: this.validateCategory(node.category),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          complexity: node.metadata?.complexity || 'medium',
          tags: Array.isArray(node.metadata?.tags) ? node.metadata.tags : []
        }
      }));
    }

    // Process edges
    if (Array.isArray(parsed.edges)) {
      response.edges = parsed.edges.map((edge: any) => ({
        source: edge.source || '',
        target: edge.target || '',
        type: this.validateConnectionType(edge.type),
        label: edge.label
      }));
    }

    // Process conflicts
    if (Array.isArray(parsed.conflicts)) {
      response.conflicts = parsed.conflicts.map((conflict: any, index: number) => ({
        id: `ai-conflict-${Date.now()}-${index}`,
        type: conflict.type || 'ambiguous_relationship',
        severity: conflict.severity || 'medium',
        nodeIds: [], // Will be populated after nodes are created
        description: conflict.description || 'Potential conflict detected',
        suggestions: Array.isArray(conflict.suggestions) ? conflict.suggestions : []
      }));
    }

    // Process suggestions
    if (Array.isArray(parsed.suggestions)) {
      response.suggestions = parsed.suggestions;
    }

    return response;
  }

  /**
   * Validate and normalize category
   */
  private validateCategory(category: string): PromptCategory {
    const normalized = category?.toLowerCase();
    if (Object.values(PromptCategory).includes(normalized as PromptCategory)) {
      return normalized as PromptCategory;
    }
    return PromptCategory.UNCATEGORIZED;
  }

  /**
   * Validate and normalize connection type
   */
  private validateConnectionType(type: string): ConnectionType {
    const normalized = type?.toLowerCase();
    if (Object.values(ConnectionType).includes(normalized as ConnectionType)) {
      return normalized as ConnectionType;
    }
    return ConnectionType.RELATED_TO;
  }

  /**
   * Generate auto-layout suggestions for nodes
   */
  async suggestLayout(nodes: PromptNode[], edges: PromptEdge[]): Promise<Map<string, { x: number; y: number }>> {
    // Simple hierarchical layout algorithm
    const positions = new Map<string, { x: number; y: number }>();
    const layers = this.calculateLayers(nodes, edges);

    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 200;

    layers.forEach((nodeIds, layerIndex) => {
      const layerWidth = nodeIds.length * HORIZONTAL_SPACING;
      const startX = -layerWidth / 2;

      nodeIds.forEach((nodeId, index) => {
        positions.set(nodeId, {
          x: startX + index * HORIZONTAL_SPACING,
          y: layerIndex * VERTICAL_SPACING
        });
      });
    });

    return positions;
  }

  /**
   * Calculate hierarchical layers for layout
   */
  private calculateLayers(nodes: PromptNode[], edges: PromptEdge[]): Map<number, string[]> {
    const layers = new Map<number, string[]>();
    const nodeDepths = new Map<string, number>();

    // Find root nodes (no incoming edges)
    const hasIncoming = new Set(edges.map(e => e.target));
    const roots = nodes.filter(n => !hasIncoming.has(n.id));

    // BFS to assign depths
    const queue: Array<{ id: string; depth: number }> = roots.map(n => ({ id: n.id, depth: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;

      visited.add(id);
      nodeDepths.set(id, depth);

      if (!layers.has(depth)) {
        layers.set(depth, []);
      }
      layers.get(depth)!.push(id);

      // Add children to queue
      edges
        .filter(e => e.source === id)
        .forEach(e => {
          if (!visited.has(e.target)) {
            queue.push({ id: e.target, depth: depth + 1 });
          }
        });
    }

    // Handle any unvisited nodes (orphaned)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const maxDepth = Math.max(...Array.from(layers.keys()), -1) + 1;
        if (!layers.has(maxDepth)) {
          layers.set(maxDepth, []);
        }
        layers.get(maxDepth)!.push(node.id);
      }
    });

    return layers;
  }
}

// Singleton instance
let openAIServiceInstance: OpenAIService | null = null;

export const getOpenAIService = (): OpenAIService => {
  if (!openAIServiceInstance) {
    openAIServiceInstance = new OpenAIService();
  }
  return openAIServiceInstance;
};
