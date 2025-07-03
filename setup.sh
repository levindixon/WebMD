#!/bin/bash

# Setup script for Page to Markdown Chrome Extension

echo "Setting up Page to Markdown Chrome Extension..."

# Create lib directory
mkdir -p lib

# Download Readability.js
echo "Downloading Readability.js..."
curl -L https://unpkg.com/@mozilla/readability@0.4.4/Readability.js -o lib/readability.js

# Download Turndown
echo "Downloading Turndown..."
curl -L https://unpkg.com/turndown@7.1.2/dist/turndown.js -o lib/turndown.js

# Download Turndown GFM plugin
echo "Downloading Turndown GFM plugin..."
curl -L https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js -o lib/turndown-plugin-gfm.js

# Create placeholder icons
echo "Creating placeholder icons..."
for size in 16 48 128; do
  echo "Creating ${size}x${size} icon..."
  # Create a simple SVG icon
  cat > icon-${size}.svg << EOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#007bff"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="$((size/3))">MD</text>
</svg>
EOF
  
  # Note: You'll need to convert these to PNG manually or use a tool like ImageMagick
  echo "Note: Convert icon-${size}.svg to icon-${size}.png"
done

echo ""
echo "Setup complete! Next steps:"
echo "1. Convert the SVG icons to PNG format (or create your own icons)"
echo "2. Open Chrome and go to chrome://extensions/"
echo "3. Enable Developer mode"
echo "4. Click 'Load unpacked' and select this directory"
echo "5. The extension should now be installed!"
echo ""
echo "Usage: Press Cmd+M+D (Mac) or Ctrl+Shift+M (Windows/Linux) on any webpage"