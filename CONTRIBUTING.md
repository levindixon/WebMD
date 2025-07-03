# Contributing to WebMD Chrome Extension

Thank you for your interest in contributing to WebMD! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/anything-to-md.git
   cd anything-to-md
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/anything-to-md.git
   ```

## Development Setup

### Prerequisites

- Chrome browser (for testing)
- Git
- Basic knowledge of JavaScript and Chrome Extension APIs

### Installation

1. **Download dependencies** using the setup script:
   ```bash
   ./setup.sh
   ```
   
2. **Convert SVG icons to PNG** (if not already done):
   - The setup script creates SVG placeholders
   - Convert these to PNG format or create your own 16x16, 48x48, and 128x128 PNG icons

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the project directory

### Alternative Setup (npm-based)

If you prefer using npm for dependency management:

```bash
npm install
npm run build
```

Note: The current implementation uses direct library files. The npm setup is optional.

## Project Structure

```
anything-to-md/
├── manifest.json          # Chrome extension manifest (v3)
├── background.js          # Service worker for handling commands
├── content.js            # Content script for page conversion
├── popup.html/js         # Extension popup interface
├── lib/                  # Third-party libraries
│   ├── readability.js    # Mozilla's article extraction
│   ├── turndown.js       # HTML to Markdown converter
│   └── turndown-plugin-gfm.js  # GitHub Flavored Markdown
├── icon-*.png           # Extension icons
├── setup.sh             # Setup script
└── docs/                # Documentation files
```

## Making Changes

### Development Workflow

1. **Create a new branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test thoroughly**:
   - Test on various types of web pages (articles, documentation, blogs)
   - Verify keyboard shortcuts work correctly
   - Check popup functionality and settings persistence
   - Test both with Readability enabled and disabled

4. **Reload the extension** after changes:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the WebMD extension card

### Key Areas for Contribution

- **Bug fixes**: Check the issues page for reported bugs
- **Feature enhancements**: New conversion rules, better content detection
- **Performance improvements**: Optimize conversion speed for large pages
- **Documentation**: Improve setup guides, add examples
- **Accessibility**: Enhance keyboard navigation, screen reader support
- **Internationalization**: Add support for more languages

## Testing

Currently, testing is manual. When testing your changes:

1. **Test various page types**:
   - News articles
   - Technical documentation
   - Blog posts
   - Forum threads
   - Pages with code blocks

2. **Verify core functionality**:
   - Keyboard shortcut (Cmd+Shift+K / Ctrl+Shift+K)
   - Popup button conversion
   - Copy to clipboard
   - Download functionality
   - Settings persistence

3. **Check edge cases**:
   - Pages with no main content
   - Pages with complex layouts
   - Pages with heavy JavaScript
   - Protected/restricted pages

## Submitting Changes

1. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "Add: Support for extracting publication dates"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Go to your fork on GitHub
   - Click "New pull request"
   - Provide a clear title and description
   - Reference any related issues

### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Screenshots**: Include before/after screenshots for UI changes
- **Testing**: Describe how you tested the changes
- **Issues**: Reference any issues this PR addresses

## Coding Standards

### JavaScript Style

- Use ES6+ features where appropriate
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions focused and concise

### Code Organization

- Group related functionality together
- Use clear, descriptive comments
- Maintain consistent indentation (2 spaces)
- Avoid global variables where possible

### Example Code Style

```javascript
/**
 * Extracts metadata from the current page
 * @param {Document} doc - The document to extract from
 * @returns {Object} Metadata object with title, author, etc.
 */
function extractMetadata(doc) {
  const metadata = {
    title: doc.title,
    url: window.location.href,
    date: new Date().toISOString()
  };
  
  // Extract author if available
  const authorMeta = doc.querySelector('meta[name="author"]');
  if (authorMeta) {
    metadata.author = authorMeta.content;
  }
  
  return metadata;
}
```

## Reporting Issues

When reporting issues, please include:

1. **Chrome version**: (chrome://version/)
2. **Extension version**: (visible in chrome://extensions/)
3. **Steps to reproduce**: Detailed steps to recreate the issue
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Example URL**: If applicable, a URL where the issue occurs
7. **Screenshots**: If relevant to the issue

### Issue Template

```
**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Go to [URL]
2. Press Cmd+Shift+K
3. Observe the result

**Expected Result:**
The page should convert to Markdown

**Actual Result:**
Error message appears: [error details]

**Environment:**
- Chrome: [version]
- OS: [Windows/Mac/Linux]
- Extension Version: [version]
```

## Questions?

If you have questions about contributing:

1. Check existing issues and pull requests
2. Review the documentation in CLAUDE.md
3. Open a new issue with the "question" label

Thank you for contributing to WebMD! Your efforts help make web content more portable and accessible for everyone.