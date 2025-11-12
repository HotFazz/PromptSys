/**
 * Demo data for agentic system ontology
 * Models a realistic multi-agent orchestrator with sub-agents, tools, and skills
 * Based on patterns from production agentic systems like SIBEL
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
      title: 'Financial Analysis Orchestrator',
      content: `You are a financial analysis orchestrator that coordinates multiple specialized agents to provide comprehensive market insights.

Your role is to:
1. Plan and execute research tasks by delegating to specialized sub-agents
2. Coordinate parallel data gathering operations for efficiency
3. Synthesize findings from multiple sources into cohesive insights
4. Load on-demand skills when specialized analysis is needed

You have access to:
- SEC Edgar Agent (for filing retrieval and analysis)
- Market Data Agent (for real-time quotes and historical data)
- Web Research Agent (for current events and documentation)
- Code Execution (for data analysis and visualization)
- Skills catalog (for specialized capabilities like report generation)

Always maximize parallelization and trust specialized agents for their domains.`,
      category: PromptCategory.ROLE,
      position: { x: 0, y: 0 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['orchestrator', 'financial-analysis', 'multi-agent']
      },
      nodeType: PromptNodeType.ORCHESTRATOR,
      invocationStrategy: InvocationStrategy.ALWAYS_LOADED,
      altitude: PromptAltitude.META,
      scope: PromptScope.GLOBAL,
      contextPriority: 100,
      estimatedTokens: 320,
      compressionHint: 'preserve',
      agentMetadata: {
        nodeType: PromptNodeType.ORCHESTRATOR,
        invocationStrategy: InvocationStrategy.ALWAYS_LOADED,
        capabilities: [
          'task planning',
          'agent coordination',
          'parallel execution',
          'data synthesis'
        ],
        tools: [
          `agent-sec-${timestamp}`,
          `agent-market-${timestamp}`,
          `agent-web-${timestamp}`,
          `tool-code-${timestamp}`
        ],
        model: 'gpt-4',
        temperature: 0.3,
        availability: 'always'
      }
    },

    // ========================================================================
    // SUB-AGENTS: Specialized delegate agents
    // ========================================================================
    {
      id: `agent-sec-${timestamp}`,
      title: 'SEC Edgar Research Agent',
      content: `Specialized agent for retrieving and analyzing SEC EDGAR filings (10-K, 10-Q, 8-K).

Capabilities:
- Precise retrieval of specific sections and line items
- Citation with exact filing, section, and link
- Focus on authoritative primary sources

Returns structured findings with citations.`,
      category: PromptCategory.TOOL,
      position: { x: -400, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['sec', 'filings', 'sub-agent', 'edgar']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 85,
      estimatedTokens: 180,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          '10-K/10-Q retrieval',
          'section extraction',
          'citation generation',
          'footnote analysis'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'sec_edgar_research',
          description: 'Retrieve SEC EDGAR filings and extract relevant sections with citations',
          parameters: [
            {
              name: 'objective',
              type: 'string',
              description: 'Plain-language task (include ticker, filing type, sections needed)',
              required: true
            }
          ],
          examples: [
            {
              input: { objective: 'Get Microsoft Q3 2024 revenue from 10-Q' },
              description: 'Retrieve specific metric from quarterly filing'
            }
          ]
        },
        availability: 'always'
      }
    },

    {
      id: `agent-market-${timestamp}`,
      title: 'Market Data Agent',
      content: `Specialized agent for real-time market data, company fundamentals, and economic indicators via Alpha Vantage.

Capabilities:
- Real-time quotes and historical OHLCV data
- Company financials (income statement, balance sheet, cash flow)
- Economic indicators (GDP, CPI, unemployment, Fed rates)
- FX rates and commodities

Can return large datasets as file envelopes for analysis.`,
      category: PromptCategory.TOOL,
      position: { x: 0, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['market-data', 'sub-agent', 'alpha-vantage', 'real-time']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 80,
      estimatedTokens: 200,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          'real-time quotes',
          'historical data',
          'company fundamentals',
          'macro indicators',
          'file download'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'stock_market_research',
          description: 'Access market data, fundamentals, and economic indicators',
          parameters: [
            {
              name: 'objective',
              type: 'string',
              description: 'Task for the subagent (quotes, historical data, fundamentals, etc.)',
              required: true
            },
            {
              name: 'symbols',
              type: 'array',
              description: 'Tickers or currencies (optional, can be in objective)',
              required: false,
              items: {
                name: 'symbol',
                type: 'string',
                description: 'Stock ticker or currency pair',
                required: false
              }
            },
            {
              name: 'file_download',
              type: 'boolean',
              description: 'Download file for data analysis (default: false)',
              required: false,
              default: false
            }
          ],
          examples: [
            {
              input: {
                objective: 'Get AAPL daily prices for last 30 days',
                symbols: ['AAPL'],
                file_download: true
              },
              description: 'Download historical data for analysis'
            }
          ]
        },
        availability: 'always'
      }
    },

    {
      id: `agent-web-${timestamp}`,
      title: 'Web Research Agent',
      content: `Specialized agent for gathering current information from the web using OpenAI web search.

Capabilities:
- Real-time information retrieval
- Current events and news
- Technical documentation
- Market commentary

Returns comprehensive answers with citations.`,
      category: PromptCategory.TOOL,
      position: { x: 400, y: 300 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['web-search', 'sub-agent', 'research']
      },
      nodeType: PromptNodeType.SUBAGENT,
      invocationStrategy: InvocationStrategy.FUNCTION_CALL,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 70,
      estimatedTokens: 150,
      compressionHint: 'summarize',
      agentMetadata: {
        nodeType: PromptNodeType.SUBAGENT,
        invocationStrategy: InvocationStrategy.FUNCTION_CALL,
        capabilities: [
          'web search',
          'current events',
          'documentation lookup',
          'fact checking'
        ],
        model: 'gpt-4-turbo',
        toolSchema: {
          name: 'web_search',
          description: 'Search the web for current information with citations',
          parameters: [
            {
              name: 'objective',
              type: 'string',
              description: 'Plain-language search task',
              required: true
            }
          ],
          examples: [
            {
              input: { objective: 'Find latest news about Apple AI initiatives' },
              description: 'Current events search'
            }
          ]
        },
        availability: 'always'
      }
    },

    // ========================================================================
    // NATIVE CAPABILITY: Code Interpreter
    // ========================================================================
    {
      id: `tool-code-${timestamp}`,
      title: 'Code Interpreter',
      content: `Native Python code execution capability with full conversation context.

Capabilities:
- Data analysis with pandas, numpy, scipy
- Visualizations with matplotlib, seaborn, plotly
- Statistical modeling with sklearn, statsmodels
- Direct access to FileEnvelopes from market data agent
- Iterative refinement with context preservation

Environment: Sandboxed container with /mnt/data/ for file storage.`,
      category: PromptCategory.TOOL,
      position: { x: -200, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['code-execution', 'native', 'python', 'data-analysis']
      },
      nodeType: PromptNodeType.NATIVE_CAPABILITY,
      invocationStrategy: InvocationStrategy.CONDITIONAL,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.CONDITIONAL,
      contextPriority: 75,
      estimatedTokens: 160,
      compressionHint: 'optional',
      agentMetadata: {
        nodeType: PromptNodeType.NATIVE_CAPABILITY,
        invocationStrategy: InvocationStrategy.CONDITIONAL,
        capabilities: [
          'Python execution',
          'data analysis',
          'visualization',
          'file access',
          'iterative analysis'
        ],
        availability: 'conditional',
        catalogSummary: 'Execute Python code for analysis and visualization'
      }
    },

    // ========================================================================
    // SKILLS: On-demand capabilities
    // ========================================================================
    {
      id: `skill-word-${timestamp}`,
      title: 'Word Document Export',
      content: `Generate professional Word documents (.docx) with formatted content, tables, and charts.

Usage:
1. Gather and prepare content
2. Structure sections and tables
3. Call this skill to generate .docx file

Supports:
- Multiple sections with hierarchical headings
- Tables with styling
- Embedded charts and images
- Custom formatting and styles

Output: Returns .docx file reference for download.`,
      category: PromptCategory.FORMAT,
      position: { x: 200, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['export', 'word', 'docx', 'skill', 'report']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.LOCAL,
      contextPriority: 50,
      estimatedTokens: 2400,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: ['word', 'docx', 'document', 'export', 'report', '.docx'],
        catalogSummary: 'Generate formatted Word documents with tables and charts',
        exampleUsage: 'load_skill("skill-word") when user requests Word export',
        toolSchema: {
          name: 'generate_word_document',
          description: 'Create a formatted Word document',
          parameters: [
            {
              name: 'title',
              type: 'string',
              description: 'Document title',
              required: true
            },
            {
              name: 'sections',
              type: 'array',
              description: 'Document sections',
              required: true,
              items: {
                name: 'section',
                type: 'object',
                description: 'Section with heading and content',
                required: true,
                properties: {
                  heading: {
                    name: 'heading',
                    type: 'string',
                    description: 'Section heading',
                    required: true
                  },
                  content: {
                    name: 'content',
                    type: 'string',
                    description: 'Section content (markdown supported)',
                    required: true
                  }
                }
              }
            }
          ]
        },
        loadPriority: 60,
        availability: 'always'
      }
    },

    {
      id: `skill-pdf-${timestamp}`,
      title: 'PDF Report Generation',
      content: `Generate professional PDF reports with charts, tables, and formatted text.

Usage:
1. Prepare report content and visualizations
2. Structure layout and sections
3. Call this skill to generate PDF

Features:
- Professional templates
- Embedded charts and images
- Table of contents
- Page numbering and headers/footers

Output: Returns PDF file reference for download.`,
      category: PromptCategory.FORMAT,
      position: { x: 400, y: 600 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['export', 'pdf', 'skill', 'report']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.LOCAL,
      contextPriority: 45,
      estimatedTokens: 2200,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: ['pdf', 'report', 'export', '.pdf', 'download pdf'],
        catalogSummary: 'Generate professional PDF reports with charts and tables',
        exampleUsage: 'load_skill("skill-pdf") when user wants PDF export',
        loadPriority: 55,
        availability: 'always'
      }
    },

    {
      id: `skill-advanced-${timestamp}`,
      title: 'Advanced Financial Analysis',
      content: `Perform sophisticated financial analysis including:

- DCF valuation models
- Monte Carlo simulations
- Risk analysis (VaR, CVaR)
- Portfolio optimization
- Regression analysis
- Time series forecasting

Requires:
- Historical data from market agent
- Company fundamentals
- Code interpreter for calculations

Output: Detailed analysis with visualizations and insights.`,
      category: PromptCategory.WORKFLOW,
      position: { x: 0, y: 800 },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['analysis', 'valuation', 'skill', 'financial-modeling']
      },
      nodeType: PromptNodeType.SKILL,
      invocationStrategy: InvocationStrategy.ON_DEMAND,
      altitude: PromptAltitude.TACTICAL,
      scope: PromptScope.TASK,
      contextPriority: 65,
      estimatedTokens: 3500,
      compressionHint: 'defer',
      agentMetadata: {
        nodeType: PromptNodeType.SKILL,
        invocationStrategy: InvocationStrategy.ON_DEMAND,
        triggers: [
          'dcf',
          'valuation',
          'monte carlo',
          'var',
          'risk analysis',
          'portfolio optimization',
          'forecasting'
        ],
        catalogSummary: 'Advanced financial modeling: DCF, Monte Carlo, risk analysis, optimization',
        exampleUsage: 'load_skill("skill-advanced") for complex financial analysis',
        dependencies: [`tool-code-${timestamp}`, `agent-market-${timestamp}`],
        loadPriority: 70,
        availability: 'always'
      }
    }
  ];

  const edges: PromptEdge[] = [
    // Orchestrator → Sub-agents
    {
      id: `edge-orch-sec-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-sec-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'delegates filing research',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 2500
    },
    {
      id: `edge-orch-market-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-market-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'delegates market data',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 1800
    },
    {
      id: `edge-orch-web-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `agent-web-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'delegates web research',
      agentRelationType: AgentRelationType.ORCHESTRATES,
      invocationCount: 0,
      avgLatency: 3200
    },

    // Orchestrator → Native capability
    {
      id: `edge-orch-code-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `tool-code-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'uses for analysis',
      agentRelationType: AgentRelationType.USES_TOOL,
      conditional: 'when code execution is needed',
      invocationCount: 0,
      avgLatency: 5000
    },

    // Orchestrator → Skills (on-demand)
    {
      id: `edge-orch-word-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-word-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when Word export requested',
      invocationCount: 0
    },
    {
      id: `edge-orch-pdf-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-pdf-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when PDF export requested',
      invocationCount: 0
    },
    {
      id: `edge-orch-advanced-${timestamp}`,
      source: `agent-orch-${timestamp}`,
      target: `skill-advanced-${timestamp}`,
      type: ConnectionType.RELATED_TO,
      label: 'loads on demand',
      agentRelationType: AgentRelationType.LOADS_SKILL,
      conditional: 'when advanced analysis requested',
      invocationCount: 0
    },

    // Skill dependencies
    {
      id: `edge-advanced-code-${timestamp}`,
      source: `skill-advanced-${timestamp}`,
      target: `tool-code-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'requires',
      agentRelationType: AgentRelationType.DEPENDS_ON
    },
    {
      id: `edge-advanced-market-${timestamp}`,
      source: `skill-advanced-${timestamp}`,
      target: `agent-market-${timestamp}`,
      type: ConnectionType.DEPENDS_ON,
      label: 'requires',
      agentRelationType: AgentRelationType.DEPENDS_ON
    }
  ];

  return { nodes, edges };
}
