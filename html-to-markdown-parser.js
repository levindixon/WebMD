/**
 * Custom HTML to Markdown Parser for Chrome Extension
 * Uses DOM traversal for accurate conversion
 */

class HTMLToMarkdownParser {
  constructor(options = {}) {
    this.options = {
      headingStyle: 'atx', // 'atx' for # style, 'setext' for underline style
      bulletListMarker: '-', // '-', '*', or '+'
      codeBlockStyle: 'fenced', // 'fenced' or 'indented'
      linkStyle: 'inline', // 'inline' or 'reference'
      emDelimiter: '*', // '*' or '_'
      strongDelimiter: '**', // '**' or '__'
      preserveWhitespace: false,
      ...options
    };
    
    // Track state during conversion
    this.state = {
      listStack: [], // Track nested lists
      blockquoteDepth: 0,
      preformatted: false,
      references: new Map(), // For reference-style links
      referenceCounter: 0
    };
  }

  /**
   * Main conversion method
   */
  convert(htmlElement) {
    // Reset state for each conversion
    this.state = {
      listStack: [],
      blockquoteDepth: 0,
      preformatted: false,
      references: new Map(),
      referenceCounter: 0
    };
    
    // Process the DOM tree
    const markdown = this.processNode(htmlElement).trim();
    
    // Append references if using reference-style links
    if (this.options.linkStyle === 'reference' && this.state.references.size > 0) {
      const references = Array.from(this.state.references.entries())
        .map(([id, url]) => `[${id}]: ${url}`)
        .join('\n');
      return markdown + '\n\n' + references;
    }
    
    return markdown;
  }

