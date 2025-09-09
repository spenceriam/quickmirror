const fs = require('fs');
const path = require('path');

// Since we don't have imagemagick or sharp installed, 
// we'll create a simple HTML file that can be opened in a browser
// and used to manually generate PNG files from the SVG

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="128" cy="128" r="118" fill="#10B981" stroke="#059669" stroke-width="4"/>
  
  <!-- Q Letter -->
  <g transform="translate(40,80)">
    <!-- Q circle -->
    <circle cx="35" cy="48" r="30" stroke="white" stroke-width="8" fill="none"/>
    <!-- Q tail -->
    <line x1="55" y1="68" x2="75" y2="88" stroke="white" stroke-width="8" stroke-linecap="round"/>
  </g>
  
  <!-- M Letter -->
  <g transform="translate(130,80)">
    <!-- Left leg -->
    <line x1="5" y1="20" x2="5" y2="88" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <!-- Right leg -->
    <line x1="85" y1="20" x2="85" y2="88" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <!-- Left diagonal -->
    <line x1="5" y1="20" x2="45" y2="60" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <!-- Right diagonal -->
    <line x1="85" y1="20" x2="45" y2="60" stroke="white" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>`;

const sizes = [16, 32, 44, 89, 107, 128, 142, 150, 256, 284, 310];

// Create the HTML file for manual conversion
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>QuikMirror Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-size { margin: 20px 0; }
        canvas { border: 1px solid #ccc; margin: 10px; }
    </style>
</head>
<body>
    <h1>QuikMirror Icon Generator</h1>
    <p>Instructions:</p>
    <ol>
        <li>Right-click on each canvas below</li>
        <li>Save as PNG with the corresponding filename</li>
        <li>Place files in the src-tauri/icons/ directory</li>
    </ol>
    
    ${sizes.map(size => `
        <div class="icon-size">
            <h3>${size}x${size} - Save as: ${size}x${size}.png</h3>
            <canvas id="canvas${size}" width="${size}" height="${size}"></canvas>
        </div>
    `).join('')}
    
    <script>
        const svgString = \`${svgContent}\`;
        
        function drawIconAtSize(size) {
            const canvas = document.getElementById('canvas' + size);
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
        }
        
        // Draw all icon sizes
        ${sizes.map(size => `drawIconAtSize(${size});`).join('\n        ')}
    </script>
</body>
</html>
`;

// Create scripts directory if it doesn't exist
if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts');
}

// Write the HTML file
fs.writeFileSync('icon-generator.html', htmlContent);
console.log('Created icon-generator.html - open this file in a browser to generate PNG icons');

console.log('Required icon sizes for Tauri/Electron:');
sizes.forEach(size => {
    console.log(`- ${size}x${size}.png`);
});
