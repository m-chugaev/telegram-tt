import { ApiMessageEntityTypes } from "../api/types";

interface MarkdownToken {
  type: 'text' | 'code' | 'pre' | 'bold' | 'italic' | 'strike' | 'spoiler' | 'emoji' | 'newline' | 'link';
  content: string;
  language?: string;
  documentId?: string;
  url?: string;
}

class MarkdownParser {
  private pos = 0;
  private tokens: MarkdownToken[] = [];
  private readonly text: string;

  constructor(input: string) {
    // Pre-process HTML
    this.text = input
      .replace(/&nbsp;/g, ' ')
      .replace(/<div><br[^>]*><\/div>/g, '\n')
      .replace(/<br[^>]*>/g, '\n')
      .replace(/<\/div>\s*<div>/g, '\n')
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '');
  }

  parse(): string {
    while (this.pos < this.text.length) {
      const char = this.peek();
    
      if (char === '\n') {
        this.parseNewline();
      } else if (this.text.startsWith('```', this.pos)) {
        this.parseCodeBlock();
      } else if (char === '`' && !this.isInsideCodeBlock()) {
        this.parseInlineCode();
      } else if (this.text.startsWith('**', this.pos) && !this.isInsideCodeBlock()) {
        this.parseBold();
      } else if (this.text.startsWith('__', this.pos) && !this.isInsideCodeBlock()) {
        this.parseItalic();
      } else if (this.text.startsWith('~~', this.pos) && !this.isInsideCodeBlock()) {
        this.parseStrike();
      } else if (this.text.startsWith('||', this.pos) && !this.isInsideCodeBlock()) {
        this.parseSpoiler();
      } else if (char === '[' && this.text.includes('](customEmoji:', this.pos)) {
        this.parseCustomEmoji();
      } else if (char === '[' && this.isValidLinkStart() && !this.isInsideCodeBlock()) {
        this.parseLink();
      } else {
        this.parseText();
      }
    }

    return this.tokensToHtml();
  }

  private peek(n: number = 0): string {
    return this.text[this.pos + n];
  }

  private consume(n: number = 1): string {
    const char = this.text.slice(this.pos, this.pos + n);
    this.pos += n;
    return char;
  }

  private readUntil(delimiter: string): string {
    const start = this.pos;
    while (this.pos < this.text.length && !this.text.startsWith(delimiter, this.pos)) {
      this.pos++;
    }
    return this.text.slice(start, this.pos);
  }

  private parseBold(): void {
    this.consume(2); // Skip **
    const content = this.readUntil('**');
    this.consume(2); // Skip closing **
    
    this.tokens.push({
      type: 'bold',
      content,
    });
  }
  
  private parseItalic(): void {
    this.consume(2); // Skip __
    const content = this.readUntil('__');
    this.consume(2); // Skip closing __
    
    this.tokens.push({
      type: 'italic',
      content,
    });
  }
  
  private parseStrike(): void {
    this.consume(2); // Skip ~~
    const content = this.readUntil('~~');
    this.consume(2); // Skip closing ~~
    
    this.tokens.push({
      type: 'strike',
      content,
    });
  }
  
  private parseSpoiler(): void {
    this.consume(2); // Skip ||
    const content = this.readUntil('||');
    this.consume(2); // Skip closing ||
    
    this.tokens.push({
      type: 'spoiler',
      content,
    });
  }
  
  private parseCustomEmoji(): void {
    // Skip [
    this.consume();
    const alt = this.readUntil(']');
    // Skip ](customEmoji:
    this.consume(13);
    const documentId = this.readUntil(')');
    // Skip )
    this.consume();
    
    this.tokens.push({
      type: 'emoji',
      content: alt,
      documentId,
    });
  }
  
  private parseText(): void {
    let content = '';
    const specialChars = ['`', '*', '_', '~', '|', '['];
    
    while (this.pos < this.text.length) {
      const char = this.peek();
      const nextChar = this.peek(1);
      
      // Check for special formatting start
      if (specialChars.includes(char) && char === nextChar) {
        break;
      }
      
      // Check for code block start
      if (char === '`' && this.text.startsWith('```', this.pos)) {
        break;
      }
      
      content += this.consume();
    }
    
    if (content) {
      this.tokens.push({
        type: 'text',
        content,
      });
    }
  }
  
  private parseNewline(): void {
    this.consume();
    this.tokens.push({
      type: 'newline',
      content: '\n',
    });
  }
  
  // Helper method to check if we're inside a code or pre block
  private isInsideCodeBlock(): boolean {
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i];
      if (token.type === 'pre' || token.type === 'code') {
        return true;
      }
    }
    return false;
  }

  private parseCodeBlock(): void {
    this.consume(3); // Skip ```
    const language = this.readUntil('\n');
    this.consume(); // Skip \n
    const content = this.readUntil('```');
    this.consume(3); // Skip closing ```
    
    this.tokens.push({
      type: 'pre',
      content: content.trim(),
      language: language.trim(),
    });
  }

  private parseInlineCode(): void {
    this.consume(); // Skip `
    const content = this.readUntil('`');
    this.consume(); // Skip closing `
    
    this.tokens.push({
      type: 'code',
      content,
    });
  }

  private parseLink(): void {
    // Skip [
    this.consume();
    const text = this.readUntil(']');
    // Skip ](
    this.consume(2);
    const link = this.readUntil(')');
    // Skip )
    this.consume();

    const url = this.formatUrl(link);
    
    this.tokens.push({
      type: 'link',
      content: text,
      url,
    });
  }

  private formatUrl(link: string): string {
    if (link.includes('://')) return link;
    if (link.includes('@')) return `mailto:${link}`;

    return `https://${link}`;
  }

  private isValidLinkStart(): boolean {
    // Look ahead to check if this is a valid link pattern
    let i = this.pos;
    
    // Skip [
    if (this.text[i] !== '[') return false;
    i++;
    
    // Find closing ]
    while (i < this.text.length && this.text[i] !== ']') {
      if (this.text[i] === '\n') return false; // Links can't contain newlines
      i++;
    }
    if (i >= this.text.length) return false;
    
    // Check for (
    i++;
    if (i >= this.text.length || this.text[i] !== '(') return false;
    
    return true;
  }

  private tokensToHtml(): string {
    return this.tokens.map((token) => {
      switch (token.type) {
        case 'pre':
          return token.language
            ? `<pre data-language="${token.language}">${token.content}</pre>`
            : `<pre>${token.content}</pre>`;
        case 'code':
          return `<code>${token.content}</code>`;
        case 'bold':
          return `<b>${token.content}</b>`;
        case 'italic':
          return `<i>${token.content}</i>`;
        case 'strike':
          return `<s>${token.content}</s>`;
        case 'spoiler':
          return `<span data-entity-type="${ApiMessageEntityTypes.Spoiler}">${token.content}</span>`;
        case 'emoji':
          // Contest problem: "We can’t directly render components, so custom emojis rely on workarounds."
          // Potentially it can be a teact component if parse returns a teact node
          return `<img alt="${token.content}" data-document-id="${token.documentId}">`;
        case 'text':
          return token.content;
        case 'newline':
          return '\n';
        default:
          return '';
      }
    }).join('');
  }
}

export default MarkdownParser;
