# PWA Icons

## Required Icons

- `icon-192x192.png` - 192x192px app icon
- `icon-512x512.png` - 512x512px app icon

## Generation Instructions

Use a tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or generate from an SVG with ImageMagick:

```bash
# From SVG source
convert -background none -resize 192x192 logo.svg icon-192x192.png
convert -background none -resize 512x512 logo.svg icon-512x512.png
```

## Design Requirements

- **Background**: Dark theme (#09090b)
- **Icon**: RetroPhoto logo or vintage camera icon
- **Safe area**: Keep important content within 80% of the canvas (40px padding for 192px icon)
- **Format**: PNG with transparency
- **Purpose**: `any maskable` (icon should work both as-is and with OS masking)

## Temporary Placeholder

Until final icons are created, use a simple placeholder:
- Solid color background (#09090b)
- "RP" text in center (white, bold)
- Rounded corners (20% of width)
