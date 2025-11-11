# Ontology Logic Review & Hierarchical Improvements

## Executive Summary

Current implementation provides solid foundations but lacks sophisticated hierarchical management needed for complex, real-world system prompts. This document proposes scalable improvements based on Anthropic's context engineering principles and modern prompt architecture patterns.

---

## Current Implementation Analysis

### ✅ Strengths

1. **Solid Type System**
   - Well-defined node/edge structures
   - Clear categorization (12 categories)
   - Good metadata foundation

2. **Conflict Detection**
   - Circular dependency detection
   - Semantic conflict analysis
   - Duplicate detection

3. **Markdown Hierarchy Parsing**
   - Proper parent-child section tracking
   - Stack-based level management
   - Flatten capability for flat views

4. **Visual Representation**
   - Interactive graph with React Flow
   - Color-coded categories
   - Relationship visualization

### ❌ Critical Gaps for Complex Hierarchies

#### 1. **No Formal Hierarchy in Node Structure**

**Current**: Nodes are flat, relationships only through edges
```typescript
interface PromptNode {
  id: string;
  title: string;
  content: string;
  category: PromptCategory;
  // NO parent/children structure
  // NO hierarchy level
  // NO scope management
}
```

**Problem**: Cannot represent nested prompts or compositional structures

#### 2. **Missing "Altitude" Concept**

**From Anthropic**: Balance between specificity and flexibility

**Current**: Only basic `complexity: 'low' | 'medium' | 'high'`

**Missing**:
- Specificity scoring (how detailed is this prompt?)
- Abstraction level (high-level vs implementation detail)
- Flexibility indicators (rigid rule vs flexible guideline)

#### 3. **No Sub-Prompt Composition**

**Problem**: Cannot model:
- Modular prompt components
- Reusable prompt templates
- Prompt inheritance/extension
- Dynamic prompt assembly

#### 4. **Flat Context Model**

**Current**: All nodes treated equally in context window

**Missing**:
- Priority/importance weighting
- Context budget allocation
- Just-in-time loading strategies
- Compaction indicators

#### 5. **Limited Categorization**

**Current**: 12 fixed categories

**Problem**: Real prompts need:
- Custom categories/taxonomies
- Multi-category assignment
- Category hierarchies (e.g., "Tool" > "Search Tool" > "Web Search")

#### 6. **No Scope Management**

**Missing**:
- Global vs local prompts
- Conditional prompts (activate based on context)
- Scoped overrides
- Namespace management

---

## Proposed Improvements

### 1. Enhanced Hierarchical Node Structure

```typescript
export interface HierarchicalPromptNode extends PromptNode {
  // Hierarchy
  parentId?: string;
  childIds: string[];
  depth: number; // 0 = root, 1 = first level, etc.
  path: string[]; // ['root', 'section1', 'subsection2']

  // Altitude & Specificity (Anthropic principle)
  altitude: PromptAltitude;
  specificity: number; // 0-1, how detailed
  flexibility: number; // 0-1, how strict

  // Scope & Context
  scope: PromptScope;
  contextPriority: number; // 0-100, for context budget
  activationConditions?: ActivationCondition[];

  // Composition
  isComposite: boolean; // true if composed of children
  compositionStrategy?: 'sequential' | 'parallel' | 'conditional';

  // Reusability
  isTemplate: boolean;
  templateVariables?: Record<string, string>;

  // Context Management
  tokenBudget?: number;
  compressionHint?: 'preserve' | 'summarize' | 'optional';
}

export enum PromptAltitude {
  META = 'meta',              // High-level philosophy/principles
  STRATEGIC = 'strategic',     // Strategic guidelines
  TACTICAL = 'tactical',       // Tactical instructions
  OPERATIONAL = 'operational', // Specific operations
  IMPLEMENTATION = 'implementation' // Detailed implementation
}

export enum PromptScope {
  GLOBAL = 'global',       // Apply to entire system
  SESSION = 'session',     // Apply to current session
  TASK = 'task',          // Apply to specific task
  LOCAL = 'local',        // Apply to immediate context
  CONDITIONAL = 'conditional' // Conditional activation
}

export interface ActivationCondition {
  type: 'context' | 'state' | 'trigger';
  condition: string;
  priority: number;
}
```

