import { marked } from 'marked';
import { ParsedMarkdown, MarkdownSection } from '../types';

export class MarkdownParser {
  /**
   * Parse markdown content into structured sections
   */
  static parse(content: string): ParsedMarkdown {
    const tokens = marked.lexer(content);
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    const sectionStack: MarkdownSection[] = [];

    tokens.forEach((token) => {
      if (token.type === 'heading') {
        const section: MarkdownSection = {
          title: token.text,
          content: '',
          level: token.depth,
          children: []
        };

        // Pop sections from stack until we find the right parent level
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= section.level) {
          sectionStack.pop();
        }

        if (sectionStack.length === 0) {
          sections.push(section);
        } else {
          const parent = sectionStack[sectionStack.length - 1];
          parent.children = parent.children || [];
          parent.children.push(section);
        }

        sectionStack.push(section);
        currentSection = section;
      } else if (currentSection && (token.type === 'paragraph' || token.type === 'text' || token.type === 'code')) {
        const text = 'text' in token ? token.text : '';
        currentSection.content += (currentSection.content ? '\n' : '') + text;
      }
    });

    return { sections };
  }

  /**
   * Extract all sections as flat list
   */
  static flattenSections(sections: MarkdownSection[]): MarkdownSection[] {
    const flat: MarkdownSection[] = [];

    const traverse = (section: MarkdownSection) => {
      flat.push(section);
      section.children?.forEach(traverse);
    };

    sections.forEach(traverse);
    return flat;
  }

  /**
   * Detect prompt patterns in text
   */
  static detectPromptPatterns(text: string): {
    hasInstructions: boolean;
    hasExamples: boolean;
    hasConstraints: boolean;
    hasRole: boolean;
  } {
    const lowerText = text.toLowerCase();

    return {
      hasInstructions: /you (should|must|will|are to|need to)/i.test(text) ||
                       /instructions?:/i.test(text),
      hasExamples: /example|for instance|such as|e\.g\./i.test(text) ||
                   /```/.test(text),
      hasConstraints: /do not|don't|never|always|must not|should not|avoid/i.test(text) ||
                      /constraint|limitation|restriction/i.test(lowerText),
      hasRole: /you are (a|an)|act as|role:|persona/i.test(text)
    };
  }

  /**
   * Extract metadata from markdown frontmatter
   */
  static extractMetadata(content: string): Record<string, unknown> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const metadata: Record<string, unknown> = {};
    const lines = frontmatterMatch[1].split('\n');

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    });

    return metadata;
  }
}
