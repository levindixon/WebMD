/**
 * Performance Optimizations for HTML to Markdown Conversion
 * Handles large documents efficiently
 */

class PerformanceOptimizedParser {
  constructor(options = {}) {
    this.options = {
      chunkSize: 1000, // Process in chunks of 1000 nodes
      cacheSize: 100, // Cache conversion results
      lazyLoad: true, // Process visible content first
      streamingMode: false, // For very large documents
      ...options
    };
    
    this.cache = new LRUCache(this.options.cacheSize);
    this.conversionStats = {
      nodesProcessed: 0,
      cacheHits: 0,
      processingTime: 0
    };
  }

  /**
   * Convert with performance optimizations
   */
  async convertOptimized(element) {
    const startTime = performance.now();
    
    // Check if we should use streaming mode
    const nodeCount = this.countNodes(element);
    if (nodeCount > 10000 || this.options.streamingMode) {
      return await this.streamingConvert(element);
    }
    
    // Use chunked processing for medium documents
    if (nodeCount > 1000) {
      return await this.chunkedConvert(element);
    }
    
    // Regular conversion for small documents
    const result = this.convertWithCache(element);
    
    this.conversionStats.processingTime = performance.now() - startTime;
    return result;
  }

  /**
   * Count nodes for optimization decisions
   */
  countNodes(element) {
    let count = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ALL,
      null,
      false
    );
    
    while (walker.nextNode() && count < 10001) {
      count++;
    }
    
    return count;
  }

  /**
   * Streaming conversion for very large documents
   */
  async streamingConvert(element) {
    const chunks = [];
    const stream = this.createNodeStream(element);
    
    for await (const chunk of stream) {
      chunks.push(await this.processChunk(chunk));
      
      // Yield to browser to prevent blocking
      await this.yieldToBrowser();
    }
    
    return chunks.join('');
  }

  /**
   * Create async iterator for nodes
   */
  async *createNodeStream(element) {
    const queue = [element];
    let buffer = [];
    
    while (queue.length > 0) {
      const node = queue.shift();
      buffer.push(node);
      
      // Add children to queue
      if (node.childNodes) {
        queue.push(...Array.from(node.childNodes));
      }
      
      // Yield when buffer is full
      if (buffer.length >= this.options.chunkSize) {
        yield buffer;
        buffer = [];
      }
    }
    
    // Yield remaining nodes
    if (buffer.length > 0) {
      yield buffer;
    }
  }

  /**
   * Chunked conversion for medium documents
   */
  async chunkedConvert(element) {
    const chunks = this.splitIntoChunks(element);
    const results = [];
    
    for (const chunk of chunks) {
      results.push(await this.processChunk(chunk));
      await this.yieldToBrowser();
    }
    
    return this.mergeResults(results);
  }

  /**
   * Split document into logical chunks
   */
  splitIntoChunks(element) {
    const chunks = [];
    const blockElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, section, article, blockquote, pre, ul, ol, table');
    
    let currentChunk = [];
    let currentSize = 0;
    
    blockElements.forEach(block => {
      const size = block.textContent.length;
      
      if (currentSize + size > 10000 && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(block);
      currentSize += size;
    });
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Process a chunk of nodes
   */
  async processChunk(nodes) {
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    fragment.appendChild(container);
    
    nodes.forEach(node => {
      container.appendChild(node.cloneNode(true));
    });
    
    return this.convertWithCache(container);
  }

  /**
   * Convert with caching
   */
  convertWithCache(element) {
    // Generate cache key based on element structure
    const cacheKey = this.generateCacheKey(element);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.conversionStats.cacheHits++;
      return cached;
    }
    
    // Convert
    const parser = new HTMLToMarkdownParser(this.options);
    const result = parser.convert(element);
    
    // Cache result
    this.cache.set(cacheKey, result);
    this.conversionStats.nodesProcessed++;
    
    return result;
  }

  /**
   * Generate cache key for element
   */
  generateCacheKey(element) {
    // Simple hash based on structure and content
    let key = element.tagName;
    
    // Include first 100 chars of text content
    const text = element.textContent.substring(0, 100);
    key += ':' + this.simpleHash(text);
    
    // Include child structure
    const childTags = Array.from(element.children)
      .map(child => child.tagName)
      .join(',');
    key += ':' + childTags;
    
    return key;
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Yield control to browser
   */
  yieldToBrowser() {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Merge chunked results
   */
  mergeResults(results) {
    // Smart merging to handle split elements
    return results.join('\n\n').replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Lazy loading optimization for visible content
   */
  async convertVisible(element) {
    if (!this.options.lazyLoad) {
      return this.convertOptimized(element);
    }
    
    // Find visible content
    const viewportHeight = window.innerHeight;
    const visibleElements = [];
    const deferredElements = [];
    
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        visibleElements.push(el);
      } else {
        deferredElements.push(el);
      }
    });
    
    // Convert visible content first
    const visibleContainer = document.createElement('div');
    visibleElements.forEach(el => {
      visibleContainer.appendChild(el.cloneNode(true));
    });
    
    const visibleMarkdown = await this.convertOptimized(visibleContainer);
    
    // Convert remaining content in background
    if (deferredElements.length > 0) {
      this.convertDeferred(deferredElements).then(deferredMarkdown => {
        // Store or append deferred content
        this.deferredContent = deferredMarkdown;
      });
    }
    
    return visibleMarkdown;
  }

  /**
   * Convert deferred content
   */
  async convertDeferred(elements) {
    const container = document.createElement('div');
    elements.forEach(el => {
      container.appendChild(el.cloneNode(true));
    });
    
    return await this.convertOptimized(container);
  }

  /**
   * Get conversion statistics
   */
  getStats() {
    return {
      ...this.conversionStats,
      cacheHitRate: this.conversionStats.cacheHits / 
        (this.conversionStats.nodesProcessed + this.conversionStats.cacheHits)
    };
  }
}

/**
 * Simple LRU Cache implementation
 */
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Web Worker support for heavy processing
 */
class WorkerBasedParser {
  constructor() {
    this.worker = null;
    this.initWorker();
  }

  initWorker() {
    const workerCode = `
      self.addEventListener('message', async (e) => {
        const { html, options } = e.data;
        
        // Parse HTML in worker
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Convert to markdown (simplified version for worker)
        const markdown = convertToMarkdown(doc.body, options);
        
        self.postMessage({ markdown });
      });
      
      function convertToMarkdown(element, options) {
        // Simplified conversion logic for worker
        // Full implementation would be included here
        return element.textContent;
      }
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  async convert(element, options) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (e) => resolve(e.data.markdown);
      this.worker.onerror = reject;
      
      // Serialize HTML for worker
      const html = element.outerHTML;
      this.worker.postMessage({ html, options });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceOptimizedParser, WorkerBasedParser };
}