### 2. Hierarchical Category System

```typescript
export interface CategoryHierarchy {
  id: string;
  name: string;
  parentId?: string;
  description: string;
  color: string;
  icon?: string;
}

// Example hierarchy:
// Tools
//   ├── Search Tools
//   │   ├── Web Search
//   │   └── Document Search
//   ├── Analysis Tools
//   └── Communication Tools

export interface PromptCategory {
  primary: string;
  secondary?: string[];
  custom?: string[];
  hierarchy: string[]; // ['tools', 'search_tools', 'web_search']
}
```

### 3. Compositional Prompt System

```typescript
export interface CompositePrompt {
  id: string;
  name: string;
  description: string;
  components: PromptComponent[];
  assembly: AssemblyStrategy;

  // Context budget management
  totalTokenBudget: number;
  allocationStrategy: 'equal' | 'weighted' | 'dynamic';
}

export interface PromptComponent {
  nodeId: string;
  order: number;
  required: boolean;
  weight: number; // For context allocation
  conditionalLogic?: string;
}

export type AssemblyStrategy = {
  type: 'sequential' | 'parallel' | 'hierarchical' | 'conditional';
  configuration: Record<string, unknown>;
};
```

### 4. Context Window Management

```typescript
export interface ContextWindow {
  totalBudget: number; // Total tokens available
  used: number;
  remaining: number;

  // Allocated buckets
  allocations: ContextAllocation[];

  // Compaction strategy
  compactionEnabled: boolean;
  compactionThreshold: number; // 0-1, trigger when used > threshold
  preserveNodes: string[]; // Never compact these
}

export interface ContextAllocation {
  nodeId: string;
  allocated: number;
  used: number;
  priority: number;
  compressible: boolean;
}

export class ContextManager {
  /**
   * Allocate context budget based on priority and hierarchy
   */
  allocateBudget(
    nodes: HierarchicalPromptNode[],
    totalBudget: number
  ): ContextAllocation[];

  /**
   * Compact context by summarizing low-priority nodes
   */
  compact(
    allocations: ContextAllocation[],
    targetReduction: number
  ): CompactionResult;

  /**
   * Dynamic retrieval: fetch node content only when needed
   */
  retrieveJustInTime(
    nodeId: string,
    context: ExecutionContext
  ): string;
}
```

### 5. Sub-Agent Architecture Support

```typescript
export interface SubAgentDefinition {
  id: string;
  name: string;
  specialization: string;

  // Assigned prompts (scoped view of ontology)
  assignedNodeIds: string[];

  // Communication protocol
  inputFormat: string;
  outputFormat: string;

  // Coordination
  coordinatorId?: string;
  delegationStrategy: DelegationStrategy;
}

export interface DelegationStrategy {
  type: 'task_based' | 'domain_based' | 'complexity_based';
  criteria: Record<string, unknown>;
  handoffProtocol: string;
}
```

### 6. Enhanced Edge Types for Hierarchy

```typescript
export enum HierarchicalConnectionType extends ConnectionType {
  // Existing
  DEPENDS_ON = 'depends_on',
  EXTENDS = 'extends',
  // ... existing types

  // New hierarchical types
  PARENT_OF = 'parent_of',
  CHILD_OF = 'child_of',
  COMPOSES = 'composes',
  OVERRIDES = 'overrides',
  DELEGATES_TO = 'delegates_to',
  SPECIALIZES = 'specializes',
  GENERALIZES = 'generalizes',

  // Context management
  SHARES_CONTEXT = 'shares_context',
  ISOLATES_CONTEXT = 'isolates_context',
}
```

---

