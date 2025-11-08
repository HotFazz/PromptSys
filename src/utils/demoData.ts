import { PromptNode, PromptEdge, PromptCategory, ConnectionType } from '../types';

/**
 * Generate demo data for testing the ontology graph
 */
export function generateDemoData(): { nodes: PromptNode[]; edges: PromptEdge[] } {
  const timestamp = Date.now();

  const nodes: PromptNode[] = [
    {
      id: `node-${timestamp}-1`,
      title: 'Customer Support Role',
      content: 'You are a professional customer support AI assistant for TechCorp, specializing in cloud-based productivity tools.',
      category: PromptCategory.ROLE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'low',
        tags: ['customer-support', 'techcorp']
      },
      position: { x: 0, y: 0 }
    },
    {
      id: `node-${timestamp}-2`,
      title: 'Primary Objective',
      content: 'Provide helpful, accurate, and empathetic customer support while maintaining brand consistency and ensuring customer satisfaction.',
      category: PromptCategory.OBJECTIVE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['goal', 'customer-satisfaction']
      },
      position: { x: 0, y: 200 }
    },
    {
      id: `node-${timestamp}-3`,
      title: 'Tone Guidelines',
      content: 'Always maintain a friendly, professional, and empathetic tone. Use clear, concise language. Avoid technical jargon unless the customer demonstrates technical knowledge.',
      category: PromptCategory.INSTRUCTION,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['communication', 'style']
      },
      position: { x: -300, y: 400 }
    },
    {
      id: `node-${timestamp}-4`,
      title: 'Response Requirements',
      content: 'You must acknowledge the customer\'s concern in every response. Provide step-by-step solutions when addressing technical issues. Always offer follow-up assistance.',
      category: PromptCategory.CONSTRAINT,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['requirements', 'validation']
      },
      position: { x: 300, y: 400 }
    },
    {
      id: `node-${timestamp}-5`,
      title: 'Prohibited Actions',
      content: 'Never make promises about features that don\'t exist. Do not provide refunds or billing changes without manager approval. Never share sensitive customer data from other accounts.',
      category: PromptCategory.GUARDRAIL,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'high',
        tags: ['safety', 'constraints']
      },
      position: { x: -300, y: 600 }
    },
    {
      id: `node-${timestamp}-6`,
      title: 'Escalation Criteria',
      content: 'Escalate to a human agent when: customer is angry or frustrated after 2 responses, issue involves billing disputes over $100, request requires system-level changes.',
      category: PromptCategory.WORKFLOW,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'medium',
        tags: ['workflow', 'escalation']
      },
      position: { x: 300, y: 600 }
    },
    {
      id: `node-${timestamp}-7`,
      title: 'Good Response Example',
      content: '"I understand how frustrating it must be to not receive your password reset email. Let me help you with that. First, could you check your spam folder? If it\'s not there, I can generate a new reset link for you right away."',
      category: PromptCategory.EXAMPLE,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        complexity: 'low',
        tags: ['example', 'best-practice']
      },
      position: { x: 0, y: 800 }
    }
  ];

  const edges: PromptEdge[] = [
    {
      id: `edge-${timestamp}-1`,
      source: nodes[0].id,
      target: nodes[1].id,
      type: ConnectionType.DEPENDS_ON,
      label: 'defines purpose'
    },
    {
      id: `edge-${timestamp}-2`,
      source: nodes[1].id,
      target: nodes[2].id,
      type: ConnectionType.EXTENDS,
      label: 'guides communication'
    },
    {
      id: `edge-${timestamp}-3`,
      source: nodes[1].id,
      target: nodes[3].id,
      type: ConnectionType.EXTENDS,
      label: 'sets requirements'
    },
    {
      id: `edge-${timestamp}-4`,
      source: nodes[2].id,
      target: nodes[4].id,
      type: ConnectionType.RELATED_TO,
      label: 'balanced by'
    },
    {
      id: `edge-${timestamp}-5`,
      source: nodes[3].id,
      target: nodes[5].id,
      type: ConnectionType.PRECEDES,
      label: 'determines when'
    },
    {
      id: `edge-${timestamp}-6`,
      source: nodes[2].id,
      target: nodes[6].id,
      type: ConnectionType.VALIDATES,
      label: 'demonstrated by'
    },
    {
      id: `edge-${timestamp}-7`,
      source: nodes[3].id,
      target: nodes[6].id,
      type: ConnectionType.VALIDATES,
      label: 'shown in'
    }
  ];

  return { nodes, edges };
}
