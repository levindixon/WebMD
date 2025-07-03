# WebMD - Web to Markdown Chrome Extension

📋 **WebMD** (Web to Markdown) transforms web pages into clean, portable Markdown documents with surgical precision. This Chrome extension extracts content intelligently, preserves formatting perfectly, and exports to GitHub Flavored Markdown instantly. 

Press `Cmd+Shift+K` (Mac) or `Ctrl+Shift+K` (Windows/Linux) to diagnose any webpage and get the cure: clean, portable Markdown.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Chrome Web Store](https://img.shields.io/badge/platform-Chrome-brightgreen.svg)
![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

## ✨ Features

- **🔍 Smart Article Extraction**: Uses Mozilla's Readability.js to intelligently identify and extract main content
- **📝 Surgical Precision**: Preserves formatting with perfect fidelity:
  - Headings (H1-H6)
  - Lists (ordered, unordered, nested)
  - Tables with proper alignment
  - Code blocks with syntax highlighting hints
  - Links, images, and embedded content
- **🎯 GitHub Flavored Markdown**: Full support for:
  - Tables with column alignment
  - Task lists with checkboxes
  - Strikethrough text
  - Fenced code blocks
- **📊 Metadata Extraction**: Automatically captures:
  - Page title and author
  - Publication date (when available)
  - Source URL
  - Site name
- **⚡ Instant Actions**: 
  - One-click copy to clipboard
  - Download as `.md` file
  - Auto-copy option available
- **🔒 Privacy-First**: All processing happens locally in your browser - no data is ever sent to external servers

## Installation

1. Clone or download this repository
2. Run the setup script to download dependencies:
   ```bash
   ./setup.sh
   ```
3. Create or convert the icon files to PNG format
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select this directory
7. The extension is now installed!

## Usage

1. Navigate to any web page
2. Press **Cmd+Shift+K** (Mac) or **Ctrl+Shift+K** (Windows/Linux)
3. A new tab opens with the converted Markdown
4. Click "Copy to Clipboard" or "Download" as needed

Alternatively, click the extension icon and press "Convert Current Page".

## 🔧 How It Works

WebMD uses a sophisticated two-stage approach to convert web content:

1. **🔍 Initial Diagnosis**: Examines the page structure using Mozilla's Readability.js
   - Identifies article content vs. navigation/ads
   - Extracts metadata and authorship information
   - Determines the main content boundaries

2. **✂️ Content Extraction**: Surgically removes the main content from surrounding clutter
   - Preserves semantic HTML structure
   - Removes scripts, styles, and hidden elements
   - Maintains content hierarchy and relationships

3. **🚨 Intelligent Fallback**: For non-article pages, performs smart full-page conversion
   - Searches for main content areas (main, article, [role="main"])
   - Falls back to body content when needed
   - Cleans up navigation and footer elements

4. **💊 Treatment**: Applies Turndown.js with GitHub Flavored Markdown
   - Custom rules for code block preservation
   - Smart table formatting
   - Maintains link references

## Configuration

Access settings through the extension popup:

- **Use Readability for articles**: Enable/disable article extraction
- **Include metadata**: Add YAML frontmatter with page metadata
- **Auto-copy to clipboard**: Automatically copy result when conversion completes

## 📐 Technical Details

### Architecture
- **Manifest V3**: Built on Chrome's latest extension platform for security and performance
- **Service Worker**: Background script handles commands and tab management
- **Content Scripts**: Injected on-demand for better performance and compatibility
- **Programmatic Injection**: Works on all pages, including those loaded before installation

### Security & Privacy
- **Content Security**: Respects page CSP policies
- **Local Processing**: All conversion happens in your browser
- **No External Requests**: Zero network traffic for conversion
- **No Tracking**: No analytics or telemetry

### Performance
- **Lazy Loading**: Scripts injected only when needed
- **Efficient Processing**: Handles large documents without UI blocking
- **Memory Management**: Cleans up resources after conversion
- **Optimized Rendering**: Fast display of converted content

## Libraries Used

- [Readability.js](https://github.com/mozilla/readability) (v0.4.4) - Article extraction
- [Turndown](https://github.com/domchristie/turndown) (v7.1.2) - HTML to Markdown conversion
- [Turndown GFM Plugin](https://github.com/domchristie/turndown-plugin-gfm) (v1.0.2) - GitHub Flavored Markdown support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up the development environment
- Code style and standards
- Submitting pull requests
- Reporting issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mozilla Readability](https://github.com/mozilla/readability) for intelligent content extraction
- [Turndown](https://github.com/domchristie/turndown) for excellent HTML to Markdown conversion
- [Turndown GFM Plugin](https://github.com/domchristie/turndown-plugin-gfm) for GitHub Flavored Markdown support

---

<p align="center">Made with ❤️ for better web content portability</p>