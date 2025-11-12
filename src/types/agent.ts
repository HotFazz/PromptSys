/**
 * Agent-specific type definitions for agentic system ontologies
 * Supports orchestrators, sub-agents, tools, skills, and functions
 */

// ============================================================================
// Node Types
// ============================================================================

export enum PromptNodeType {
  // Static content (traditional prompts)
  STATIC = 'static',

  // Agentic components
  ORCHESTRATOR = 'orchestrator',      // Main coordinating agent (e.g., SIBEL)
  SUBAGENT = 'subagent',             // Specialized delegate agent (e.g., SEC Edgar Agent)
  TOOL = 'tool',                      // External API/function (e.g., Alpha Vantage)
  SKILL = 'skill',                    // On-demand capability (markdown file)
  NATIVE_CAPABILITY = 'native',       // Built-in capability (e.g., Code Interpreter)
  SYSTEM_INSTRUCTION = 'system',      // Core system prompt component
  FUNCTION = 'function',              // Callable function definition
}

// ============================================================================
// Invocation Strategies
// ============================================================================

export enum InvocationStrategy {
  ALWAYS_LOADED = 'always_loaded',    // In main system prompt
  ON_DEMAND = 'on_demand',            // Loaded via load_skill() or trigger
  FUNCTION_CALL = 'function_call',    // Called as tool/function
  CONDITIONAL = 'conditional',        // Based on runtime state
  IMPLICIT = 'implicit',              // Triggered by keywords/patterns
  MANUAL = 'manual',                  // User explicitly invokes
}

// ============================================================================
// Agent Relationships
// ============================================================================

export enum AgentRelationType {
  ORCHESTRATES = 'orchestrates',      // Main agent → sub-agents
  DELEGATES_TO = 'delegates_to',      // Agent → specialized agent
  USES_TOOL = 'uses_tool',           // Agent → tool
  LOADS_SKILL = 'loads_skill',       // Agent → on-demand skill
  DEPENDS_ON = 'depends_on',         // Runtime dependency
  FALLBACK_TO = 'fallback_to',       // Alternative if unavailable
  CALLS_FUNCTION = 'calls_function', // Agent → function
  PROVIDES_CONTEXT = 'provides_context', // Supplies context to another node
}

// ============================================================================
// Tool Schema (JSON Schema-based)
// ============================================================================

export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface ToolParameter {
  name: string;
  type: ParameterType;
  description: string;
  required: boolean;

  // Constraints
  enum?: string[];                    // Allowed values
  default?: any;                      // Default value
  minimum?: number;                   // For numbers
  maximum?: number;                   // For numbers
  minLength?: number;                 // For strings/arrays
  maxLength?: number;                 // For strings/arrays
  pattern?: string;                   // Regex pattern for strings

  // Nested structures
  items?: ToolParameter;              // For arrays
  properties?: Record<string, ToolParameter>; // For objects
  additionalProperties?: boolean;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns?: ToolParameter;
  strict?: boolean;                   // OpenAI strict mode

  // Examples
  examples?: Array<{
    input: Record<string, any>;
    output?: any;
    description?: string;
  }>;
}

// ============================================================================
// Agent Metadata
// ============================================================================

export interface AgentMetadata {
  // Core identity
  nodeType: PromptNodeType;
  invocationStrategy: InvocationStrategy;

  // For skills/tools
  triggers?: string[];                // Keywords that activate
  catalogSummary?: string;            // Short description for catalog
  exampleUsage?: string;              // Usage example

  // Tool/Function schema
  toolSchema?: ToolSchema;

  // For agents
  capabilities?: string[];            // What this agent can do
  tools?: string[];                   // Tool IDs this agent can use
  model?: string;                     // LLM model (e.g., "gpt-4", "claude-3")
  temperature?: number;               // Model temperature
  maxTokens?: number;                 // Max output tokens

  // Runtime
  availability?: 'always' | 'conditional' | 'unavailable';
  dependencies?: string[];            // Node IDs this depends on
  loadPriority?: number;              // 0-100, higher = load first

  // Performance
  avgLatencyMs?: number;              // Average invocation latency
  successRate?: number;               // 0-1, success rate
  invocationCount?: number;           // Total invocations
  lastInvoked?: Date;

  // Export formats
  exportFormats?: Array<'openai' | 'langchain' | 'autogen' | 'markdown'>;
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  nodeId: string;
  status: 'available' | 'unavailable' | 'loading' | 'error' | 'executing';
  loadedAt?: Date;
  lastInvoked?: Date;
  invocationCount: number;
  averageTokens: number;
  errors?: ExecutionError[];

  // For skills
  isLoaded?: boolean;
  triggerMatches?: string[];          // Which triggers matched
}

export interface ExecutionError {
  timestamp: Date;
  type: 'timeout' | 'api_error' | 'validation_error' | 'dependency_error';
  message: string;
  stack?: string;
}

export interface ExecutionState {
  activeAgents: Record<string, ExecutionContext>;
  loadedSkills: Set<string>;
  availableTools: Set<string>;
  contextBudgetUsed: number;
  totalInvocations: number;

  // Execution history
  invocationHistory: InvocationRecord[];
}

export interface InvocationRecord {
  timestamp: Date;
  nodeId: string;
  nodeTitle: string;
  type: PromptNodeType;
  input?: any;
  output?: any;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

// ============================================================================
// Skills Catalog
// ============================================================================

export interface SkillCatalogEntry {
  id: string;
  name: string;
  triggers: string[];
  summary: string;
  estimatedTokens: number;
  category?: string;
  tags?: string[];
  loadPriority?: number;
}

export interface SkillsCatalog {
  version: string;
  generated: Date;
  totalSkills: number;
  entries: SkillCatalogEntry[];
  categories?: string[];
}

// ============================================================================
// OpenAI Function Format
// ============================================================================

export interface OpenAIFunction {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
    additionalProperties?: boolean;
  };
  strict?: boolean;
}

// ============================================================================
// Agent Composition
// ============================================================================

export interface AgentComposition {
  orchestrator: string;               // Node ID
  subagents: string[];                // Node IDs
  tools: string[];                    // Node IDs
  skills: string[];                   // Node IDs
  relationships: AgentRelationship[];
}

export interface AgentRelationship {
  from: string;                       // Node ID
  to: string;                         // Node ID
  type: AgentRelationType;
  conditional?: string;               // Condition for this relationship
  frequency?: number;                 // How often this relationship is used
}

// ============================================================================
// Lazy Loading Configuration
// ============================================================================

export interface LazyLoadConfig {
  enabled: boolean;
  strategy: 'manual' | 'auto' | 'predictive';
  preloadTriggers?: string[];        // Keywords that preload skills
  maxConcurrentSkills?: number;       // Limit simultaneous loads
  cacheExpiry?: number;               // Minutes until skill unloads
  preloadOnStartup?: string[];        // Skill IDs to load at startup
}

// ============================================================================
// Import/Export Formats
// ============================================================================

export interface AgentExportFormat {
  format: 'openai' | 'langchain' | 'autogen' | 'markdown';
  nodes: any[];                       // Format-specific structure
  metadata: {
    exportedAt: Date;
    version: string;
    totalNodes: number;
  };
}

// ============================================================================
// Node Creation Templates
// ============================================================================

export interface NodeTemplate {
  nodeType: PromptNodeType;
  title: string;
  category: string;
  defaultContent: string;
  defaultMetadata: Partial<AgentMetadata>;
  requiredFields: string[];
  optionalFields: string[];
  helpText: string;
}
