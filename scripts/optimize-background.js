/**
 * Background Image Optimization Script
 *
 * Generates multiple sizes of the background image for responsive loading.
 * Reduces mobile data usage by 67% by serving appropriate image sizes.
 *
 * Usage: node scripts/optimize-background.js
 *
 * Requirements:
 * - npm install sharp
 *
 * Output:
 * - colored-bg-1-mobile.webp (750w, ~100KB) - For mobile devices
 * - colored-bg-1-tablet.webp (1536w, ~200KB) - For tablets
 * - colored-bg-1-desktop.webp (1920w, ~305KB) - For desktop (current file)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../public/colored-bg-1.webp');
const OUTPUT_DIR = path.join(__dirname, '../public');

const SIZES = [
  { name: 'mobile', width: 750, quality: 80 },
  { name: 'tablet', width: 1536, quality: 85 },
  { name: 'desktop', width: 1920, quality: 90 },
];

async function optimizeBackgrounds() {
  console.log('🎨 Background Image Optimization Script\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: Input file not found at ${INPUT_FILE}`);
    process.exit(1);
  }

  // Get original file size
  const originalStats = fs.statSync(INPUT_FILE);
  const originalSizeKB = (originalStats.size / 1024).toFixed(2);
  console.log(`📁 Original: colored-bg-1.webp (${originalSizeKB} KB)\n`);

  // Generate each size
  for (const { name, width, quality } of SIZES) {
    const outputFile = path.join(OUTPUT_DIR, `colored-bg-1-${name}.webp`);

    try {
      console.log(`⚙️  Processing ${name} version (${width}px width)...`);

      await sharp(INPUT_FILE)
        .resize(width, null, {
          // Maintain aspect ratio
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 6, // Higher effort = better compression (0-6)
        })
        .toFile(outputFile);

      // Get output file size
      const outputStats = fs.statSync(outputFile);
      const outputSizeKB = (outputStats.size / 1024).toFixed(2);
      const savings = ((1 - outputStats.size / originalStats.size) * 100).toFixed(0);

      console.log(`✅ ${name}: ${outputSizeKB} KB (${savings}% smaller)\n`);
    } catch (error) {
      console.error(`❌ Error processing ${name} version:`, error.message);
    }
  }

  console.log('✨ Optimization complete!');
  console.log('\n📊 Recommended Usage:');
  console.log('- Mobile (< 768px): colored-bg-1-mobile.webp');
  console.log('- Tablet (768px-1280px): colored-bg-1-tablet.webp');
  console.log('- Desktop (> 1280px): colored-bg-1-desktop.webp');
}

optimizeBackgrounds().catch(error => {
  console.error('❌ Optimization failed:', error);
  process.exit(1);
});
