// Simple script to create placeholder icon files
const fs = require('fs');
const path = require('path');

// Create a simple SVG and convert to data URL for icons
const createIcon = (size) => {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-size="${size * 0.6}" text-anchor="middle" dy=".3em" fill="white">🛡</text>
</svg>`;
  
  return Buffer.from(svg);
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create icon files
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  const svgContent = createIcon(size);
  fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
  console.log(`Created icon-${size}.svg`);
});

console.log('Icon files created successfully!');
console.log('Note: SVG files created. For PNG, please convert manually or use an image tool.');