  /**
   * Process a single DOM node
   */
  processNode(node) {
    if (!node) return '';
    
    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      return this.processTextNode(node);
    }
    
    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.processElementNode(node);
    }
    
    // Ignore other node types (comments, etc.)
    return '';
  }

  /**
   * Process text nodes with proper escaping
   */
  processTextNode(node) {
    let text = node.textContent;
    
    // Preserve whitespace in preformatted text
    if (this.state.preformatted) {
      return text;
    }
    
    // Normalize whitespace
    if (!this.options.preserveWhitespace) {
      text = text.replace(/\s+/g, ' ');
    }
    
    // Escape Markdown special characters
    text = this.escapeMarkdown(text);
    
    return text;
  }

  /**
   * Escape special Markdown characters
   */
  escapeMarkdown(text) {
    // Don't escape in preformatted text
    if (this.state.preformatted) return text;
    
    // Escape characters that have special meaning in Markdown
    const escapeChars = ['\\', '`', '*', '_', '{', '}', '[', ']', '(', ')', '#', '+', '-', '.', '!', '|'];
    const escapeRegex = new RegExp(`[${escapeChars.map(c => '\\' + c).join('')}]`, 'g');
    
    return text.replace(escapeRegex, '\\$&');
  }

  /**
   * Process element nodes based on tag name
   */
  processElementNode(element) {
    const tagName = element.tagName.toLowerCase();
    const handler = this.elementHandlers[tagName] || this.elementHandlers.default;
    
    return handler.call(this, element);
  }

  /**
   * Element handlers for different HTML tags
   */
  elementHandlers = {
    // Headings
    h1: (el) => this.processHeading(el, 1),
    h2: (el) => this.processHeading(el, 2),
    h3: (el) => this.processHeading(el, 3),
    h4: (el) => this.processHeading(el, 4),
    h5: (el) => this.processHeading(el, 5),
    h6: (el) => this.processHeading(el, 6),
    
    // Paragraphs and line breaks
    p: (el) => {
      const content = this.processChildren(el).trim();
      return content ? '\n\n' + content + '\n\n' : '';
    },
    br: () => '  \n',
    
    // Lists
    ul: (el) => this.processList(el, 'unordered'),
    ol: (el) => this.processList(el, 'ordered'),
    li: (el) => this.processListItem(el),
    
    // Emphasis
    strong: (el) => this.processEmphasis(el, 'strong'),
    b: (el) => this.processEmphasis(el, 'strong'),
    em: (el) => this.processEmphasis(el, 'em'),
    i: (el) => this.processEmphasis(el, 'em'),
    
    // Links
    a: (el) => this.processLink(el),
    
    // Images
    img: (el) => this.processImage(el),
    
    // Code
    code: (el) => this.processInlineCode(el),
    pre: (el) => this.processCodeBlock(el),
    
    // Blockquotes
    blockquote: (el) => this.processBlockquote(el),
    
    // Tables
    table: (el) => this.processTable(el),
    thead: (el) => this.processChildren(el),
    tbody: (el) => this.processChildren(el),
    tr: (el) => this.processTableRow(el),
    th: (el) => this.processTableCell(el, true),
    td: (el) => this.processTableCell(el, false),
    
    // Horizontal rule
    hr: () => '\n\n---\n\n',
    
    // Definition lists
    dl: (el) => this.processDefinitionList(el),
    dt: (el) => '\n\n**' + this.processChildren(el).trim() + '**\n',
    dd: (el) => ': ' + this.processChildren(el).trim() + '\n',
    
    // Default handler
    default: (el) => this.processChildren(el)
  };

  /**
   * Process child nodes
   */
  processChildren(element) {
    return Array.from(element.childNodes)
      .map(child => this.processNode(child))
      .join('');
  }

  /**
   * Process headings
   */
  processHeading(element, level) {
    const content = this.processChildren(element).trim();
    if (!content) return '';
    
    if (this.options.headingStyle === 'atx') {
      return '\n\n' + '#'.repeat(level) + ' ' + content + '\n\n';
    } else {
      // Setext style (only for h1 and h2)
      if (level === 1) {
        return '\n\n' + content + '\n' + '='.repeat(content.length) + '\n\n';
      } else if (level === 2) {
        return '\n\n' + content + '\n' + '-'.repeat(content.length) + '\n\n';
      } else {
        // Fall back to ATX for h3-h6
        return '\n\n' + '#'.repeat(level) + ' ' + content + '\n\n';
      }
    }
  }

  /**
   * Process lists with proper nesting
   */
  processList(element, type) {
    this.state.listStack.push({ type, counter: 0 });
    const content = this.processChildren(element);
    this.state.listStack.pop();
    
    // Add spacing around top-level lists
    if (this.state.listStack.length === 0) {
      return '\n\n' + content.trim() + '\n\n';
    }
    return '\n' + content;
  }

  /**
   * Process list items with proper indentation
   */
  processListItem(element) {
    const depth = this.state.listStack.length - 1;
    const listInfo = this.state.listStack[depth];
    const indent = '  '.repeat(depth);
    
    let marker;
    if (listInfo.type === 'ordered') {
      listInfo.counter++;
      marker = listInfo.counter + '. ';
    } else {
      marker = this.options.bulletListMarker + ' ';
    }
    
    // Process content
    const content = this.processChildren(element).trim();
    
    // Handle multi-line content
    const lines = content.split('\n');
    const firstLine = lines[0];
    const remainingLines = lines.slice(1).map(line => 
      line.trim() ? indent + '  ' + line : ''
    ).join('\n');
    
    const result = indent + marker + firstLine;
    return result + (remainingLines ? '\n' + remainingLines : '') + '\n';
  }

  /**
   * Process emphasis (strong/em)
   */
  processEmphasis(element, type) {
    const content = this.processChildren(element).trim();
    if (!content) return '';
    
    const delimiter = type === 'strong' ? this.options.strongDelimiter : this.options.emDelimiter;
    return delimiter + content + delimiter;
  }

  /**
   * Process links
   */
  processLink(element) {
    const href = element.href || element.getAttribute('href') || '';
    const text = this.processChildren(element).trim() || href;
    
    if (!href) return text;
    
    // Convert relative URLs to absolute
    const absoluteUrl = this.resolveUrl(href, element.baseURI);
    
    if (this.options.linkStyle === 'inline') {
      return `[${text}](${absoluteUrl})`;
    } else {
      // Reference style
      const id = ++this.state.referenceCounter;
      this.state.references.set(id, absoluteUrl);
      return `[${text}][${id}]`;
    }
  }

  /**
   * Process images
   */
  processImage(element) {
    const src = element.src || element.getAttribute('src') || '';
    const alt = element.alt || element.getAttribute('alt') || '';
    const title = element.title || element.getAttribute('title') || '';
    
    if (!src) return '';
    
    const absoluteUrl = this.resolveUrl(src, element.baseURI);
    let markdown = `![${alt}](${absoluteUrl}`;
    
    if (title) {
      markdown += ` "${title}"`;
    }
    
    return markdown + ')';
  }

  /**
   * Process inline code
   */
  processInlineCode(element) {
    const code = element.textContent;
    
    // Use appropriate number of backticks to avoid conflicts
    const backticks = code.includes('`') ? '``' : '`';
    return backticks + code + backticks;
  }

  /**
   * Process code blocks
   */
  processCodeBlock(element) {
    const wasPreformatted = this.state.preformatted;
    this.state.preformatted = true;
    
    // Check if it contains a code element
    const codeElement = element.querySelector('code');
    const content = codeElement ? codeElement.textContent : element.textContent;
    
    // Try to detect language from class
    const language = this.detectLanguage(codeElement || element);
    
    this.state.preformatted = wasPreformatted;
    
    if (this.options.codeBlockStyle === 'fenced') {
      return '\n\n```' + language + '\n' + content + '\n```\n\n';
    } else {
      // Indented code blocks
      const lines = content.split('\n').map(line => '    ' + line);
      return '\n\n' + lines.join('\n') + '\n\n';
    }
  }

  /**
   * Process blockquotes with nesting
   */
  processBlockquote(element) {
    this.state.blockquoteDepth++;
    const content = this.processChildren(element).trim();
    this.state.blockquoteDepth--;
    
    const prefix = '> '.repeat(this.state.blockquoteDepth + 1);
    const lines = content.split('\n').map(line => 
      line.trim() ? prefix + line : prefix.trimRight()
    );
    
    return '\n\n' + lines.join('\n') + '\n\n';
  }

  /**
   * Process tables
   */
  processTable(element) {
    const rows = Array.from(element.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    
    const tableData = [];
    let hasHeader = false;
    
    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowData = cells.map(cell => this.processChildren(cell).trim());
      
      if (row.parentElement.tagName === 'THEAD' || cells[0]?.tagName === 'TH') {
        hasHeader = true;
      }
      
      tableData.push(rowData);
    });
    
    return this.formatTable(tableData, hasHeader);
  }

  /**
   * Format table data as Markdown
   */
  formatTable(tableData, hasHeader) {
    if (tableData.length === 0) return '';
    
    // Calculate column widths
    const columnCount = Math.max(...tableData.map(row => row.length));
    const columnWidths = new Array(columnCount).fill(3); // Minimum width
    
    tableData.forEach(row => {
      row.forEach((cell, index) => {
        columnWidths[index] = Math.max(columnWidths[index], cell.length);
      });
    });
    
    let result = '\n\n';
    
    // Format rows
    tableData.forEach((row, rowIndex) => {
      result += '| ';
      for (let i = 0; i < columnCount; i++) {
        const cell = row[i] || '';
        result += cell.padEnd(columnWidths[i]) + ' | ';
      }
      result += '\n';
      
      // Add separator after header
      if (rowIndex === 0 && hasHeader) {
        result += '| ';
        for (let i = 0; i < columnCount; i++) {
          result += '-'.repeat(columnWidths[i]) + ' | ';
        }
        result += '\n';
      }
    });
    
    return result + '\n';
  }

  /**
   * Helper methods
   */
  
  detectLanguage(element) {
    const className = element.className || '';
    const langMatch = className.match(/language-(\w+)/);
    return langMatch ? langMatch[1] : '';
  }

  resolveUrl(url, baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Additional processing methods for edge cases
   */
  
  processTableRow(element) {
    return this.processChildren(element);
  }

  processTableCell(element, isHeader) {
    return this.processChildren(element);
  }

  processDefinitionList(element) {
    return '\n\n' + this.processChildren(element).trim() + '\n\n';
  }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HTMLToMarkdownParser;
}