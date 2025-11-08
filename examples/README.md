# Example System Prompts

This directory contains sample system prompts to test the PromptSys ontology application.

## sample-prompt.md

A comprehensive customer support AI system prompt that demonstrates:

- **Role Definition**: Clear persona and context
- **Objectives**: Primary goals and purposes
- **Constraints**: Limitations and guardrails
- **Instructions**: Step-by-step procedures
- **Examples**: Demonstrations of good/bad responses
- **Format Requirements**: Output formatting rules

### Expected Ontology Structure

When analyzed, this prompt should generate nodes for:

1. **Role**: Customer support assistant definition
2. **Objectives**: Customer satisfaction and accuracy goals
3. **Constraints**: Things the AI cannot do
4. **Workflows**: Password reset and account access procedures
5. **Examples**: Good vs. bad response demonstrations
6. **Format**: Response structure requirements
7. **Guardrails**: Safety and ethics guidelines

### Expected Connections

- Role → Objectives (depends_on)
- Objectives → Behavioral Guidelines (extends)
- Constraints → Escalation Criteria (related_to)
- Workflows → Examples (validates)
- Safety → All other nodes (modifies)

### Expected Conflicts

The analyzer might detect:
- Potential ambiguity between "professional" and "friendly" tone
- Constraint conflicts if guidelines contradict limitations

## How to Use

1. Start the PromptSys application
2. Enter your OpenAI API key
3. Upload or paste the `sample-prompt.md` content
4. Click "Analyze"
5. Explore the generated ontology graph
6. Review any detected conflicts
7. Edit nodes and connections as needed
