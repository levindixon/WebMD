/**
 * Edge Case Handlers for HTML to Markdown Conversion
 * Handles complex and problematic HTML patterns
 */

class EdgeCaseHandlers {
  /**
   * Handle malformed or non-standard HTML
   */
  static sanitizeHTML(html) {
    // Fix common HTML issues
    let sanitized = html;
    
    // Fix unclosed tags
    sanitized = this.fixUnclosedTags(sanitized);
    
    // Fix nested anchor tags (invalid HTML but common)
    sanitized = this.fixNestedAnchors(sanitized);
    
    // Fix improperly nested lists
    sanitized = this.fixNestedLists(sanitized);
    
    return sanitized;
  }

  /**
   * Fix unclosed tags using browser's parser
   */
  static fixUnclosedTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerHTML;
  }

  /**
   * Fix nested anchor tags
   */
  static fixNestedAnchors(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    const anchors = div.querySelectorAll('a a');
    anchors.forEach(nestedAnchor => {
      // Move nested anchor outside
      const parent = nestedAnchor.parentElement;
      parent.parentElement.insertBefore(nestedAnchor, parent.nextSibling);
    });
    
    return div.innerHTML;
  }

  /**
   * Fix improperly nested lists
   */
  static fixNestedLists(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Find lists that are direct children of lists (should be in li)
    div.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol').forEach(nestedList => {
      const parent = nestedList.parentElement;
      const li = document.createElement('li');
      parent.insertBefore(li, nestedList);
      li.appendChild(nestedList);
    });
    
    return div.innerHTML;
  }

  /**
   * Handle special whitespace cases
   */
  static normalizeWhitespace(text, context) {
    // Different handling based on context
    if (context.preformatted) {
      return text; // Preserve all whitespace
    }
    
    if (context.inlineCode) {
      // Preserve single spaces, collapse multiple
      return text.replace(/  +/g, ' ');
    }
    
    // For normal text
    if (context.startOfBlock) {
      text = text.trimStart();
    }
    if (context.endOfBlock) {
      text = text.trimEnd();
    }
    
    // Collapse multiple spaces to single
    text = text.replace(/  +/g, ' ');
    
    // Preserve line breaks in certain contexts
    if (!context.collapseLineBreaks) {
      text = text.replace(/\n\s*\n/g, '\n\n');
    } else {
      text = text.replace(/\s*\n\s*/g, ' ');
    }
    
    return text;
  }

  /**
   * Handle complex nested structures
   */
  static handleComplexNesting(element) {
    const complexPatterns = [
      {
        // Table inside list
        selector: 'li table',
        handler: (table) => {
          // Add newlines around table for proper rendering
          table.insertAdjacentText('beforebegin', '\n\n');
          table.insertAdjacentText('afterend', '\n\n');
        }
      },
      {
        // Code block inside list
        selector: 'li pre',
        handler: (pre) => {
          // Ensure proper spacing
          pre.insertAdjacentText('beforebegin', '\n\n');
          pre.insertAdjacentText('afterend', '\n\n');
        }
      },
      {
        // List inside blockquote
        selector: 'blockquote ul, blockquote ol',
        handler: (list) => {
          // Add marker to maintain blockquote context
          list.setAttribute('data-in-blockquote', 'true');
        }
      }
    ];
    
    complexPatterns.forEach(pattern => {
      element.querySelectorAll(pattern.selector).forEach(pattern.handler);
    });
  }

  /**
   * Handle special characters that need escaping
   */
  static escapeSpecialCharacters(text, context) {
    // Characters that need escaping in different contexts
    const escapePatterns = {
      normal: {
        // Escape at start of line
        lineStart: /^([#*+\->]|\d+\.)\s/gm,
        // Escape anywhere
        anywhere: /([\\`*_{}[\]()#+\-.!|])/g,
        // Don't escape in URLs
        excludePatterns: [/\[.*?\]\(.*?\)/g, /https?:\/\/\S+/g]
      },
      inLink: {
        // Different escaping rules inside links
        anywhere: /([\\`])/g
      },
      inCode: {
        // No escaping in code
        anywhere: null
      }
    };
    
    const pattern = escapePatterns[context.type] || escapePatterns.normal;
    
    if (!pattern.anywhere) return text;
    
    // Handle exclusions
    if (pattern.excludePatterns) {
      const excluded = [];
      pattern.excludePatterns.forEach(excludePattern => {
        text = text.replace(excludePattern, (match, ...args) => {
          excluded.push(match);
          return `\x00${excluded.length - 1}\x00`;
        });
      });
      
      // Apply escaping
      text = text.replace(pattern.anywhere, '\\$1');
      
      // Restore excluded content
      text = text.replace(/\x00(\d+)\x00/g, (match, index) => excluded[index]);
    } else {
      text = text.replace(pattern.anywhere, '\\$1');
    }
    
    // Handle line-start patterns
    if (pattern.lineStart) {
      text = text.replace(pattern.lineStart, '\\$1');
    }
    
    return text;
  }

  /**
   * Handle mixed content (e.g., text and elements at same level)
   */
  static processMixedContent(nodes) {
    const result = [];
    let currentText = '';
    
    nodes.forEach((node, index) => {
      if (node.nodeType === Node.TEXT_NODE) {
        currentText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Flush accumulated text
        if (currentText) {
          result.push({
            type: 'text',
            content: currentText,
            isFirst: index === 0,
            isLast: false
          });
          currentText = '';
        }
        
        result.push({
          type: 'element',
          node: node,
          isFirst: index === 0,
          isLast: index === nodes.length - 1
        });
      }
    });
    
    // Flush remaining text
    if (currentText) {
      result.push({
        type: 'text',
        content: currentText,
        isFirst: result.length === 0,
        isLast: true
      });
    }
    
    return result;
  }

  /**
   * Handle table edge cases
   */
  static normalizeTable(table) {
    // Ensure consistent structure
    let maxColumns = 0;
    const rows = table.querySelectorAll('tr');
    
    // Find max columns considering colspan
    rows.forEach(row => {
      let columnCount = 0;
      row.querySelectorAll('td, th').forEach(cell => {
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        columnCount += colspan;
      });
      maxColumns = Math.max(maxColumns, columnCount);
    });
    
    // Normalize each row
    rows.forEach(row => {
      let currentColumns = 0;
      const cells = row.querySelectorAll('td, th');
      
      cells.forEach(cell => {
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        currentColumns += colspan;
      });
      
      // Add empty cells if needed
      while (currentColumns < maxColumns) {
        const emptyCell = document.createElement(cells[0]?.tagName || 'td');
        row.appendChild(emptyCell);
        currentColumns++;
      }
    });
    
    // Handle rowspan (more complex)
    this.handleRowspan(table);
  }

  /**
   * Handle rowspan in tables
   */
  static handleRowspan(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    const spanMap = new Map();
    
    rows.forEach((row, rowIndex) => {
      let cellIndex = 0;
      const cells = Array.from(row.querySelectorAll('td, th'));
      
      cells.forEach(cell => {
        // Account for previous rowspans
        while (spanMap.has(`${rowIndex},${cellIndex}`)) {
          cellIndex++;
        }
        
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        if (rowspan > 1) {
          // Mark cells that will be affected by rowspan
          for (let i = 1; i < rowspan; i++) {
            if (rowIndex + i < rows.length) {
              spanMap.set(`${rowIndex + i},${cellIndex}`, cell.textContent);
            }
          }
        }
        
        cellIndex++;
      });
    });
    
    // Insert placeholder cells for rowspans
    spanMap.forEach((content, key) => {
      const [rowIndex, cellIndex] = key.split(',').map(Number);
      const row = rows[rowIndex];
      const cells = row.querySelectorAll('td, th');
      const newCell = document.createElement(cells[0]?.tagName || 'td');
      newCell.textContent = '↑'; // Indicate continued cell
      
      // Insert at correct position
      if (cellIndex < cells.length) {
        row.insertBefore(newCell, cells[cellIndex]);
      } else {
        row.appendChild(newCell);
      }
    });
  }

  /**
   * Handle deeply nested structures
   */
  static flattenDeepNesting(element, maxDepth = 6) {
    const checkNesting = (el, depth = 0) => {
      if (depth > maxDepth) {
        // Flatten by removing intermediate wrappers
        const parent = el.parentElement;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        el.remove();
        return;
      }
      
      Array.from(el.children).forEach(child => {
        checkNesting(child, depth + 1);
      });
    };
    
    checkNesting(element);
  }

  /**
   * Handle inline styles that affect meaning
   */
  static convertSemanticStyles(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const style = node.getAttribute('style');
      if (!style) continue;
      
      // Convert text-decoration
      if (style.includes('text-decoration: line-through')) {
        const del = document.createElement('del');
        while (node.firstChild) {
          del.appendChild(node.firstChild);
        }
        node.appendChild(del);
      }
      
      if (style.includes('text-decoration: underline')) {
        const u = document.createElement('u');
        while (node.firstChild) {
          u.appendChild(node.firstChild);
        }
        node.appendChild(u);
      }
      
      // Convert display styles
      if (style.includes('display: none') || style.includes('visibility: hidden')) {
        node.remove();
      }
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EdgeCaseHandlers;
}