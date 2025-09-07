const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create 200 round PNG images with different colors
function generateEventImages() {
  const width = 300;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 140;

  // Color schemes for variety
  const colorSchemes = [
    { bg: '#FF6B6B', fg: '#FFFFFF', accent: '#FFE66D' }, // Red
    { bg: '#4ECDC4', fg: '#FFFFFF', accent: '#F7FFF7' }, // Teal
    { bg: '#95E1D3', fg: '#3D5A80', accent: '#F6F6F6' }, // Mint
    { bg: '#FFD93D', fg: '#6C5CE7', accent: '#FFFFFF' }, // Yellow
    { bg: '#6C5CE7', fg: '#FFFFFF', accent: '#FFD93D' }, // Purple
    { bg: '#A8E6CF', fg: '#355C7D', accent: '#FFFFFF' }, // Green
    { bg: '#FF8B94', fg: '#FFFFFF', accent: '#FFAAA5' }, // Pink
    { bg: '#355C7D', fg: '#FFFFFF', accent: '#C06C84' }, // Navy
    { bg: '#F67280', fg: '#FFFFFF', accent: '#C06C84' }, // Coral
    { bg: '#2D3436', fg: '#74B9FF', accent: '#00D2D3' }, // Dark
  ];

  const outputDir = path.join(__dirname, 'public', 'event-images');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 1; i <= 200; i++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Clear canvas with transparency
    ctx.clearRect(0, 0, width, height);

    // Pick a color scheme
    const scheme = colorSchemes[(i - 1) % colorSchemes.length];
    
    // Draw main circle with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, scheme.bg);
    gradient.addColorStop(0.8, scheme.bg);
    gradient.addColorStop(1, adjustBrightness(scheme.bg, -20));
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add inner ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = scheme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add event number in center
    ctx.fillStyle = scheme.fg;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i.toString(), centerX, centerY - 20);

    // Add "EVENT" text
    ctx.font = 'bold 24px Arial';
    ctx.fillText('EVENT', centerX, centerY + 30);

    // Add decorative elements based on number
    const pattern = (i - 1) % 10;
    ctx.strokeStyle = scheme.accent;
    ctx.lineWidth = 2;

    if (pattern < 3) {
      // Add corner dots
      for (let j = 0; j < 4; j++) {
        const angle = (Math.PI / 2) * j + Math.PI / 4;
        const dotX = centerX + Math.cos(angle) * (radius - 30);
        const dotY = centerY + Math.sin(angle) * (radius - 30);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = scheme.accent;
        ctx.fill();
      }
    } else if (pattern < 6) {
      // Add star pattern
      drawStar(ctx, centerX, centerY + 70, 15, 5, scheme.accent);
    } else {
      // Add horizontal lines
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 60);
      ctx.lineTo(centerX + 40, centerY - 60);
      ctx.moveTo(centerX - 40, centerY + 60);
      ctx.lineTo(centerX + 40, centerY + 60);
      ctx.stroke();
    }

    // Save the image
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(outputDir, `event-${i}.png`);
    fs.writeFileSync(filename, buffer);
    
    if (i % 20 === 0) {
      console.log(`Generated ${i}/200 images...`);
    }
  }

  console.log('Successfully generated 200 event images!');
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1).toUpperCase();
}

function drawStar(ctx, cx, cy, outerRadius, points, color) {
  const innerRadius = outerRadius * 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Check if canvas module is available
try {
  generateEventImages();
} catch (error) {
  console.error('Canvas module not found. Installing canvas package...');
  console.log('Run: npm install canvas');
  
  // Alternative: Create simple placeholder using native Node.js
  const simplePlaceholder = () => {
    const outputDir = path.join(__dirname, 'public', 'event-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create a simple SVG as placeholder
    for (let i = 1; i <= 200; i++) {
      const color = `hsl(${(i * 360 / 200) % 360}, 70%, 60%)`;
      const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="150" cy="150" r="140" fill="${color}" />
        <circle cx="150" cy="150" r="130" fill="none" stroke="white" stroke-width="3" />
        <text x="150" y="140" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${i}</text>
        <text x="150" y="180" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">EVENT</text>
      </svg>`;
      
      const filename = path.join(outputDir, `event-${i}.svg`);
      fs.writeFileSync(filename, svg);
      
      if (i % 20 === 0) {
        console.log(`Generated ${i}/200 SVG placeholders...`);
      }
    }
    console.log('Generated 200 SVG event placeholders. Install canvas package for PNG generation.');
  };
  
  simplePlaceholder();
}