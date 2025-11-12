/**
 * Demo data for agentic system ontology
 * Models a realistic multi-agent call center orchestrator system
 */

import {
  PromptNode,
  PromptEdge,
  PromptCategory,
  ConnectionType,
  PromptAltitude,
  PromptScope,
  PromptNodeType,
  InvocationStrategy,
  AgentRelationType
} from '../types';

export function generateAgenticDemoData(): { nodes: PromptNode[]; edges: PromptEdge[] } {
  const timestamp = Date.now();

  const nodes: PromptNode[] = [
    // ========================================================================
    // ORCHESTRATOR: Main coordinating agent
    // ========================================================================
    {
      id: `agent-orch-${timestamp}`,
      title: 'Customer Service Orchestrator',
      content: `You are a customer service orchestrator that coordinates specialized agents to provide excellent customer support.

Your role is to:
1. Analyze customer inquiries and route to appropriate specialized agents
2. Coordinate multiple agents when complex issues span different domains
3. Ensure consistent, professional responses across all interactions
4. Load on-demand skills when specialized capabilities are needed

You have access to:
- Customer Query Agent (for general questions and information)
- Order Management Agent (for order status, returns, modifications)
- Technical Support Agent (for product troubleshooting and technical issues)
- CRM System (for customer history and account information)
- Skills catalog (for email generation, knowledge base search, escalations)

Always prioritize customer satisfaction and efficient resolution.`,
      category: PromptCategory.ROLE,
      position: { x: 0, y: 0 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['orchestrator', 'customer-service', 'multi-agent']
      },
      nodeType: PromptNodeType.ORCHESTRATOR,
      invocationStrategy: InvocationStrategy.ALWAYS_LOADED,
      altitude: PromptAltitude.META,
      scope: PromptScope.GLOBAL,
      contextPriority: 100,
      estimatedTokens: 280,
      compressionHint: 'preserve',
      agentMetadata: {
        nodeType: PromptNodeType.ORCHESTRATOR,
        invocationStrategy: InvocationStrategy.ALWAYS_LOADED,
        capabilities: [
          'inquiry routing',
          'agent coordination',
          'quality assurance',
          'response synthesis'
        ],
        tools: [
          `agent-query-${timestamp}`,
          `agent-order-${timestamp}`,
          `agent-tech-${timestamp}`,
          `tool-crm-${timestamp}`
        ],
        model: 'gpt-4',
        temperature: 0.5,
        availability: 'always'
      }
    },

    // ========================================================================
    // SUB-AGENTS: Specialized delegate agents
    // ========================================================================
    {
      id: `agent-query-${timestamp}`,
      title: 'Customer Query Agent',
      content: `Specialized agent for handling general customer inquiries and providing information.

Capabilities:
- Product information and specifications
- Pricing and availability queries
- Store hours and location information
- General company policies and FAQs
- Account information requests

Returns accurate, friendly responses with appropriate tone.`,
      category: PromptCategory.TOOL,
      position: { x: -400, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['customer-query', 'sub-agent', 'information']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 85,
      estimatedTokens: 160,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          'product info',
          'FAQ responses',
          'policy explanations',
          'store information'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'handle_customer_query',
          description: 'Handle general customer questions and provide information',
          parameters: [
            {
              name: 'customer_question',
              type: 'string',
              description: 'The customer\'s question or inquiry',
              required: true
            },
            {
              name: 'customer_context',
              type: 'object',
              description: 'Optional context about the customer',
              required: false,
              properties: {
                customer_id: {
                  name: 'customer_id',
                  type: 'string',
                  description: 'Customer ID for personalization',
                  required: false
                },
                previous_interactions: {
                  name: 'previous_interactions',
                  type: 'number',
                  description: 'Number of previous support interactions',
                  required: false
                }
              }
            }
          ],
          examples: [
            {
              input: { customer_question: 'What are your store hours?' },
              description: 'Simple information request'
            }
          ]
        },
        availability: 'always'
      }
    },

    {
      id: `agent-order-${timestamp}`,
      title: 'Order Management Agent',
      content: `Specialized agent for order-related inquiries, modifications, and returns.

Capabilities:
- Order status tracking and updates
- Shipping information and delivery estimates
- Order modifications (address, items, quantity)
- Return and refund processing
- Cancellation requests
- Missing or damaged item resolution

Returns structured information with clear next steps.`,
      category: PromptCategory.TOOL,
      position: { x: 0, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['order-management', 'sub-agent', 'logistics']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 90,
      estimatedTokens: 200,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          'order tracking',
          'returns processing',
          'order modifications',
          'refund handling',
          'shipping updates'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'manage_order',
          description: 'Handle order status, modifications, returns, and shipping inquiries',
          parameters: [
            {
              name: 'action',
              type: 'string',
              description: 'Action to perform (status, modify, return, cancel)',
              required: true,
              enum: ['status', 'modify', 'return', 'cancel', 'track']
            },
            {
              name: 'order_id',
              type: 'string',
              description: 'Order number or identifier',
              required: true
            },
            {
              name: 'details',
              type: 'string',
              description: 'Additional details about the request',
              required: false
            }
          ],
          examples: [
            {
              input: {
                action: 'status',
                order_id: 'ORD-123456',
                details: 'Customer wants delivery estimate'
              },
              description: 'Check order status and shipping info'
            }
          ]
        },
        availability: 'always'
      }
    },

    {
      id: `agent-tech-${timestamp}`,
      title: 'Technical Support Agent',
      content: `Specialized agent for technical issues, troubleshooting, and product support.

Capabilities:
- Product setup and configuration guidance
- Troubleshooting common technical issues
- Software/firmware update instructions
- Compatibility verification
- Warranty information and claims
- Replacement part recommendations

Returns step-by-step troubleshooting guides and solutions.`,
      category: PromptCategory.TOOL,
      position: { x: 400, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['technical-support', 'sub-agent', 'troubleshooting']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 85,
      estimatedTokens: 190,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          'troubleshooting',
          'setup guidance',
          'compatibility checks',
          'warranty support',
          'technical diagnostics'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'technical_support',
          description: 'Provide technical troubleshooting and product support',
          parameters: [
            {
              name: 'issue_description',
              type: 'string',
              description: 'Description of the technical issue',
              required: true
            },
            {
              name: 'product_info',
              type: 'object',
              description: 'Product details',
              required: false,
              properties: {
                product_name: {
                  name: 'product_name',
                  type: 'string',
                  description: 'Product name or model',
                  required: false
                },
                serial_number: {
                  name: 'serial_number',
                  type: 'string',
                  description: 'Product serial number',
                  required: false
                }
              }
            }
          ],
          examples: [
            {
              input: {
                issue_description: 'Device won\'t turn on after charging',
                product_info: { product_name: 'SmartWatch Pro' }
              },
              description: 'Troubleshoot power issue'
            }
          ]
        },
        availability: 'always'
      }
    },

    // ========================================================================
    // NATIVE CAPABILITY: CRM Integration
    // ========================================================================
    {
      id: `tool-crm-${timestamp}`,
      title: 'CRM System Integration',
      content: `Native integration with Customer Relationship Management system.

Capabilities:
- Customer profile and history lookup
- Previous interaction records
- Purchase history and preferences
- Account status and tier information
- Contact information verification
- Note logging and case management

Access: Real-time data from production CRM database.`,
      category: PromptCategory.TOOL,
      position: { x: -200, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['crm', 'native', 'database', 'customer-data']
      },
      nodeType: PromptNodeType.NATIVE_CAPABILITY,
      invocationStrategy: InvocationStrategy.CONDITIONAL,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.CONDITIONAL,
      contextPriority: 80,
      estimatedTokens: 140,
      compressionHint: 'optional',
      agentMetadata: {
        nodeType: PromptNodeType.NATIVE_CAPABILITY,
        invocationStrategy: InvocationStrategy.CONDITIONAL,
        capabilities: [
          'customer lookup',
          'interaction history',
          'purchase records',
          'account management',
          'case logging'
        ],
        availability: 'conditional',
        catalogSummary: 'Access customer data and interaction history from CRM'
      }
    },

    // ========================================================================
    // SKILLS: On-demand capabilities
    // ========================================================================
    {
      id: `skill-email-${timestamp}`,
      title: 'Email Response Generator',
      content: `Generate professional, empathetic email responses for customer support.

Usage:
1. Gather issue details and resolution steps
2. Determine appropriate tone and urgency
3. Call this skill to generate polished email

Features:
- Professional business tone
- Empathy and personalization
- Clear structure with greeting, body, closing
- Action items and next steps
- Contact information and signatures

Output: Ready-to-send email text.`,
      category: PromptCategory.FORMAT,
      position: { x: 200, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['email', 'communication', 'skill', 'writing']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.LOCAL,
      contextPriority: 50,
      estimatedTokens: 1800,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: ['email', 'write email', 'send email', 'email response', 'compose'],
        catalogSummary: 'Generate professional email responses with appropriate tone',
        exampleUsage: 'load_skill("skill-email") when email communication needed',
        toolSchema: {
          name: 'generate_email_response',
          description: 'Create a professional email response',
          parameters: [
            {
              name: 'situation',
              type: 'string',
              description: 'Brief description of the customer situation',
              required: true
            },
            {
              name: 'resolution',
              type: 'string',
              description: 'How the issue was or will be resolved',
              required: true
            },
            {
              name: 'tone',
              type: 'string',
              description: 'Email tone (apologetic, informative, friendly)',
              required: false,
              enum: ['apologetic', 'informative', 'friendly', 'formal'],
              default: 'friendly'
            }
          ]
        },
        loadPriority: 60,
        availability: 'always'
      }
    },

    {
      id: `skill-kb-${timestamp}`,
      title: 'Knowledge Base Search',
      content: `Search internal knowledge base for relevant articles, policies, and procedures.

Usage:
1. Identify information need or customer question
2. Formulate search query
3. Call this skill to retrieve relevant documentation

Capabilities:
- Full-text search across all documentation
- Policy and procedure lookup
- Product manuals and guides
- Troubleshooting articles
- Best practices and tips

Output: Relevant articles with summaries and links.`,
      category: PromptCategory.TOOL,
      position: { x: 400, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['knowledge-base', 'search', 'skill', 'documentation']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 70,
      estimatedTokens: 2100,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: ['kb', 'knowledge base', 'search docs', 'find article', 'documentation', 'policy'],
        catalogSummary: 'Search internal knowledge base for policies, guides, and articles',
        exampleUsage: 'load_skill("skill-kb") to find relevant documentation',
        loadPriority: 75,
        availability: 'always'
      }
    },

    {
      id: `skill-escalate-${timestamp}`,
      title: 'Escalation Handler',
      content: `Handle escalations to human agents and management with proper context transfer.

Usage:
1. Determine escalation is necessary (complex issue, angry customer, policy exception)
2. Prepare escalation context and summary
3. Call this skill to initiate escalation workflow

Features:
- Priority routing based on severity
- Complete context transfer to human agent
- Customer sentiment analysis
- Escalation reason documentation
- SLA tracking and notifications

Output: Escalation ticket with routing information.`,
      category: PromptCategory.WORKFLOW,
      position: { x: 0, y: 800 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['escalation', 'workflow', 'skill', 'human-handoff']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.TACTICAL,
      scope: PromptScope.TASK,
      contextPriority: 85,
      estimatedTokens: 2600,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: [
          'escalate',
          'manager',
          'supervisor',
          'human agent',
          'talk to person',
          'speak to representative'
        ],
        catalogSummary: 'Escalate complex issues to human agents with full context',
        exampleUsage: 'load_skill("skill-escalate") when human intervention needed',
        dependencies: [`tool-crm-${timestamp}`],
        loadPriority: 90,
        availability: 'always'
      }
    }
  ];

  const edges: PromptEdge[] = [
    // Orchestrator → Sub-agents
    {
      id: `edge-orch-query-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-query-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'routes general inquiries',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 1200
    },
    {
      id: `edge-orch-order-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-order-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'routes order issues',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 1500
    },
    {
      id: `edge-orch-tech-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-tech-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'routes technical support',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 2000
    },

    // Orchestrator → Native capability
    {
      id: `edge-orch-crm-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `tool-crm-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'accesses customer data',
      agentRelationType: AgentRelationType.USES_TOOL,
      conditional: 'when customer context needed',
      invocationCount: 0,
      avgLatency: 800
    },

    // Orchestrator → Skills (on-demand)
    {
      id: `edge-orch-email-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-email-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when email response needed',
      invocationCount: 0
    },
    {
      id: `edge-orch-kb-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-kb-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when documentation lookup needed',
      invocationCount: 0
    },
    {
      id: `edge-orch-escalate-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-escalate-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when escalation required',
      invocationCount: 0
    },

    // Skill dependencies
    {
      id: `edge-escalate-crm-${timestamp}`,
      source: `skill-escalate-${timestamp}`,
      target: `tool-crm-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'requires',
      agentRelationType: AgentRelationType.DEPENDS_ON
    }
  ];

  return { nodes, edges };
}
