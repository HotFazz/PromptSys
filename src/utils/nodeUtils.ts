/**
 * Utility functions for node management
 */

import { PromptNode, PromptCategory, PromptAltitude, PromptScope, PromptNodeType } from '../types';

/**
 * Generate a unique node ID
 */
export function generateNodeId(prefix: string = 'node'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique edge ID
 */
export function generateEdgeId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `edge-${timestamp}-${random}`;
}

/**
 * Create a base node with defaults
 */
export function createBaseNode(
  title: string,
  content: string,
  category: PromptCategory = PromptCategory.UNCATEGORIZED
): Partial<PromptNode> {
  return {
    title,
    content,
    category,
    altitude: PromptAltitude.TACTICAL,
    scope: PromptScope.TASK,
    contextPriority: 50,
    estimatedTokens: Math.ceil(content.length / 4), // Rough estimate: 4 chars per token
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    },
    position: {
      x: Math.random() * 400 - 200, // Random position near center
      y: Math.random() * 400 - 200
    }
  };
}

/**
 * Validate node data before creation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNodeData(node: Partial<PromptNode>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!node.title || node.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (node.title && node.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  if (!node.content || node.content.trim().length === 0) {
    errors.push('Content is required');
  }

  // Tool schema validation (if present)
  if (node.agentMetadata?.toolSchema) {
    const schema = node.agentMetadata.toolSchema;

    if (!schema.name || schema.name.trim().length === 0) {
      errors.push('Tool schema name is required');
    }

    // Valid function name regex
    if (schema.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema.name)) {
      errors.push('Tool schema name must be a valid identifier (letters, numbers, underscores, no spaces)');
    }

    if (!schema.description || schema.description.trim().length === 0) {
      errors.push('Tool schema description is required');
    }

    // Validate parameters
    if (schema.parameters) {
      schema.parameters.forEach((param, index) => {
        if (!param.name || param.name.trim().length === 0) {
          errors.push(`Parameter ${index + 1}: name is required`);
        }
        if (!param.type) {
          errors.push(`Parameter ${index + 1}: type is required`);
        }
        if (!param.description || param.description.trim().length === 0) {
          errors.push(`Parameter ${index + 1}: description is required`);
        }
      });
    }
  }

  // Node type specific validation
  if (node.nodeType) {
    // Skills should have triggers
    if (node.nodeType === PromptNodeType.SKILL) {
      if (!node.agentMetadata?.triggers || node.agentMetadata.triggers.length === 0) {
        errors.push('Skills should have at least one trigger keyword');
      }
    }

    // Function-callable agents should have tool schema
    if (
      node.invocationStrategy === 'function_call' &&
      (node.nodeType === PromptNodeType.SUBAGENT ||
        node.nodeType === PromptNodeType.TOOL ||
        node.nodeType === PromptNodeType.FUNCTION)
    ) {
      if (!node.agentMetadata?.toolSchema) {
        errors.push('Function-callable agents must have a tool schema defined');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate automatic layout position for new nodes
 */
export function calculateNewNodePosition(existingNodes: PromptNode[], nodeType?: PromptNodeType): { x: number; y: number } {
  if (existingNodes.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find the rightmost and bottommost positions
  let maxX = Math.max(...existingNodes.map(n => n.position.x));
  let maxY = Math.max(...existingNodes.map(n => n.position.y));

  // Position based on node type for better organization
  switch (nodeType) {
    case PromptNodeType.ORCHESTRATOR:
      return { x: 0, y: -100 }; // Top center

    case PromptNodeType.SUBAGENT:
      return { x: maxX + 450, y: 200 }; // Middle right

    case PromptNodeType.SKILL:
      return { x: maxX + 450, y: maxY + 250 }; // Bottom right

    case PromptNodeType.TOOL:
    case PromptNodeType.NATIVE_CAPABILITY:
      return { x: -400, y: maxY + 250 }; // Bottom left

    default:
      return { x: maxX + 400, y: maxY + 200 }; // Default: offset from existing
  }
}
