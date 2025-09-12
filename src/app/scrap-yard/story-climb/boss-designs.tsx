// BOSS NODE DESIGN OPTIONS
// Copy and paste these into the main page.tsx file to try different designs

// ============================================================================
// DESIGN OPTION 1: HOLOGRAPHIC ENERGY SHIELD (Currently Active)
// ============================================================================
// Features: Energy field layers, corner nodes, circuit patterns
// Best for: Technical/military feel

// ============================================================================
// DESIGN OPTION 2: PLASMA CONTAINMENT FIELD
// ============================================================================
/*
} else if (node.storyNodeType === 'boss') {
  // DESIGN OPTION 2: Plasma Containment Field
  const halfSize = nodeSize;
  const time = Date.now() / 1000;
  
  // Draw dark base with subtle gradient
  const baseGradient = ctx.createRadialGradient(
    pos.x, pos.y, 0,
    pos.x, pos.y, halfSize
  );
  baseGradient.addColorStop(0, 'rgba(15, 15, 30, 0.95)');
  baseGradient.addColorStop(1, 'rgba(5, 5, 15, 0.98)');
  ctx.fillStyle = baseGradient;
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw plasma containment field
  ctx.save();
  
  // Outer containment ring
  const plasmaGradient = ctx.createRadialGradient(
    pos.x, pos.y, halfSize * 0.7,
    pos.x, pos.y, halfSize
  );
  plasmaGradient.addColorStop(0, 'transparent');
  plasmaGradient.addColorStop(0.7, isCompleted ? 'rgba(16, 185, 129, 0.1)' :
                                   isAvailable ? 'rgba(220, 38, 127, 0.2)' :
                                   'rgba(107, 114, 128, 0.1)');
  plasmaGradient.addColorStop(1, isCompleted ? 'rgba(16, 185, 129, 0.4)' :
                                  isAvailable ? 'rgba(220, 38, 127, 0.6)' :
                                  'rgba(107, 114, 128, 0.2)');
  
  ctx.fillStyle = plasmaGradient;
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw energy arcs
  ctx.strokeStyle = isCompleted ? 'rgba(16, 185, 129, 0.6)' :
                   isAvailable ? 'rgba(220, 38, 127, 0.8)' :
                   'rgba(107, 114, 128, 0.3)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < 6; i++) {
    const angle = (time * 0.5 + i * Math.PI / 3) % (Math.PI * 2);
    const startX = pos.x + Math.cos(angle) * halfSize * 0.5;
    const startY = pos.y + Math.sin(angle) * halfSize * 0.5;
    const endX = pos.x + Math.cos(angle + Math.PI / 2) * halfSize * 0.8;
    const endY = pos.y + Math.sin(angle + Math.PI / 2) * halfSize * 0.8;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(pos.x, pos.y, endX, endY);
    ctx.stroke();
  }
  
  // Draw containment frame
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#dc2675' :
                   '#4b5563';
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw corner brackets
  const bracketSize = 15;
  ctx.lineWidth = 3;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(pos.x - halfSize, pos.y - halfSize + bracketSize);
  ctx.lineTo(pos.x - halfSize, pos.y - halfSize);
  ctx.lineTo(pos.x - halfSize + bracketSize, pos.y - halfSize);
  ctx.stroke();
  
  // Top-right
  ctx.beginPath();
  ctx.moveTo(pos.x + halfSize - bracketSize, pos.y - halfSize);
  ctx.lineTo(pos.x + halfSize, pos.y - halfSize);
  ctx.lineTo(pos.x + halfSize, pos.y - halfSize + bracketSize);
  ctx.stroke();
  
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(pos.x + halfSize, pos.y + halfSize - bracketSize);
  ctx.lineTo(pos.x + halfSize, pos.y + halfSize);
  ctx.lineTo(pos.x + halfSize - bracketSize, pos.y + halfSize);
  ctx.stroke();
  
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pos.x - halfSize + bracketSize, pos.y + halfSize);
  ctx.lineTo(pos.x - halfSize, pos.y + halfSize);
  ctx.lineTo(pos.x - halfSize, pos.y + halfSize - bracketSize);
  ctx.stroke();
  
  ctx.restore();
*/

