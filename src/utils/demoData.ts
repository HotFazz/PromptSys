import {
  PromptNode,
  PromptEdge,
  PromptCategory,
  ConnectionType,
  PromptAltitude,
  PromptScope
} from '../types';

/**
 * Generate hierarchical demo data for testing the ontology graph
 * Demonstrates a realistic prompt hierarchy with altitude levels
 */
export function generateDemoData(): { nodes: PromptNode[]; edges: PromptEdge[] } {
  const timestamp = Date.now();

  const nodes: PromptNode[] = [
    // Level 1 - META: Root philosophy
    {
      id: `node-${timestamp}-1`,
      title: 'AI Assistant Philosophy',
      content: 'Core philosophy: Be helpful, harmless, and honest. Prioritize user safety and satisfaction while maintaining ethical boundaries. Guide all interactions with empathy and respect.',
      category: PromptCategory.OBJECTIVE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'low',
        tags: ['philosophy', 'core-values', 'root']
      },
      position: { x: 0, y: 0 },
      // Hierarchy fields
      parentId: undefined,
      childIds: [`node-${timestamp}-2`, `node-${timestamp}-3`],
      depth: 0,
      altitude: PromptAltitude.META,
      scope: PromptScope.GLOBAL,
      contextPriority: 95,
      specificity: 0.2,
      flexibility: 0.9,
      estimatedTokens: 180,
      compressionHint: 'preserve'
    },

    // Level 2 - STRATEGIC: Major domains
    {
      id: `node-${timestamp}-2`,
      title: 'Customer Support Role',
      content: 'You are a professional customer support AI assistant for TechCorp, specializing in cloud-based productivity tools. Your mission is to solve customer problems efficiently while building trust and loyalty.',
      category: PromptCategory.ROLE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['customer-support', 'techcorp', 'role-definition']
      },
      position: { x: -250, y: 200 },
      parentId: `node-${timestamp}-1`,
      childIds: [`node-${timestamp}-4`, `node-${timestamp}-5`],
      depth: 1,
      altitude: PromptAltitude.STRATEGIC,
      scope: PromptScope.SESSION,
      contextPriority: 85,
      specificity: 0.4,
      flexibility: 0.7,
      estimatedTokens: 220,
      compressionHint: 'preserve'
    },
    {
      id: `node-${timestamp}-3`,
      title: 'Safety & Ethics Guidelines',
      content: 'Maintain strict ethical boundaries. Protect user privacy and data. Never engage in harmful, illegal, or deceptive practices. Escalate when uncertain about ethical implications.',
      category: PromptCategory.GUARDRAIL,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['safety', 'ethics', 'guardrails']
      },
      position: { x: 250, y: 200 },
      parentId: `node-${timestamp}-1`,
      childIds: [`node-${timestamp}-6`],
      depth: 1,
      altitude: PromptAltitude.STRATEGIC,
      scope: PromptScope.GLOBAL,
      contextPriority: 90,
      specificity: 0.3,
      flexibility: 0.4,
      estimatedTokens: 200,
      compressionHint: 'preserve'
    },

    // Level 3 - TACTICAL: Specific guidelines
    {
      id: `node-${timestamp}-4`,
      title: 'Tone & Communication Style',
      content: 'Always maintain a friendly, professional, and empathetic tone. Use clear, concise language. Mirror the customer\'s level of technical knowledge. Active listening is key - acknowledge concerns before solving.',
      category: PromptCategory.INSTRUCTION,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['communication', 'style', 'tone']
      },
      position: { x: -400, y: 400 },
      parentId: `node-${timestamp}-2`,
      childIds: [],
      depth: 2,
      altitude: PromptAltitude.TACTICAL,
      scope: PromptScope.TASK,
      contextPriority: 70,
      specificity: 0.6,
      flexibility: 0.6,
      estimatedTokens: 240,
      compressionHint: 'summarize'
    },
    {
      id: `node-${timestamp}-5`,
      title: 'Response Structure',
      content: 'Structure all responses: 1) Acknowledge the issue empathetically, 2) Provide clear solution steps, 3) Verify understanding, 4) Offer additional help. Keep responses scannable with formatting.',
      category: PromptCategory.FORMAT,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['format', 'structure', 'workflow']
      },
      position: { x: -100, y: 400 },
      parentId: `node-${timestamp}-2`,
      childIds: [`node-${timestamp}-7`, `node-${timestamp}-8`],
      depth: 2,
      altitude: PromptAltitude.TACTICAL,
      scope: PromptScope.TASK,
      contextPriority: 75,
      specificity: 0.7,
      flexibility: 0.5,
      estimatedTokens: 200,
      compressionHint: 'summarize'
    },
    {
      id: `node-${timestamp}-6`,
      title: 'Prohibited Actions',
      content: 'NEVER: Make promises about unreleased features, provide refunds/billing changes without approval, share data from other accounts, engage with abusive users beyond 2 warnings, execute code or commands, or bypass security protocols.',
      category: PromptCategory.CONSTRAINT,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['constraints', 'prohibitions', 'safety']
      },
      position: { x: 250, y: 400 },
      parentId: `node-${timestamp}-3`,
      childIds: [`node-${timestamp}-9`],
      depth: 2,
      altitude: PromptAltitude.TACTICAL,
      scope: PromptScope.GLOBAL,
      contextPriority: 88,
      specificity: 0.8,
      flexibility: 0.2,
      estimatedTokens: 260,
      compressionHint: 'preserve'
    },

    // Level 4 - OPERATIONAL: Specific procedures
    {
      id: `node-${timestamp}-7`,
      title: 'Technical Issue Handling',
      content: 'For technical issues: 1) Ask for error messages/screenshots, 2) Check system status first, 3) Try standard fixes (cache clear, logout/login, browser update), 4) Document reproduction steps, 5) Escalate if unresolved after 3 attempts.',
      category: PromptCategory.WORKFLOW,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['technical-support', 'troubleshooting', 'procedure']
      },
      position: { x: -200, y: 600 },
      parentId: `node-${timestamp}-5`,
      childIds: [`node-${timestamp}-10`, `node-${timestamp}-11`],
      depth: 3,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.TASK,
      contextPriority: 65,
      specificity: 0.8,
      flexibility: 0.4,
      estimatedTokens: 280,
      compressionHint: 'summarize'
    },
    {
      id: `node-${timestamp}-8`,
      title: 'Escalation Criteria',
      content: 'Escalate to human agent when: customer frustrated after 2 interactions, billing dispute >$100, request for system-level changes, security incident suspected, customer requests human, or you\'re uncertain about solution.',
      category: PromptCategory.WORKFLOW,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['escalation', 'handoff', 'criteria']
      },
      position: { x: 0, y: 600 },
      parentId: `node-${timestamp}-5`,
      childIds: [],
      depth: 3,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.CONDITIONAL,
      contextPriority: 80,
      specificity: 0.9,
      flexibility: 0.3,
      estimatedTokens: 200,
      compressionHint: 'optional'
    },
    {
      id: `node-${timestamp}-9`,
      title: 'Data Privacy Rules',
      content: 'Strict privacy compliance: Only access customer\'s own account data. Never share PII in logs. Mask credit card numbers (show last 4 digits only). Delete sensitive data from conversation history. Follow GDPR/CCPA requirements.',
      category: PromptCategory.CONSTRAINT,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['privacy', 'compliance', 'data-protection']
      },
      position: { x: 250, y: 600 },
      parentId: `node-${timestamp}-6`,
      childIds: [],
      depth: 3,
      altitude: PromptAltitude.OPERATIONAL,
      scope: PromptScope.GLOBAL,
      contextPriority: 92,
      specificity: 0.9,
      flexibility: 0.1,
      estimatedTokens: 220,
      compressionHint: 'preserve'
    },

    // Level 5 - IMPLEMENTATION: Concrete examples
    {
      id: `node-${timestamp}-10`,
      title: 'Good Response Example',
      content: '"Hi Sarah! I understand how frustrating it must be to not receive your password reset email. Let me help you with that right away. First, could you check your spam/junk folder? Sometimes our emails end up there. If you don\'t see it, I can generate a new reset link for you - just confirm your email address is sarah@example.com and I\'ll send it immediately."',
      category: PromptCategory.EXAMPLE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'low',
        tags: ['example', 'best-practice', 'demonstration']
      },
      position: { x: -300, y: 800 },
      parentId: `node-${timestamp}-7`,
      childIds: [],
      depth: 4,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.LOCAL,
      contextPriority: 45,
      specificity: 1.0,
      flexibility: 0.2,
      estimatedTokens: 340,
      compressionHint: 'defer'
    },
    {
      id: `node-${timestamp}-11`,
      title: 'Bad Response Example',
      content: '"Your password reset isn\'t working. This is a known bug in our system that the developers haven\'t fixed yet. You\'ll need to contact our engineering team directly. Here\'s the CEO\'s email..." [PROBLEMS: dismissive tone, admits system flaws unprofessionally, inappropriate escalation, shares unauthorized contact info]',
      category: PromptCategory.EXAMPLE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'low',
        tags: ['example', 'anti-pattern', 'what-not-to-do']
      },
      position: { x: -100, y: 800 },
      parentId: `node-${timestamp}-7`,
      childIds: [],
      depth: 4,
      altitude: PromptAltitude.IMPLEMENTATION,
      scope: PromptScope.LOCAL,
      contextPriority: 40,
      specificity: 1.0,
      flexibility: 0.1,
      estimatedTokens: 320,
      compressionHint: 'defer'
    }
  ];

  const edges: PromptEdge[] = [
    // Parent-child hierarchy edges
    {
      id: `edge-${timestamp}-1`,
      source: nodes[0].id,
      target: nodes[1].id,
      type: ConnectionType.EXTENDS,
      label: 'defines role'
    },
    {
      id: `edge-${timestamp}-2`,
      source: nodes[0].id,
      target: nodes[2].id,
      type: ConnectionType.EXTENDS,
      label: 'sets boundaries'
    },
    {
      id: `edge-${timestamp}-3`,
      source: nodes[1].id,
      target: nodes[3].id,
      type: ConnectionType.EXTENDS,
      label: 'guides style'
    },
    {
      id: `edge-${timestamp}-4`,
      source: nodes[1].id,
      target: nodes[4].id,
      type: ConnectionType.EXTENDS,
      label: 'structures responses'
    },
    {
      id: `edge-${timestamp}-5`,
      source: nodes[2].id,
      target: nodes[5].id,
      type: ConnectionType.EXTENDS,
      label: 'constrains actions'
    },
    {
      id: `edge-${timestamp}-6`,
      source: nodes[4].id,
      target: nodes[6].id,
      type: ConnectionType.EXTENDS,
      label: 'technical procedures'
    },
    {
      id: `edge-${timestamp}-7`,
      source: nodes[4].id,
      target: nodes[7].id,
      type: ConnectionType.EXTENDS,
      label: 'escalation rules'
    },
    {
      id: `edge-${timestamp}-8`,
      source: nodes[5].id,
      target: nodes[8].id,
      type: ConnectionType.EXTENDS,
      label: 'privacy specifics'
    },
    {
      id: `edge-${timestamp}-9`,
      source: nodes[6].id,
      target: nodes[9].id,
      type: ConnectionType.VALIDATES,
      label: 'good example'
    },
    {
      id: `edge-${timestamp}-10`,
      source: nodes[6].id,
      target: nodes[10].id,
      type: ConnectionType.VALIDATES,
      label: 'bad example'
    },

    // Cross-references (non-hierarchical relationships)
    {
      id: `edge-${timestamp}-11`,
      source: nodes[3].id, // Tone
      target: nodes[9].id, // Good example
      type: ConnectionType.VALIDATES,
      label: 'demonstrates'
    },
    {
      id: `edge-${timestamp}-12`,
      source: nodes[5].id, // Prohibited actions
      target: nodes[10].id, // Bad example
      type: ConnectionType.RELATED_TO,
      label: 'illustrates violations'
    },
    {
      id: `edge-${timestamp}-13`,
      source: nodes[7].id, // Escalation
      target: nodes[6].id, // Technical handling
      type: ConnectionType.PRECEDES,
      label: 'follows if needed'
    }
  ];

  return { nodes, edges };
}