## Implementation Strategy

### Phase 1: Type System Enhancement (Week 1)

1. **Extend PromptNode with hierarchy fields**
   - Add parent/child tracking
   - Add altitude/specificity
   - Add scope management

2. **Create category hierarchy system**
   - Multi-level category support
   - Custom categories

3. **Update stores and utilities**
   - Extend Zustand store
   - Update conflict detector

### Phase 2: Compositional Features (Week 2)

1. **Implement CompositePrompt**
   - Component assembly
   - Template system
   - Variable substitution

2. **Add hierarchy visualization**
   - Tree view component
   - Expandable/collapsible nodes
   - Breadcrumb navigation

3. **Parent-child editing**
   - Nest/unnest operations
   - Drag-to-nest UI
   - Scope indicators

### Phase 3: Context Management (Week 3)

1. **Context budget tracking**
   - Token counting integration
   - Priority-based allocation
   - Real-time budget display

2. **Compaction engine**
   - Summarization strategies
   - Preservation rules
   - Restore mechanisms

3. **Just-in-time loading**
   - Lazy content loading
   - Reference system
   - Cache management

### Phase 4: Sub-Agent Support (Week 4)

1. **Sub-agent definition UI**
   - Agent creation wizard
   - Prompt assignment
   - Delegation configuration

2. **Coordination visualization**
   - Agent communication flow
   - Handoff points
   - Context sharing

3. **Testing framework**
   - Agent simulation
   - Integration testing

---

## Architectural Patterns for Complex Prompts

### Pattern 1: Layered Architecture

```
┌─────────────────────────────────────┐
│  Meta Layer (Altitude: META)        │ ← Global principles
│  "Always prioritize user privacy"   │
├─────────────────────────────────────┤
│  Strategic Layer (Altitude: STRATEGIC) │ ← High-level strategy
│  "Use tools when uncertain"         │
├─────────────────────────────────────┤
│  Tactical Layer (Altitude: TACTICAL)│ ← Specific guidelines
│  "Check weather before suggesting    │
│   outdoor activities"                │
├─────────────────────────────────────┤
│  Operational (Altitude: OPERATIONAL)│ ← Implementation
│  "Call get_weather(location, date)" │
└─────────────────────────────────────┘
```

### Pattern 2: Modular Composition

```typescript
const customerSupportPrompt = {
  global: ['company_values', 'brand_voice'],
  modules: [
    {
      name: 'greeting',
      components: ['tone_guidelines', 'personalization_rules']
    },
    {
      name: 'problem_solving',
      components: ['diagnostic_steps', 'solution_library', 'escalation_criteria']
    },
    {
      name: 'closing',
      components: ['satisfaction_check', 'follow_up_protocol']
    }
  ],
  conditionalModules: {
    'angry_customer': ['deescalation_tactics', 'empathy_framework'],
    'technical_issue': ['troubleshooting_guide', 'tool_usage'],
    'billing_question': ['billing_policies', 'refund_authority']
  }
};
```

### Pattern 3: Context-Aware Activation

```typescript
const contextAwarePrompt = {
  always: ['core_instructions', 'safety_guidelines'],

  whenContextContains: {
    'code': ['code_formatting_rules', 'language_specific_guidelines'],
    'data_analysis': ['statistical_methods', 'visualization_preferences'],
    'creative_writing': ['style_guidelines', 'tone_preferences']
  },

  whenTokenBudgetLow: {
    compress: ['background_info', 'examples'],
    preserve: ['safety_guidelines', 'core_instructions'],
    defer: ['optional_context']
  }
};
```

---

## Metrics & Analytics

Track these metrics for prompt hierarchy health:

