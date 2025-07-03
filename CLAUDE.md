# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome extension that converts web pages to Markdown format using Mozilla's Readability.js for article extraction and Turndown.js for HTML-to-Markdown conversion. The extension supports keyboard shortcuts (Cmd+Shift+K on Mac, Ctrl+Shift+K on Windows/Linux) and provides a popup interface.

## Architecture

### Core Components

1. **Content Script** (`content.js`)
   - Implements the HTML-to-Markdown conversion logic
   - Uses hybrid approach: Readability.js for article extraction, then Turndown.js for conversion
   - Handles message passing with background script and popup
   - Contains custom Turndown rules for code blocks and other elements

2. **Background Service Worker** (`background.js`)
   - Handles keyboard commands and creates new tabs with Markdown output
   - Manages communication between extension components
   - Generates HTML preview page with copy/download functionality

3. **Popup Interface** (`popup.js`, `popup.html`)
   - Provides UI for manual conversion and settings
   - Programmatically injects content scripts when needed
   - Manages extension settings (Readability, metadata, auto-copy)

4. **Dependencies** (in `lib/` directory)
   - `readability.js` - Mozilla's article extraction library
   - `turndown.js` - HTML to Markdown converter
   - `turndown-plugin-gfm.js` - GitHub Flavored Markdown support

### Key Technical Details

- Uses Chrome Extension Manifest V3
- Requires permissions: `activeTab`, `storage`, `scripting`
- Content scripts are both declared in manifest and injected programmatically
- Settings stored in Chrome sync storage

## Common Commands

```bash
# Install dependencies (if using npm workflow)
npm install

# Build for production
npm run build

# Development build with watch mode
npm run dev

# Clean build directory
npm run clean

# Create production bundle with libraries
npm run bundle

# Download libraries without npm (alternative setup)
./setup.sh

# Generate extension icons (manual step after setup.sh)
# Convert SVG files to PNG: icon-16.svg → icon-16.png, etc.
```

## Development Workflow

1. Make changes to extension files
2. If modifying webpack-based workflow, run `npm run dev`
3. For direct file editing (current approach), no build needed
4. Reload extension in Chrome Extensions page (chrome://extensions/)
5. Test with keyboard shortcut or popup button

## Testing Approach

Currently no automated tests. Test manually by:
1. Loading extension in Chrome developer mode
2. Testing conversion on various page types (articles, documentation, etc.)
3. Verifying keyboard shortcuts work
4. Checking popup functionality and settings persistence