const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const outputDir = path.join(__dirname, 'public', 'genesis-art');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Genesis definitions
const genesisTypes = [
  {
    name: 'Teal Genesis',
    filename: 'teal-genesis.png',
    backgroundColor: '#20B2AA' // Light Sea Green / Teal
  },
  {
    name: 'Red Genesis',
    filename: 'red-genesis.png',
    backgroundColor: '#DC143C' // Crimson Red
  },
  {
    name: 'Pink Genesis',
    filename: 'pink-genesis.png',
    backgroundColor: '#FF69B4' // Hot Pink
  },
  {
    name: 'Rainbow Genesis',
    filename: 'rainbow-genesis.png',
    backgroundColor: null // Will use gradient
  },
  {
    name: 'Green Genesis',
    filename: 'green-genesis.png',
    backgroundColor: '#32CD32' // Lime Green
  }
];

// Generate each Genesis image
genesisTypes.forEach(genesis => {
  const canvas = createCanvas(500, 500);
  const ctx = canvas.getContext('2d');

  // Special handling for Rainbow Genesis
  if (genesis.name === 'Rainbow Genesis') {
    // Create rainbow gradient
    const gradient = ctx.createLinearGradient(0, 0, 500, 500);
    gradient.addColorStop(0, '#FF0000');    // Red
    gradient.addColorStop(0.17, '#FF7F00'); // Orange
    gradient.addColorStop(0.33, '#FFFF00'); // Yellow
    gradient.addColorStop(0.5, '#00FF00');  // Green
    gradient.addColorStop(0.67, '#0000FF'); // Blue
    gradient.addColorStop(0.83, '#4B0082'); // Indigo
    gradient.addColorStop(1, '#9400D3');    // Violet
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);
  } else {
    // Solid background color
    ctx.fillStyle = genesis.backgroundColor;
    ctx.fillRect(0, 0, 500, 500);
  }

  // Add subtle gradient overlay for depth
  const overlayGradient = ctx.createLinearGradient(0, 0, 0, 500);
  overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, 500, 500);

  // Draw border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 494, 494);

  // Draw inner glow border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 480, 480);

  // Draw text with shadow for better readability
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Add text shadow
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw main text
  ctx.fillText(genesis.name.toUpperCase(), 250, 250);

  // Remove shadow for subtitle
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw subtitle
  ctx.font = '24px Arial';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillText('PLACEHOLDER', 250, 320);

  // Save image
  const filepath = path.join(outputDir, genesis.filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`Created: ${genesis.filename}`);
});

console.log('\n✓ Successfully generated 5 Genesis placeholder images!');