```typescript
export interface HierarchyMetrics {
  // Structure
  maxDepth: number;
  avgDepth: number;
  totalNodes: number;
  leafNodes: number;

  // Balance
  balanceFactor: number; // How evenly distributed
  specificityRange: { min: number; max: number; avg: number };

  // Context
  totalTokens: number;
  avgTokensPerNode: number;
  budgetUtilization: number; // 0-1

  // Complexity
  cyclomaticComplexity: number;
  couplingScore: number;
  cohesionScore: number;

  // Quality
  orphanedNodes: number;
  redundancyScore: number;
  conflictDensity: number;
}
```

---

## Recommended Next Steps

### Immediate (This Week)

1. **Extend type system** with hierarchy fields
2. **Add altitude/specificity** to existing nodes
3. **Implement parent-child** tracking in store
4. **Create tree view** component

### Short-term (This Month)

1. **Build compositional system**
2. **Add context budget** tracking
3. **Implement scope** management
4. **Create hierarchy metrics**

### Long-term (Next Quarter)

1. **Sub-agent architecture**
2. **Just-in-time loading**
3. **Advanced compaction**
4. **Template library**

---

## Code Examples

### Example: Creating a Hierarchical Prompt

```typescript
const rootPrompt: HierarchicalPromptNode = {
  id: 'root-1',
  title: 'AI Assistant Core',
  content: 'You are a helpful AI assistant',
  category: { primary: 'role', secondary: [], hierarchy: ['role'] },

  // Hierarchy
  parentId: undefined,
  childIds: ['strategic-1', 'strategic-2'],
  depth: 0,
  path: ['root-1'],

  // Altitude
  altitude: PromptAltitude.META,
  specificity: 0.3,
  flexibility: 0.8,

  // Scope
  scope: PromptScope.GLOBAL,
  contextPriority: 100,

  // Composition
  isComposite: true,
  compositionStrategy: 'sequential',

  // Context
  tokenBudget: 500,
  compressionHint: 'preserve',

  // Standard fields
  metadata: { createdAt: new Date(), updatedAt: new Date(), complexity: 'low' },
  position: { x: 0, y: 0 }
};
```

### Example: Context Budget Allocation

```typescript
class SmartContextAllocator {
  allocate(nodes: HierarchicalPromptNode[], totalBudget: number): ContextAllocation[] {
    // 1. Reserve budget for high-priority (GLOBAL scope)
    const globalNodes = nodes.filter(n => n.scope === PromptScope.GLOBAL);
    const globalBudget = totalBudget * 0.3;

    // 2. Allocate by altitude (META gets more than IMPLEMENTATION)
    const altitudeBudget = this.allocateByAltitude(nodes, totalBudget * 0.4);

    // 3. Distribute remaining by priority
    const priorityBudget = this.allocateByPriority(nodes, totalBudget * 0.3);

    // 4. Merge allocations
    return this.mergeAllocations([globalBudget, altitudeBudget, priorityBudget]);
  }

  private allocateByAltitude(nodes: HierarchicalPromptNode[], budget: number) {
    const weights = {
      [PromptAltitude.META]: 0.3,
      [PromptAltitude.STRATEGIC]: 0.25,
      [PromptAltitude.TACTICAL]: 0.2,
      [PromptAltitude.OPERATIONAL]: 0.15,
      [PromptAltitude.IMPLEMENTATION]: 0.1
    };

    return nodes.map(node => ({
      nodeId: node.id,
      allocated: budget * (weights[node.altitude] / nodes.length),
      used: 0,
      priority: node.contextPriority,
      compressible: node.compressionHint !== 'preserve'
    }));
  }
}
```

---

## Conclusion

The current implementation provides solid foundations but requires these hierarchical enhancements to handle complex, real-world system prompts effectively. The proposed improvements align with Anthropic's context engineering principles:

✅ **Right Altitude**: Multi-level specificity management
✅ **Minimal Information**: Context budget and just-in-time loading
✅ **Hierarchical Organization**: Formal parent-child relationships
✅ **Sub-agent Architecture**: Delegation and specialization
✅ **Compaction**: Smart context window management

These improvements enable the system to scale from simple prompts to complex, production-grade AI agent architectures.
