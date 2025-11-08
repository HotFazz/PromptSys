// Core type definitions for the System Prompts Ontology

export interface PromptNode {
  id: string;
  title: string;
  content: string;
  category: PromptCategory;
  metadata: NodeMetadata;
  position: { x: number; y: number };
}

export interface PromptEdge {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  label?: string;
  metadata?: EdgeMetadata;
}

export interface NodeMetadata {
  createdAt: Date;
  updatedAt: Date;
  tokens?: number;
  complexity?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface EdgeMetadata {
  strength?: number; // 0-1 indicating connection strength
  bidirectional?: boolean;
}

export enum PromptCategory {
  INSTRUCTION = 'instruction',
  CONTEXT = 'context',
  CONSTRAINT = 'constraint',
  EXAMPLE = 'example',
  ROLE = 'role',
  OBJECTIVE = 'objective',
  FORMAT = 'format',
  PERSONA = 'persona',
  GUARDRAIL = 'guardrail',
  TOOL = 'tool',
  WORKFLOW = 'workflow',
  UNCATEGORIZED = 'uncategorized'
}

export enum ConnectionType {
  DEPENDS_ON = 'depends_on',
  EXTENDS = 'extends',
  CONFLICTS_WITH = 'conflicts_with',
  RELATED_TO = 'related_to',
  PRECEDES = 'precedes',
  VALIDATES = 'validates',
  MODIFIES = 'modifies'
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: 'low' | 'medium' | 'high';
  nodeIds: string[];
  edgeIds?: string[];
  description: string;
  suggestions?: string[];
}

export enum ConflictType {
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  CONTRADICTORY_INSTRUCTIONS = 'contradictory_instructions',
  AMBIGUOUS_RELATIONSHIP = 'ambiguous_relationship',
  MISSING_DEPENDENCY = 'missing_dependency',
  DUPLICATE_CONTENT = 'duplicate_content',
  ORPHANED_NODE = 'orphaned_node'
}

export interface OntologyAnalysis {
  nodes: PromptNode[];
  edges: PromptEdge[];
  conflicts: Conflict[];
  suggestions: string[];
  metadata: {
    totalTokens: number;
    nodeCount: number;
    edgeCount: number;
    analyzedAt: Date;
  };
}

export interface ParsedMarkdown {
  sections: MarkdownSection[];
  metadata?: Record<string, unknown>;
}

export interface MarkdownSection {
  title: string;
  content: string;
  level: number;
  children?: MarkdownSection[];
}

export interface AIAnalysisRequest {
  content: string;
  existingOntology?: OntologyAnalysis;
  options?: {
    detectConflicts?: boolean;
    suggestConnections?: boolean;
    categorize?: boolean;
  };
}

export interface AIAnalysisResponse {
  nodes: Omit<PromptNode, 'id' | 'position'>[];
  edges: Omit<PromptEdge, 'id'>[];
  conflicts: Conflict[];
  suggestions: string[];
}
