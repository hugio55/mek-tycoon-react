// Test script to identify fireworks page issues
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8085,
  path: '/',
  method: 'GET'
};

console.log('Testing fireworks page at http://localhost:8085/...\n');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('=== FIREWORKS PAGE ANALYSIS ===\n');
    
    // Check critical elements
    const checks = [
      { name: 'Stars Canvas', check: data.includes('id="stars-canvas"') },
      { name: 'Fireworks Canvas', check: data.includes('id="fireworks-canvas"') },
      { name: 'Click Handler', check: data.includes('canvas.addEventListener("click"') },
      { name: 'drawStars Function', check: data.includes('function drawStars()') },
      { name: 'createStars Function', check: data.includes('function createStars()') },
      { name: 'Stars Array', check: data.includes('const stars = []') },
      { name: 'Animation Loop', check: data.includes('function animate()') },
      { name: 'Canvas Resize', check: data.includes('function resizeCanvases()') },
      { name: 'Rocket Class', check: data.includes('class Rocket') },
      { name: 'Particle Class', check: data.includes('class Particle') },
      { name: 'Button Style 5 (Embers)', check: data.includes('button-style-5') },
      { name: 'Ember Canvas in Button', check: data.includes('.button-style-5 canvas') }
    ];
    
    console.log('STRUCTURAL CHECKS:');
    checks.forEach(check => {
      console.log(`${check.check ? '✅' : '❌'} ${check.name}`);
    });
    
    // Check potential issues
    console.log('\nPOTENTIAL ISSUES:');
    
    // Check if canvases are properly initialized
    if (!data.includes('resizeCanvases()')) {
      console.log('❌ Canvas resize not called - canvases may have 0 dimensions');
    } else {
      console.log('✅ Canvas resize function is called');
    }
    
    // Check if animation loop starts
    if (!data.includes('animate()')) {
      console.log('❌ Animation loop not started - nothing will render');
    } else {
      console.log('✅ Animation loop is started');
    }
    
    // Check canvas context retrieval
    if (!data.includes('getContext("2d")')) {
      console.log('❌ No 2D context retrieval found');
    } else {
      console.log('✅ Canvas 2D contexts are retrieved');
    }
    
    // Check if stars are created
    if (!data.includes('createStars()')) {
      console.log('❌ createStars() not called - no stars will appear');
    } else {
      console.log('✅ createStars() is called');
    }
    
    console.log('\nIMAGE ASSETS REFERENCED:');
    const imageRefs = [
      './BG images/back 1.webp',
      './BG images/middle 1.webp', 
      './BG images/top 2.webp',
      './Northstar-Fireworks-Logo.png'
    ];
    
    imageRefs.forEach(img => {
      console.log(`📁 ${data.includes(img) ? '✅' : '❌'} ${img}`);
    });
    
    console.log('\nJAVASCRIPT ERRORS TO CHECK:');
    console.log('- Canvas dimensions (width/height should be > 0)');
    console.log('- DOM elements must exist before accessing');
    console.log('- Image loading errors');
    console.log('- Audio file missing (boom.mp3)');
    
    console.log('\nRECOMMENDATIONS:');
    console.log('1. Open browser dev tools and check for JavaScript errors');
    console.log('2. Verify canvas elements have proper width/height');
    console.log('3. Check if images are loading properly');
    console.log('4. Test click events on canvas area specifically');
    console.log('5. Look for CSS z-index conflicts preventing clicks');
  });
});

req.on('error', (err) => {
  console.error('❌ Failed to connect to server:', err.message);
  console.log('Make sure the server is running on port 8085');
});

req.end();