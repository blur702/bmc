#!/bin/bash

# BMC Helix Monitor - Icon Generator Script
# Converts icon.svg to PNG files at multiple sizes
# Requires: ImageMagick (convert command)

echo "🎫 BMC Helix Monitor - Icon Generator"
echo "======================================"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo "Please install it:"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - macOS: brew install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org/script/download.php"
    echo ""
    echo "OR use the generate-icons.html file instead (no dependencies needed)"
    exit 1
fi

# Check if icon.svg exists
if [ ! -f "icon.svg" ]; then
    echo "❌ icon.svg not found in current directory!"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

echo "🎨 Generating PNG icons from SVG..."
echo ""

# Generate icons at different sizes
sizes=(16 32 48 128)

for size in "${sizes[@]}"; do
    output="icons/icon${size}.png"
    echo "  📐 Creating ${output} (${size}x${size})"
    
    convert -background none -density 600 -resize ${size}x${size} icon.svg "$output"
    
    if [ $? -eq 0 ]; then
        echo "     ✅ Success!"
    else
        echo "     ❌ Failed!"
    fi
done

echo ""
echo "🎉 Done! Icons created in ./icons/ folder"
echo ""
echo "Next steps:"
echo "  1. Check the icons/ folder"
echo "  2. Load the extension in Chrome (chrome://extensions/)"
echo "  3. Enable Developer Mode"
echo "  4. Click 'Load unpacked' and select this folder"
echo ""
