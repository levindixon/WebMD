# WebMD - Web to Markdown Chrome Extension

📋 WebMD transforms web pages into Markdown documents with surgical precision. This Chrome extension extracts content intelligently, preserves formatting perfectly, and exports to GitHub Flavored Markdown instantly. Press Cmd+Shift+K to diagnose any webpage and get the cure: clean, portable Markdown.

## Features

- **Smart Article Extraction**: Uses Mozilla's Readability.js to diagnose and extract the main content
- **Surgical Precision**: Preserves headings, lists, tables, code blocks with medical accuracy
- **GitHub Flavored Markdown**: Full support for tables, task lists, and strikethrough
- **Metadata Extraction**: Captures vital signs (title, author, date, source URL)
- **Instant Treatment**: One-click copy to clipboard or download as .md file
- **Non-invasive**: All processing happens locally - no data sent to external servers

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

WebMD uses a diagnostic approach to convert web content:

1. **Initial Diagnosis**: Examines the page using Mozilla's Readability.js
2. **Content Extraction**: Surgically removes the main content from surrounding clutter
3. **Emergency Fallback**: For non-article pages, performs full-page conversion
4. **Treatment**: Applies Turndown.js with GitHub Flavored Markdown for the cure

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