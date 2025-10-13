const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const outputDir = path.join(__dirname, 'public', 'event-nfts');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Color schemes for difficulty levels
const difficultyColors = {
  E: '#90EE90', // Light green
  M: '#FFD700', // Yellow/Gold
  H: '#FF6B6B'  // Red
};

const difficultyNames = {
  E: 'EASY',
  M: 'MEDIUM',
  H: 'HARD'
};

// Generate 60 images (20 events × 3 difficulties)
for (let eventNum = 1; eventNum <= 20; eventNum++) {
  ['E', 'M', 'H'].forEach(difficulty => {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');

    // Background color
    ctx.fillStyle = difficultyColors[difficulty];
    ctx.fillRect(0, 0, 500, 500);

    // Add subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);

    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 496, 496);

    // Draw text - main identifier
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const identifier = `E${eventNum}-${difficulty}`;
    ctx.fillText(identifier, 250, 220);

    // Draw subtitle - difficulty name
    ctx.font = '32px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(difficultyNames[difficulty], 250, 290);

    // Draw event number at bottom
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(`Event ${eventNum}`, 250, 450);

    // Save image
    const filename = `${identifier}.png`;
    const filepath = path.join(outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
    console.log(`Created: ${filename}`);
  });
}

console.log('\n✓ Successfully generated 60 event placeholder images!');