// ============================================================================
// DESIGN OPTION 3: CORRUPTED DIGITAL MATRIX
// ============================================================================
/*
} else if (node.storyNodeType === 'boss') {
  // DESIGN OPTION 3: Corrupted Digital Matrix
  const halfSize = nodeSize;
  const time = Date.now() / 1000;
  
  // Draw dark corrupted base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw matrix rain effect
  ctx.save();
  ctx.globalAlpha = 0.3;
  
  const cols = 8;
  const colWidth = (halfSize * 2) / cols;
  
  for (let i = 0; i < cols; i++) {
    const x = pos.x - halfSize + i * colWidth + colWidth/2;
    const offset = (time * 30 + i * 10) % (halfSize * 2);
    
    // Draw falling digital characters
    for (let j = 0; j < 3; j++) {
      const y = pos.y - halfSize + offset - j * 20;
      if (y > pos.y - halfSize && y < pos.y + halfSize) {
        ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.8)' :
                       isAvailable ? `rgba(255, 0, 0, ${0.8 - j * 0.2})` :
                       'rgba(107, 114, 128, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x - 3, y);
      }
    }
  }
  ctx.restore();
  
  // Draw glitch scanlines
  ctx.save();
  ctx.globalAlpha = 0.2;
  
  for (let i = 0; i < 3; i++) {
    const y = pos.y - halfSize + Math.sin(time * 3 + i) * halfSize + halfSize;
    const height = 2 + Math.random() * 3;
    
    ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.5)' :
                   isAvailable ? 'rgba(255, 0, 0, 0.5)' :
                   'rgba(107, 114, 128, 0.3)';
    ctx.fillRect(pos.x - halfSize, y, halfSize * 2, height);
  }
  ctx.restore();
  
  // Draw corrupted border with gaps
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#ff0000' :
                   '#4b5563';
  ctx.lineWidth = 2;
  
  // Top border with gaps
  ctx.beginPath();
  ctx.moveTo(pos.x - halfSize, pos.y - halfSize);
  ctx.lineTo(pos.x - halfSize + 30, pos.y - halfSize);
  ctx.moveTo(pos.x - halfSize + 50, pos.y - halfSize);
  ctx.lineTo(pos.x + halfSize - 50, pos.y - halfSize);
  ctx.moveTo(pos.x + halfSize - 30, pos.y - halfSize);
  ctx.lineTo(pos.x + halfSize, pos.y - halfSize);
  
  // Right border with gaps
  ctx.moveTo(pos.x + halfSize, pos.y - halfSize);
  ctx.lineTo(pos.x + halfSize, pos.y - halfSize + 40);
  ctx.moveTo(pos.x + halfSize, pos.y - halfSize + 60);
  ctx.lineTo(pos.x + halfSize, pos.y + halfSize - 60);
  ctx.moveTo(pos.x + halfSize, pos.y + halfSize - 40);
  ctx.lineTo(pos.x + halfSize, pos.y + halfSize);
  
  // Bottom border with gaps
  ctx.moveTo(pos.x + halfSize, pos.y + halfSize);
  ctx.lineTo(pos.x + halfSize - 30, pos.y + halfSize);
  ctx.moveTo(pos.x + halfSize - 50, pos.y + halfSize);
  ctx.lineTo(pos.x - halfSize + 50, pos.y + halfSize);
  ctx.moveTo(pos.x - halfSize + 30, pos.y + halfSize);
  ctx.lineTo(pos.x - halfSize, pos.y + halfSize);
  
  // Left border with gaps
  ctx.moveTo(pos.x - halfSize, pos.y + halfSize);
  ctx.lineTo(pos.x - halfSize, pos.y + halfSize - 40);
  ctx.moveTo(pos.x - halfSize, pos.y + halfSize - 60);
  ctx.lineTo(pos.x - halfSize, pos.y - halfSize + 60);
  ctx.moveTo(pos.x - halfSize, pos.y - halfSize + 40);
  ctx.lineTo(pos.x - halfSize, pos.y - halfSize);
  
  ctx.stroke();
  
  // Warning indicators
  if (isAvailable) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('!', pos.x - halfSize + 10, pos.y - halfSize + 20);
    ctx.fillText('!', pos.x + halfSize - 15, pos.y + halfSize - 10);
    ctx.restore();
  }
*/

