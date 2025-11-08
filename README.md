# PromptSys - System Prompts Ontology Designer

An interactive web application built with TypeScript and React for analyzing, structuring, and visualizing AI system prompts as an interconnected ontology graph.

## Features

- **AI-Powered Analysis**: Uses OpenAI's API to automatically categorize and structure system prompts
- **Interactive Graph Visualization**: Built with React Flow for a Visio-like editing experience
- **Markdown Support**: Parse and analyze system prompts from markdown files
- **Real-time Conflict Detection**: Automatically identifies contradictions, circular dependencies, and other issues
- **Editable Nodes**: Modify prompts directly in the graph interface
- **Connection Management**: Add, remove, and modify relationships between prompt components
- **Visual Warnings**: Conflicts are highlighted with detailed explanations and suggestions

## Architecture

### Core Components

1. **Type System** (`src/types/index.ts`)
   - Comprehensive TypeScript definitions for nodes, edges, and conflicts
   - 12 prompt categories (instruction, context, constraint, etc.)
   - 7 connection types (depends_on, extends, conflicts_with, etc.)

2. **State Management** (`src/stores/ontologyStore.ts`)
   - Zustand-based global state
   - Manages nodes, edges, conflicts, and UI state

3. **AI Integration** (`src/services/openaiService.ts`)
   - OpenAI API integration for prompt analysis
   - Auto-categorization and relationship detection
   - Layout suggestions using hierarchical algorithms

4. **Conflict Detection** (`src/utils/conflictDetector.ts`)
   - Circular dependency detection using DFS
   - Semantic conflict analysis
   - Duplicate content detection
   - Orphaned node identification

5. **Markdown Parser** (`src/utils/markdownParser.ts`)
   - Parse markdown into structured sections
   - Detect prompt patterns
   - Extract metadata from frontmatter

### React Components

- **App.tsx**: Main application container
- **SidePanel.tsx**: Collapsible input panel with API key management
- **OntologyGraph.tsx**: React Flow graph visualization
- **PromptNode.tsx**: Custom node component with inline editing
- **ConflictPanel.tsx**: Warning panel for detected conflicts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Enter API Key**: Add your OpenAI API key in the side panel (stored locally only)

2. **Input Prompts**: Either:
   - Paste system prompts directly into the text area
   - Upload a markdown file

3. **Analyze**: Click "Analyze Prompts" to generate the ontology

4. **Edit**:
   - Click the edit icon on any node to modify its content
   - Drag nodes to reposition them
   - Connect nodes by dragging from the bottom handle to another node's top handle
   - Delete nodes using the X button

5. **Review Conflicts**: Check the conflict panel for any detected issues

## Prompt Categories

- **Instruction**: Direct commands or instructions
- **Context**: Background information or context setting
- **Constraint**: Limitations, rules, or guardrails
- **Example**: Examples or demonstrations
- **Role**: Role or persona definitions
- **Objective**: Goals or desired outcomes
- **Format**: Output format specifications
- **Persona**: Character or behavioral traits
- **Guardrail**: Safety or ethical constraints
- **Tool**: Tool usage instructions
- **Workflow**: Process or step definitions
- **Uncategorized**: Default category

## Connection Types

- **depends_on**: Node A requires Node B
- **extends**: Node A builds upon Node B
- **conflicts_with**: Node A contradicts Node B
- **related_to**: Semantic relationship
- **precedes**: Node A should come before Node B
- **validates**: Node A validates Node B
- **modifies**: Node A modifies Node B's behavior

## Conflict Detection

The system automatically detects:

1. **Circular Dependencies**: Using depth-first search to find cycles
2. **Contradictory Instructions**: Semantic analysis of conflicting requirements
3. **Orphaned Nodes**: Unconnected components
4. **Duplicate Content**: High similarity between nodes
5. **Ambiguous Relationships**: Conflicting edge types

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Flow**: Graph visualization
- **Zustand**: State management
- **OpenAI API**: AI-powered analysis
- **Marked**: Markdown parsing
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Project Structure

```
PromptSys/
├── src/
│   ├── components/          # React components
│   │   ├── App.tsx
│   │   ├── SidePanel.tsx
│   │   ├── OntologyGraph.tsx
│   │   ├── PromptNode.tsx
│   │   └── ConflictPanel.tsx
│   ├── services/            # External services
│   │   └── openaiService.ts
│   ├── stores/              # State management
│   │   └── ontologyStore.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── markdownParser.ts
│   │   └── conflictDetector.ts
│   ├── styles/              # CSS files
│   │   └── index.css
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.js       # Tailwind config
```

## Development

### Code Quality

```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit
```

### Building

```bash
# Production build
npm run build

# Output will be in the 'dist' directory
```

## Security Notes

- API keys are stored in browser memory only (not sent to any server except OpenAI)
- `dangerouslyAllowBrowser: true` is used for demo purposes
- For production, implement a backend proxy for OpenAI API calls

## Future Enhancements

- Export ontology as JSON/YAML/Markdown
- Import existing ontologies
- Multi-user collaboration
- Version control for prompts
- Template library
- Cost estimation for token usage
- Advanced layout algorithms (force-directed, hierarchical)
- Prompt testing and validation
- Integration with other LLM providers

## License

MIT

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for better AI system prompt engineering
