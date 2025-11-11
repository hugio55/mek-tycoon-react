const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/landing-debug/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the conditional wrappers for each tab
const patterns = [
  // Layer 1 - Star Controls Section
  {
    start: /\s*\{config\.activeTab === 'layer1' && \(\n\s*<div className="bg-gray-800 border border-gray-700 rounded p-3">/,
    replace: '<div className="bg-gray-800 border border-gray-700 rounded p-3">'
  },
  // Layer 1 - Twinkling Controls (has closing )}before it)
  {
    start: /\s*\)\}\n\n\s*\{\/\* Layer 1 Twinkling Controls \*\/\}\n\s*\{config\.activeTab === 'layer1' && \(\n\s*<div/,
    replace: '\n\n          {/* Layer 1 Twinkling Controls */}\n          <div'
  },
  // Layer 2 (with fragment wrapper)
  {
    start: /\s*\)\}\n\n\s*\{\/\* Star Controls Section - Layer 2 \*\/\}\n\s*\{config\.activeTab === 'layer2' && \(\n\s*<>\n\s*<div/,
    replace: '\n\n          {/* Star Controls Section - Layer 2 */}\n          <div'
  },
  // Layer 2 closing (</> and )})
  {
    start: /\s*<\/>\n\s*\)\}\n\n\s*\{\/\* Star Controls Section - Layer 3 \*\/\}/,
    replace: '\n\n          {/* Star Controls Section - Layer 3 */}'
  },
  // Layer 3
  {
    start: /\s*\{config\.activeTab === 'layer3' && \(\n\s*<div className="bg-gray-800 border border-purple-500/,
    replace: '<div className="bg-gray-800 border border-purple-500'
  },
  // Background Stars
  {
    start: /\s*\)\}\n\n\s*\{\/\* Background Stars \(Static\) Controls \*\/\}\n\s*\{config\.activeTab === 'bgstars' && \(\n\s*<div/,
    replace: '\n\n          {/* Background Stars (Static) Controls */}\n          <div'
  },
  // Logo/Layout
  {
    start: /\s*\)\}\n\n\s*\{\/\* Layout Controls Section \*\/\}\n\s*\{config\.activeTab === 'logo' && \(\n\s*<div/,
    replace: '\n\n          {/* Layout Controls Section */}\n          <div'
  },
  // Motion
  {
    start: /\s*\)\}\n\n\s*\{\/\* Motion Blur Controls \*\/\}\n\s*\{config\.activeTab === 'motion' && \(\n\s*<div/,
    replace: '\n\n          {/* Motion Blur Controls */}\n          <div'
  },
  // Description
  {
    start: /\s*\)\}\n\n\s*\{\/\* Description Controls Section \*\/\}\n\s*\{config\.activeTab === 'description' && \(\n\s*<div/,
    replace: '\n\n          {/* Description Controls Section */}\n          <div'
  },
  // Phases
  {
    start: /\s*\)\}\n\n\s*\{\/\* Phase Carousel Controls \*\/\}\n\s*\{config\.activeTab === 'phases' && \(\n\s*<div/,
    replace: '\n\n          {/* Phase Carousel Controls */}\n          <div'
  },
  // Power Button
  {
    start: /\s*\)\}\n\n\s*\{\/\* Power Button Controls \*\/\}\n\s*\{config\.activeTab === 'power' && \(\n\s*<div/,
    replace: '\n\n          {/* Power Button Controls */}\n          <div'
  },
  // Speaker
  {
    start: /\s*\)\}\n\n\s*\{\/\* Speaker Icon Style \*\/\}\n\s*\{config\.activeTab === 'speaker' && \(\n\s*<div/,
    replace: '\n\n          {/* Speaker Icon Style */}\n          <div'
  },
  // Other
  {
    start: /\s*\)\}\n\n\s*\{\/\* Design Variations \*\/\}\n\s*\{config\.activeTab === 'other' && \(\n\s*<div/,
    replace: '\n\n          {/* Design Variations */}\n          <div'
  },
  // Audio
  {
    start: /\s*\)\}\n\n\s*\{\/\* Audio Consent Lightbox Testing \*\/\}\n\s*\{config\.activeTab === 'audio' && \(\n\s*<div/,
    replace: '\n\n          {/* Audio Consent Lightbox Testing */}\n          <div'
  },
];

// Apply all pattern replacements
patterns.forEach(pattern => {
  content = content.replace(pattern.start, pattern.replace);
});

// Remove any remaining standalone )} at section ends (be careful with indentation)
// This is trickier - we need to look for )} that close conditional sections but not other things

fs.writeFileSync(filePath, content, 'utf8');
console.log('Tab conditionals removed successfully!');