// ============================================================================
// DESIGN OPTION 4: MECHANICAL IRIS APERTURE
// ============================================================================
/*
} else if (node.storyNodeType === 'boss') {
  // DESIGN OPTION 4: Mechanical Iris Aperture
  const halfSize = nodeSize;
  const time = Date.now() / 1000;
  
  // Draw metallic base
  const metalGradient = ctx.createLinearGradient(
    pos.x - halfSize, pos.y - halfSize,
    pos.x + halfSize, pos.y + halfSize
  );
  metalGradient.addColorStop(0, 'rgba(40, 40, 50, 0.95)');
  metalGradient.addColorStop(0.5, 'rgba(60, 60, 70, 0.9)');
  metalGradient.addColorStop(1, 'rgba(30, 30, 40, 0.95)');
  ctx.fillStyle = metalGradient;
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw iris blades
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  const blades = 8;
  const openAmount = isAvailable ? 0.7 + Math.sin(time * 2) * 0.1 : 0.3;
  
  for (let i = 0; i < blades; i++) {
    ctx.save();
    ctx.rotate((i / blades) * Math.PI * 2);
    
    // Draw blade
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(halfSize * 0.8, -halfSize * 0.2 * openAmount);
    ctx.lineTo(halfSize * 0.9, 0);
    ctx.lineTo(halfSize * 0.8, halfSize * 0.2 * openAmount);
    ctx.closePath();
    
    ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.3)' :
                   isAvailable ? 'rgba(220, 38, 127, 0.4)' :
                   'rgba(107, 114, 128, 0.3)';
    ctx.fill();
    
    ctx.strokeStyle = isCompleted ? 'rgba(16, 185, 129, 0.6)' :
                     isAvailable ? 'rgba(220, 38, 127, 0.8)' :
                     'rgba(107, 114, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  ctx.restore();
  
  // Draw outer ring
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#dc2675' :
                   '#6b7280';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, halfSize * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw inner ring
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, halfSize * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw mechanical details
  const detailPositions = [
    { x: -halfSize * 0.7, y: -halfSize * 0.7 },
    { x: halfSize * 0.7, y: -halfSize * 0.7 },
    { x: halfSize * 0.7, y: halfSize * 0.7 },
    { x: -halfSize * 0.7, y: halfSize * 0.7 }
  ];
  
  detailPositions.forEach(detail => {
    ctx.fillStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#dc2675' :
                   '#6b7280';
    ctx.beginPath();
    ctx.arc(pos.x + detail.x, pos.y + detail.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
*/

// ============================================================================
// FINAL BOSS DESIGN OPTION 2: VOID SINGULARITY
// ============================================================================
/*
} else if (node.storyNodeType === 'final_boss') {
  // DESIGN OPTION 2: Void Singularity
  const halfSize = nodeSize;
  const time = Date.now() / 1000;
  
  // Draw void base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.98)';
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw gravitational distortion rings
  ctx.save();
  
  for (let ring = 5; ring >= 0; ring--) {
    const ringSize = halfSize * (0.3 + ring * 0.15);
    const distortion = Math.sin(time * 2 - ring * 0.5) * 5;
    
    ctx.save();
    ctx.translate(pos.x + distortion * 0.5, pos.y);
    ctx.scale(1 + distortion * 0.01, 1);
    
    const ringGradient = ctx.createRadialGradient(
      0, 0, ringSize * 0.8,
      0, 0, ringSize
    );
    ringGradient.addColorStop(0, 'transparent');
    ringGradient.addColorStop(1, isCompleted ? `rgba(16, 185, 129, ${0.2 - ring * 0.03})` :
                                  isAvailable ? `rgba(138, 43, 226, ${0.3 - ring * 0.04})` :
                                  `rgba(107, 114, 128, ${0.15 - ring * 0.02})`);
    
    ctx.strokeStyle = ringGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
  ctx.restore();
  
  // Draw event horizon
  ctx.save();
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#8a2be2' :
                   '#4b5563';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.lineDashOffset = time * 5;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, halfSize * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  
  // Draw singularity core
  const coreGradient = ctx.createRadialGradient(
    pos.x, pos.y, 0,
    pos.x, pos.y, halfSize * 0.3
  );
  coreGradient.addColorStop(0, isCompleted ? '#10b981' :
                                isAvailable ? '#8a2be2' :
                                '#6b7280');
  coreGradient.addColorStop(0.5, isCompleted ? 'rgba(16, 185, 129, 0.5)' :
                                  isAvailable ? 'rgba(138, 43, 226, 0.5)' :
                                  'rgba(107, 114, 128, 0.3)');
  coreGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, halfSize * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw accretion particles
  ctx.save();
  ctx.globalAlpha = 0.6;
  
  for (let i = 0; i < 12; i++) {
    const angle = (time * 0.5 + i * Math.PI / 6) % (Math.PI * 2);
    const radius = halfSize * 0.5 + Math.sin(time * 3 + i) * halfSize * 0.2;
    const particleX = pos.x + Math.cos(angle) * radius;
    const particleY = pos.y + Math.sin(angle) * radius;
    
    ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.8)' :
                   isAvailable ? 'rgba(138, 43, 226, 0.8)' :
                   'rgba(107, 114, 128, 0.4)';
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  
  // Draw containment frame
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#8a2be2' :
                   '#4b5563';
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
*/

