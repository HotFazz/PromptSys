// Advanced hierarchy and context management types

import { PromptNode, PromptEdge } from './index';

/**
 * Prompt altitude levels (Anthropic's "right altitude" principle)
 */
export enum PromptAltitude {
  META = 'meta',              // High-level philosophy, global principles
  STRATEGIC = 'strategic',     // Strategic guidelines and approaches
  TACTICAL = 'tactical',       // Tactical instructions and rules
  OPERATIONAL = 'operational', // Specific operational details
  IMPLEMENTATION = 'implementation' // Low-level implementation specifics
}

/**
 * Scope defines where and when a prompt applies
 */
export enum PromptScope {
  GLOBAL = 'global',       // Applies to entire system, always active
  SESSION = 'session',     // Applies to current session
  TASK = 'task',          // Applies to specific task type
  LOCAL = 'local',        // Applies to immediate context only
  CONDITIONAL = 'conditional' // Conditionally activated
}

/**
 * Composition strategies for composite prompts
 */
export enum CompositionStrategy {
  SEQUENTIAL = 'sequential',   // Components applied in order
  PARALLEL = 'parallel',       // Components applied simultaneously
  HIERARCHICAL = 'hierarchical', // Nested hierarchy
  CONDITIONAL = 'conditional'  // Conditionally selected
}

/**
 * Activation conditions for conditional prompts
 */
export interface ActivationCondition {
  type: 'context_contains' | 'state_equals' | 'trigger' | 'token_budget';
  field?: string;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value?: string | number;
  description: string;
}

/**
 * Enhanced prompt node with hierarchical capabilities
 */
export interface HierarchicalPromptNode extends PromptNode {
  // Hierarchy structure
  parentId?: string;
  childIds: string[];
  depth: number; // 0 = root, 1 = first level, etc.
  path: string[]; // Full path from root: ['root', 'section1', 'subsection2']

  // Altitude and specificity (Anthropic principle)
  altitude: PromptAltitude;
  specificity: number; // 0-1, how detailed/specific is this prompt
  flexibility: number; // 0-1, how flexible vs rigid (1 = very flexible)

  // Scope and context
  scope: PromptScope;
  contextPriority: number; // 0-100, higher = more important in context
  activationConditions?: ActivationCondition[];

  // Composition
  isComposite: boolean; // true if this node is composed of children
  compositionStrategy?: CompositionStrategy;

  // Reusability
  isTemplate: boolean;
  templateVariables?: Record<string, TemplateVariable>;

  // Context management
  tokenBudget?: number; // Recommended token allocation
  estimatedTokens?: number; // Actual token count
  compressionHint?: 'preserve' | 'summarize' | 'optional' | 'defer';

  // Dependencies and relationships
  requiredParents?: string[]; // Must have these parents to be valid
  incompatibleWith?: string[]; // Cannot coexist with these nodes

  // Versioning
  version?: string;
  parentVersion?: string;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  validation?: string; // Regex or validation rule
}

/**
 * Composite prompt definition
 */
export interface CompositePrompt {
  id: string;
  name: string;
  description: string;

  // Component management
  components: PromptComponent[];
  compositionStrategy: CompositionStrategy;

  // Context budget
  totalTokenBudget: number;
  allocationStrategy: 'equal' | 'weighted' | 'priority' | 'dynamic';

  // Conditional logic
  conditionalRules?: ConditionalRule[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  tags?: string[];
}

/**
 * Individual component in a composite prompt
 */
export interface PromptComponent {
  nodeId: string;
  order: number;
  required: boolean;
  weight: number; // For weighted allocation (0-1)
  conditionalLogic?: string; // JavaScript expression or rule

  // Overrides
  scopeOverride?: PromptScope;
  priorityOverride?: number;
}

/**
 * Conditional rule for composite prompts
 */
export interface ConditionalRule {
  id: string;
  condition: string; // Expression to evaluate
  includeComponents: string[]; // Component IDs to include if true
  excludeComponents?: string[]; // Component IDs to exclude if true
  priority: number;
}

/**
 * Context window management
 */
export interface ContextWindow {
  totalBudget: number; // Total tokens available
  used: number;
  remaining: number;

  // Allocations
  allocations: ContextAllocation[];

  // Compaction
  compactionEnabled: boolean;
  compactionThreshold: number; // 0-1, trigger when used/total > threshold
  preserveNodeIds: string[]; // Never compact these

  // History
  compactionHistory: CompactionEvent[];
}

/**
 * Context allocation for a node
 */
export interface ContextAllocation {
  nodeId: string;
  allocated: number; // Tokens allocated
  used: number; // Tokens actually used
  priority: number;
  compressible: boolean;
  compressionRatio?: number; // If compressed, original/compressed
}

/**
 * Compaction event record
 */
export interface CompactionEvent {
  timestamp: Date;
  trigger: 'threshold' | 'manual' | 'budget_exceeded';
  beforeUsed: number;
  afterUsed: number;
  nodesCompacted: string[];
  savedTokens: number;
}

/**
 * Compaction result
 */
export interface CompactionResult {
  success: boolean;
  tokensSaved: number;
  nodesCompacted: CompactedNode[];
  newAllocations: ContextAllocation[];
  errors?: string[];
}

/**
 * Compacted node information
 */
export interface CompactedNode {
  nodeId: string;
  originalTokens: number;
  compressedTokens: number;
  compressionMethod: 'summarize' | 'truncate' | 'reference';
  compressedContent?: string;
  canRestore: boolean;
}

/**
 * Sub-agent definition
 */
export interface SubAgentDefinition {
  id: string;
  name: string;
  description: string;
  specialization: string;

