# Page to Markdown Chrome Extension

Convert any web page to clean, well-formatted Markdown with a simple keyboard shortcut (Cmd+M+D on Mac, Ctrl+Shift+M on Windows/Linux).

## Features

- **Smart Conversion**: Uses Readability.js to extract article content when possible, falling back to full page conversion
- **Accurate Formatting**: Preserves headings, lists, tables, code blocks, and more
- **GitHub Flavored Markdown**: Supports tables, task lists, and strikethrough
- **Metadata Extraction**: Captures title, author, date, and source URL
- **One-Click Copy**: Easily copy the converted Markdown to your clipboard
- **Download Option**: Save the Markdown as a .md file

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

## How It Works

The extension uses a hybrid approach for maximum accuracy:

1. **Article Detection**: First attempts to extract article content using Mozilla's Readability.js
2. **Clean Extraction**: If article content is detected, converts only the main content
3. **Fallback Conversion**: For non-article pages, converts the main content area or full page
4. **Markdown Generation**: Uses Turndown.js with GitHub Flavored Markdown for accurate conversion

## Configuration

Access settings through the extension popup:

- **Use Readability for articles**: Enable/disable article extraction
- **Include metadata**: Add YAML frontmatter with page metadata
- **Auto-copy to clipboard**: Automatically copy result when conversion completes

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension architecture
- **Content Security**: Respects page CSP and doesn't inject external resources
- **Performance**: Processes large pages efficiently without blocking the UI
- **Privacy**: All conversion happens locally - no data is sent to external servers

## Libraries Used

- [Readability.js](https://github.com/mozilla/readability) (v0.4.4) - Article extraction
- [Turndown](https://github.com/domchristie/turndown) (v7.1.2) - HTML to Markdown conversion
- [Turndown GFM Plugin](https://github.com/domchristie/turndown-plugin-gfm) (v1.0.2) - GitHub Flavored Markdown support

## License

MIT