// ============================================================================
// FINAL BOSS DESIGN OPTION 3: QUANTUM CRYSTALLINE CORE
// ============================================================================
/*
} else if (node.storyNodeType === 'final_boss') {
  // DESIGN OPTION 3: Quantum Crystalline Core
  const halfSize = nodeSize;
  const time = Date.now() / 1000;
  
  // Draw dark crystalline base
  ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
  ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
  
  // Draw crystal facets
  ctx.save();
  ctx.translate(pos.x, pos.y);
  
  const facets = 8;
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2;
    const nextAngle = ((i + 1) / facets) * Math.PI * 2;
    
    // Draw facet
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * halfSize * 0.8, Math.sin(angle) * halfSize * 0.8);
    ctx.lineTo(Math.cos(nextAngle) * halfSize * 0.8, Math.sin(nextAngle) * halfSize * 0.8);
    ctx.closePath();
    
    const facetGradient = ctx.createLinearGradient(
      0, 0,
      Math.cos(angle + Math.PI / facets) * halfSize * 0.5,
      Math.sin(angle + Math.PI / facets) * halfSize * 0.5
    );
    
    const shimmer = Math.sin(time * 3 + i) * 0.2 + 0.3;
    facetGradient.addColorStop(0, isCompleted ? `rgba(16, 185, 129, ${shimmer})` :
                                  isAvailable ? `rgba(255, 215, 0, ${shimmer})` :
                                  `rgba(107, 114, 128, ${shimmer * 0.5})`);
    facetGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = facetGradient;
    ctx.fill();
    
    ctx.strokeStyle = isCompleted ? 'rgba(16, 185, 129, 0.5)' :
                     isAvailable ? 'rgba(255, 215, 0, 0.6)' :
                     'rgba(107, 114, 128, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
  
  // Draw quantum energy field
  ctx.save();
  ctx.globalAlpha = 0.3;
  
  const fieldSize = halfSize + Math.sin(time * 2) * 10;
  const fieldGradient = ctx.createRadialGradient(
    pos.x, pos.y, fieldSize * 0.5,
    pos.x, pos.y, fieldSize
  );
  fieldGradient.addColorStop(0, isCompleted ? 'rgba(16, 185, 129, 0.8)' :
                                isAvailable ? 'rgba(255, 215, 0, 0.8)' :
                                'rgba(107, 114, 128, 0.4)');
  fieldGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = fieldGradient;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, fieldSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw octagonal frame
  ctx.strokeStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#ffd700' :
                   '#4b5563';
  ctx.lineWidth = 3;
  
  ctx.save();
  if (isAvailable) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
  }
  
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
    const x = pos.x + Math.cos(angle) * halfSize * 0.95;
    const y = pos.y + Math.sin(angle) * halfSize * 0.95;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  
  // Draw power indicators
  const indicators = 4;
  for (let i = 0; i < indicators; i++) {
    const angle = (i / indicators) * Math.PI * 2 + Math.PI / 4;
    const indicatorX = pos.x + Math.cos(angle) * halfSize * 0.85;
    const indicatorY = pos.y + Math.sin(angle) * halfSize * 0.85;
    
    ctx.fillStyle = isCompleted ? '#10b981' :
                   isAvailable ? '#ffd700' :
                   '#6b7280';
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
*/