  // Assigned prompts (scoped view of ontology)
  assignedNodeIds: string[];
  contextBudget: number;

  // Communication
  inputFormat: string;
  outputFormat: string;
  communicationProtocol?: string;

  // Coordination
  coordinatorId?: string; // Parent agent
  delegationStrategy: DelegationStrategy;

  // Performance
  maxConcurrentTasks?: number;
  timeout?: number;
}

/**
 * Delegation strategy
 */
export interface DelegationStrategy {
  type: 'task_based' | 'domain_based' | 'complexity_based' | 'load_balanced';
  criteria: Record<string, unknown>;
  handoffProtocol: string;
  fallbackBehavior: 'escalate' | 'retry' | 'skip';
}

/**
 * Hierarchy metrics for analysis
 */
export interface HierarchyMetrics {
  // Structure metrics
  maxDepth: number;
  avgDepth: number;
  totalNodes: number;
  leafNodes: number;
  rootNodes: number;

  // Balance metrics
  balanceFactor: number; // How evenly distributed (0-1, 1 = perfectly balanced)
  fanout: { min: number; max: number; avg: number }; // Children per node

  // Altitude distribution
  altitudeDistribution: Record<PromptAltitude, number>;
  specificityRange: { min: number; max: number; avg: number };
  flexibilityRange: { min: number; max: number; avg: number };

  // Context metrics
  totalTokens: number;
  avgTokensPerNode: number;
  budgetUtilization: number; // 0-1

  // Scope distribution
  scopeDistribution: Record<PromptScope, number>;

  // Complexity metrics
  cyclomaticComplexity: number;
  couplingScore: number; // How interconnected (0-1)
  cohesionScore: number; // How focused (0-1)

  // Quality metrics
  orphanedNodes: number;
  redundancyScore: number; // Duplicate content (0-1)
  conflictDensity: number; // Conflicts per node
  templateUsage: number; // % of nodes using templates
}

/**
 * Hierarchy analysis result
 */
export interface HierarchyAnalysis {
  metrics: HierarchyMetrics;
  issues: HierarchyIssue[];
  recommendations: HierarchyRecommendation[];
  hotspots: HierarchyHotspot[];
}

/**
 * Hierarchy issue
 */
export interface HierarchyIssue {
  id: string;
  type: 'depth_exceeded' | 'imbalanced' | 'orphaned' | 'over_allocated' | 'under_specified';
  severity: 'low' | 'medium' | 'high';
  nodeIds: string[];
  description: string;
  impact: string;
}

/**
 * Hierarchy recommendation
 */
export interface HierarchyRecommendation {
  id: string;
  type: 'restructure' | 'merge' | 'split' | 'rebalance' | 'add_layer';
  priority: number;
  description: string;
  affectedNodes: string[];
  expectedImprovement: string;
}

/**
 * Hierarchy hotspot (area of concern)
 */
export interface HierarchyHotspot {
  nodeId: string;
  score: number; // 0-100, higher = more problematic
  reasons: string[];
  suggestedActions: string[];
}

/**
 * Enhanced edge types for hierarchy
 */
export enum HierarchicalEdgeType {
  // Existing types
  DEPENDS_ON = 'depends_on',
  EXTENDS = 'extends',
  CONFLICTS_WITH = 'conflicts_with',
  RELATED_TO = 'related_to',
  PRECEDES = 'precedes',
  VALIDATES = 'validates',
  MODIFIES = 'modifies',

  // New hierarchical types
  PARENT_OF = 'parent_of',
  CHILD_OF = 'child_of',
  COMPOSES = 'composes',
  COMPOSED_BY = 'composed_by',
  OVERRIDES = 'overrides',
  OVERRIDDEN_BY = 'overridden_by',
  DELEGATES_TO = 'delegates_to',
  DELEGATED_FROM = 'delegated_from',
  SPECIALIZES = 'specializes',
  GENERALIZES = 'generalizes',

  // Context relationships
  SHARES_CONTEXT = 'shares_context',
  ISOLATES_CONTEXT = 'isolates_context',
  INHERITS_CONTEXT = 'inherits_context',
}

/**
 * Enhanced edge with hierarchy metadata
 */
export interface HierarchicalEdge extends PromptEdge {
  hierarchyLevel?: number; // Level difference between nodes
  contextFlow?: 'forward' | 'backward' | 'bidirectional' | 'none';
  inheritanceType?: 'full' | 'partial' | 'override';
}
