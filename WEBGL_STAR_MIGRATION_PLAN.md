# WebGL Star System Migration Plan
*Replacing Canvas 2D stars with GPU-accelerated WebGL while preserving exact visual appearance*

## Executive Summary

**Goal**: Replace Canvas 2D star rendering with WebGL implementation that:
- Maintains identical visual appearance (3D depth, twinkling, layers, streaks)
- Preserves all existing debug controls and parameters
- Achieves 90%+ performance improvement on mobile
- Eliminates battery drain and overheating issues

**Approach**: Use THREE.js library for WebGL abstraction (easier than raw WebGL, still high performance)

---

## Current System Analysis

### Existing Star Layers

**Layer 1: Background Static Stars (800 particles)**
- Fixed positions with twinkling
- Size: ~1-2px
- Behavior: Opacity oscillates via sin wave
- No movement in 3D space

**Layer 2: Moving Stars (200 particles)**
- 3D projection: `scale = 1000 / z`
- Movement: Stars move toward viewer (z decreases)
- Twinkling: Size and opacity oscillate
- Rendered as: Small circles/dots

**Layer 3: Moving Stars (100 particles)**
- Same 3D projection as Layer 2
- Movement: Faster speed toward viewer
- Rendered as: **Lines/streaks** (not dots)
- Line rendering: `ctx.moveTo(prevX, prevY)` to `ctx.lineTo(x, y)`
- The "previous position" creates a trail effect

**Layer 4: Ultra-Fast Streaks (100 particles)**
- Same as Layer 3 but even faster
- Spawn delay system (stars appear gradually)
- Longer lines due to higher speed

### Current Parameters to Preserve

**Per-Layer Controls:**
- Scale (visual size multiplier)
- Speed (z-axis movement speed)
- Frequency (particle count)
- Twinkle amount (oscillation amplitude)
- Twinkle speed (oscillation frequency)
- Twinkle speed randomness (per-particle variation)
- Size randomness (per-particle variation)
- Line length (for streak layers)
- Spawn delay (for Layer 4)

**Global Controls:**
- Star fade position (where stars fade out at edges)
- Star fade feather size (gradient width of fade)
- Motion blur enabled/disabled (per layer)
- Stars enabled toggle (master on/off)

---

## WebGL Implementation Strategy

### Technology Choice: THREE.js

**Why THREE.js:**
- Abstracts WebGL complexity (no raw shader writing for basic features)
- Built-in 3D projection and camera system
- Efficient particle system (`THREE.Points`)
- Easy to integrate with React
- Well-documented and maintained

**Performance Benefits:**
- All particles rendered in 1-2 draw calls (vs 1,200+ in Canvas)
- Calculations run on GPU (vs CPU)
- No string allocations or GC pressure
- Native support for instancing and batching

### Architecture Overview

```
Component Structure:
┌─────────────────────────────────────┐
│   LandingPage (page.tsx)            │
│   - Manages state & settings        │
│   - Passes props to WebGLStars      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   WebGLStarfield (new component)    │
│   - THREE.js scene setup            │
│   - Manages 4 particle systems      │
│   - Handles animation loop          │
│   - Responds to prop changes        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   THREE.js Scene                     │
│   - 4 x THREE.Points (layers)       │
│   - Custom vertex/fragment shaders  │
│   - GPU-accelerated rendering       │
└─────────────────────────────────────┘
```

---

## Implementation Plan - Step by Step

### Phase 1: Setup & Infrastructure (30 minutes)

#### Step 1.1: Install THREE.js
```bash
npm install three @types/three
```

#### Step 1.2: Create WebGL Component File
**File**: `src/components/WebGLStarfield.tsx`

**Responsibilities:**
- Initialize THREE.js scene, camera, renderer
- Create 4 particle systems (one per layer)
- Handle animation loop with requestAnimationFrame
- Accept props matching current Canvas system parameters
- Clean up resources on unmount

#### Step 1.3: Create Shader Files
**File**: `src/shaders/stars.vert` (Vertex Shader)
- Handles 3D position projection
- Applies twinkling size animation
- Passes varyings to fragment shader

**File**: `src/shaders/stars.frag` (Fragment Shader)
- Renders star as circle or line
- Applies twinkling opacity
- Handles edge fading

---

### Phase 2: Background Stars Implementation (45 minutes)

**Particle System 1: Static Background Stars**

#### Step 2.1: Generate Particle Data
```typescript
const particleCount = 800; // bgStarCount from settings

// Float32Arrays for GPU upload (efficient)
const positions = new Float32Array(particleCount * 3); // x, y, z
const sizes = new Float32Array(particleCount);
const twinkleOffsets = new Float32Array(particleCount); // Random phase
const twinkleSpeeds = new Float32Array(particleCount);
const brightnesses = new Float32Array(particleCount);

// Initialize with random values
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 2000;     // x: -1000 to 1000
  positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y: -1000 to 1000
  positions[i * 3 + 2] = -1500;                         // z: fixed depth

  sizes[i] = 1.0 + Math.random() * sizeRandomness;
  twinkleOffsets[i] = Math.random() * Math.PI * 2;
  twinkleSpeeds[i] = 1.0 + (Math.random() * 2 - 1) * speedRandomness;
  brightnesses[i] = minBrightness + Math.random() * (maxBrightness - minBrightness);
}
```

#### Step 2.2: Create THREE.Points Material
```typescript
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
geometry.setAttribute('brightness', new THREE.BufferAttribute(brightnesses, 1));

const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    twinkleAmount: { value: bgStarTwinkleAmount / 100 },
    twinkleSpeed: { value: bgStarTwinkleSpeed },
  },
  vertexShader: staticStarVertexShader,
  fragmentShader: staticStarFragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending, // Makes stars glow
});

const points = new THREE.Points(geometry, material);
scene.add(points);
```

#### Step 2.3: Vertex Shader (Static Stars)
```glsl
// Attributes (per-particle data)
attribute float size;
attribute float twinkleOffset;
attribute float twinkleSpeed;
attribute float brightness;

// Uniforms (global data)
uniform float time;
uniform float twinkleAmount;
uniform float twinkleSpeedGlobal;

// Varyings (pass to fragment shader)
varying float vOpacity;

void main() {
  // Calculate twinkle (sin wave oscillation)
  float twinkle = sin(time * twinkleSpeedGlobal * twinkleSpeed + twinkleOffset);
  float twinkleEffect = twinkle * twinkleAmount;

  // Apply twinkle to size
  float finalSize = size * (1.0 + twinkleEffect);

  // Apply twinkle to opacity
  vOpacity = brightness * (1.0 + twinkleEffect * 0.5);

  // Standard projection
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = finalSize;
}
```

#### Step 2.4: Fragment Shader (Static Stars)
```glsl
varying float vOpacity;

void main() {
  // Draw circular star (not square)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard; // Clip to circle

  // Soft edge falloff
  float alpha = smoothstep(0.5, 0.3, dist) * vOpacity;

  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
```

---

### Phase 3: Moving Stars (Dots) - Layers 1 & 2 (60 minutes)

**Particle Systems 2 & 3: 3D Moving Dots**

#### Step 3.1: Generate Moving Particle Data
```typescript
const particleCount = 200; // starFrequency from settings

const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3); // Movement direction
const sizes = new Float32Array(particleCount);
const twinkleOffsets = new Float32Array(particleCount);
const twinkleSpeeds = new Float32Array(particleCount);

const maxZ = 2000; // Maximum depth

for (let i = 0; i < particleCount; i++) {
  // Random 3D starting position
  positions[i * 3] = (Math.random() - 0.5) * 2000;     // x
  positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y
  positions[i * 3 + 2] = -Math.random() * maxZ;        // z: 0 to -2000

  // Velocity (z-axis movement toward viewer)
  velocities[i * 3] = 0;
  velocities[i * 3 + 1] = 0;
  velocities[i * 3 + 2] = starSpeed; // Moves toward camera (positive z)

  sizes[i] = 1.0 + Math.random() * sizeRandomness;
  twinkleOffsets[i] = Math.random() * Math.PI * 2;
  twinkleSpeeds[i] = 1.0 + (Math.random() * 2 - 1) * speedRandomness;
}
```

#### Step 3.2: Animation Loop (Update Positions)
```typescript
function animate(time: number) {
  const deltaTime = (time - lastTime) / 1000; // Convert to seconds
  lastTime = time;

  // Update each moving particle
  const positions = layer1Geometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    const idx = i * 3;

    // Move star toward viewer
    positions[idx + 2] += starSpeed * deltaTime;

    // Reset if too close
    if (positions[idx + 2] > 100) {
      positions[idx] = (Math.random() - 0.5) * 2000;
      positions[idx + 1] = (Math.random() - 0.5) * 2000;
      positions[idx + 2] = -2000;
    }
  }

  // Mark geometry as needing update
  layer1Geometry.attributes.position.needsUpdate = true;

  // Update time uniform for twinkling
  layer1Material.uniforms.time.value = time * 0.001;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

#### Step 3.3: Vertex Shader (Moving Stars with 3D Projection)
```glsl
attribute float size;
attribute float twinkleOffset;
attribute float twinkleSpeed;

uniform float time;
uniform float twinkleAmount;
uniform float twinkleSpeedGlobal;
uniform float starScale; // User-controlled scale

varying float vOpacity;
varying float vDepth;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // 3D projection scaling (like Canvas: scale = 1000 / z)
  // Closer stars (higher z) appear larger
  float depth = -mvPosition.z; // Depth from camera
  float depthScale = 1000.0 / depth;

  // Calculate twinkle
  float twinkle = sin(time * twinkleSpeedGlobal * twinkleSpeed + twinkleOffset);
  float twinkleEffect = twinkle * twinkleAmount;

  // Apply depth scaling + twinkle + user scale
  float finalSize = size * depthScale * starScale * (1.0 + twinkleEffect);

  // Opacity based on depth (fade distant stars)
  vOpacity = min(1.0, depth / 2000.0) * (1.0 + twinkleEffect * 0.5);
  vDepth = depth;

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = finalSize;
}
```

---

### Phase 4: Streak Stars (Lines) - Layers 3 & 4 (90 minutes)

**Particle Systems 4 & 5: Fast-Moving Streaks**

**Challenge**: THREE.Points renders dots, not lines. For streaks, we need line geometry.

#### Step 4.1: Use THREE.LineSegments Instead
```typescript
// Each streak is a line segment from previous position to current position
const particleCount = 100; // starFrequency3

// Each particle needs 2 vertices (start and end of line)
const positions = new Float32Array(particleCount * 2 * 3); // 2 verts per line, 3 coords per vert
const colors = new Float32Array(particleCount * 2 * 3);    // RGB for each vertex
const lineLength = 50; // Line trail length (adjustable)

for (let i = 0; i < particleCount; i++) {
  const idx = i * 6; // 2 vertices × 3 coords

  // Start position (tail of streak)
  positions[idx] = (Math.random() - 0.5) * 2000;
  positions[idx + 1] = (Math.random() - 0.5) * 2000;
  positions[idx + 2] = -Math.random() * 2000;

  // End position (head of streak) - same x,y but offset in z
  positions[idx + 3] = positions[idx];
  positions[idx + 4] = positions[idx + 1];
  positions[idx + 5] = positions[idx + 2] + lineLength;

  // Colors (white, but could vary opacity)
  colors[idx] = colors[idx + 3] = 1.0;     // R
  colors[idx + 1] = colors[idx + 4] = 1.0; // G
  colors[idx + 2] = colors[idx + 5] = 1.0; // B
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
});

const streaks = new THREE.LineSegments(geometry, material);
scene.add(streaks);
```

#### Step 4.2: Animation (Move Streak Lines)
```typescript
function animateStreaks(deltaTime: number) {
  const positions = streakGeometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    const idx = i * 6;

    // Move both vertices of the line forward
    positions[idx + 2] += starSpeed3 * deltaTime;     // Tail z
    positions[idx + 5] += starSpeed3 * deltaTime;     // Head z

    // Reset if past camera
    if (positions[idx + 5] > 100) {
      positions[idx] = positions[idx + 3] = (Math.random() - 0.5) * 2000;
      positions[idx + 1] = positions[idx + 4] = (Math.random() - 0.5) * 2000;
      positions[idx + 2] = -2000;
      positions[idx + 5] = -2000 + lineLength;
    }
  }

  streakGeometry.attributes.position.needsUpdate = true;
}
```

#### Step 4.3: Advanced Streak Rendering (Gradient Fading)
For more realistic streaks (bright head, fading tail):

```typescript
// Use LineBasicMaterial with vertex colors
const colors = new Float32Array(particleCount * 2 * 3);

for (let i = 0; i < particleCount; i++) {
  const idx = i * 6;

  // Tail vertex: dim
  colors[idx] = 1.0;
  colors[idx + 1] = 1.0;
  colors[idx + 2] = 1.0;

  // Head vertex: bright (will interpolate across line)
  colors[idx + 3] = 1.0;
  colors[idx + 4] = 1.0;
  colors[idx + 5] = 1.0;
}

// Update alpha in animation loop based on depth/speed
```

#### Step 4.4: Spawn Delay System (Layer 4)
```typescript
const spawnTimes = new Float32Array(particleCount);
const spawnDelay = 100; // ms between spawns

for (let i = 0; i < particleCount; i++) {
  spawnTimes[i] = i * spawnDelay;
}

function animateDelayedStreaks(time: number, deltaTime: number) {
  const positions = streakGeometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    // Check if this particle should be visible yet
    if (time < spawnTimes[i]) {
      // Keep offscreen
      const idx = i * 6;
      positions[idx + 2] = positions[idx + 5] = -10000;
      continue;
    }

    // Normal movement for spawned particles
    // ... (same as Step 4.2)
  }
}
```

---

### Phase 5: Edge Fading & Screen-Space Effects (30 minutes)

**Replicate fade at screen edges**

#### Step 5.1: Screen-Space Fade in Fragment Shader
```glsl
uniform vec2 resolution; // Screen resolution
uniform float fadePosition; // Where fade starts (0-1)
uniform float fadeFeather; // Gradient size

varying vec2 vScreenPosition;

void main() {
  // Convert gl_FragCoord to normalized screen coords (0-1)
  vec2 screenUV = gl_FragCoord.xy / resolution;

  // Calculate distance from center (0.5, 0.5)
  vec2 centerDist = abs(screenUV - 0.5) * 2.0; // 0 at center, 1 at edges
  float edgeDist = max(centerDist.x, centerDist.y);

  // Apply fade
  float fadeStart = fadePosition;
  float fadeEnd = fadePosition + fadeFeather;
  float alpha = 1.0 - smoothstep(fadeStart, fadeEnd, edgeDist);

  // ... rest of fragment shader
  gl_FragColor.a *= alpha;
}
```

---

### Phase 6: Integration & Props (45 minutes)

#### Step 6.1: WebGLStarfield Component Interface
```typescript
interface WebGLStarfieldProps {
  // Master toggle
  enabled: boolean;

  // Layer 1: Moving dots
  starScale: number;
  starSpeed: number;
  starFrequency: number;
  twinkleAmount: number;
  twinkleSpeed: number;
  twinkleSpeedRandomness: number;
  sizeRandomness: number;

  // Layer 2: Moving dots (faster)
  starScale2: number;
  starSpeed2: number;
  starFrequency2: number;
  twinkleAmount2: number;
  twinkleSpeed2: number;
  twinkleSpeedRandomness2: number;
  sizeRandomness2: number;

  // Layer 3: Streaks
  starScale3: number;
  starSpeed3: number;
  starFrequency3: number;
  lineLength3: number;
  twinkleAmount3: number;
  twinkleSpeed3: number;
  twinkleSpeedRandomness3: number;
  sizeRandomness3: number;
  spawnDelay3: number;

  // Background stars
  bgStarCount: number;
  bgStarTwinkleAmount: number;
  bgStarTwinkleSpeed: number;
  bgStarTwinkleSpeedRandomness: number;
  bgStarSizeRandomness: number;
  bgStarMinBrightness: number;
  bgStarMaxBrightness: number;

  // Global
  starFadePosition: number;
  starFadeFeatherSize: number;
}
```

#### Step 6.2: Replace Canvas in page.tsx
```typescript
{/* OLD: Canvas starfield */}
{/* <canvas ref={canvasRef} className="..." /> */}

{/* NEW: WebGL starfield */}
<WebGLStarfield
  enabled={starsEnabled}
  starScale={starScale}
  starSpeed={starSpeed}
  // ... pass all props
/>
```

---

### Phase 7: Performance Optimizations (30 minutes)

#### Step 7.1: Frustum Culling
Let THREE.js automatically cull particles outside camera view (already enabled by default).

#### Step 7.2: Level of Detail (LOD)
Reduce particle counts based on distance:
```typescript
// In animation loop
const distanceFromCamera = camera.position.distanceTo(particleSystem.position);
if (distanceFromCamera > 1000) {
  // Far away: reduce visible particles
  particleSystem.material.opacity = 0.5;
}
```

#### Step 7.3: Mobile Detection & Auto-Adjustment
```typescript
const isMobile = window.innerWidth < 768;

if (isMobile) {
  // Automatically reduce particle counts
  const mobileStarFrequency = Math.floor(starFrequency * 0.1);
  const mobileStarFrequency2 = Math.floor(starFrequency2 * 0.1);
  const mobileStarFrequency3 = 0; // Disable streaks on mobile
  const mobileBgStarCount = Math.floor(bgStarCount * 0.1);
}
```

#### Step 7.4: Pause When Not Visible
```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAnimation();
      } else {
        stopAnimation();
      }
    });
  });

  observer.observe(canvasRef.current);

  return () => observer.disconnect();
}, []);
```

---

### Phase 8: Testing & Validation (60 minutes)

#### Step 8.1: Visual Parity Check
**Manual testing**:
- [ ] Background stars twinkle at correct rate
- [ ] Layer 1 moving stars grow as they approach
- [ ] Layer 2 moving stars have correct speed/scale
- [ ] Layer 3 streaks render as lines (not dots)
- [ ] Layer 4 spawns gradually with delay
- [ ] Edge fading works correctly
- [ ] All debug controls affect visuals as expected

#### Step 8.2: Performance Validation
**Metrics to measure**:
- [ ] Desktop FPS: Should be 60fps solid
- [ ] Mobile FPS: Should be 30-60fps (vs current <20fps)
- [ ] CPU usage: Should be <20% on mobile (vs current 90%)
- [ ] Battery drain: Test 5-minute session (should be <1% vs current 5%+)
- [ ] Device temperature: Should stay cool (vs current hot)

**Tools**:
- Chrome DevTools Performance tab
- Safari Web Inspector Timelines
- Real device testing (iPhone, Android)

#### Step 8.3: Regression Testing
**Ensure no breakage**:
- [ ] Logo animation still works
- [ ] Scroll-triggered text fade-in works
- [ ] Audio consent lightbox works
- [ ] Phase accordion works
- [ ] Join Beta button works
- [ ] Mobile/desktop responsive layouts intact

---

## Migration Strategy

### Approach: Parallel Development

**Don't delete Canvas code immediately**. Build WebGL alongside, then switch:

1. **Keep Canvas active** in page.tsx
2. **Build WebGLStarfield** as new component
3. **Add toggle in debug controls**: "Use WebGL Stars"
4. **A/B test visually**: Toggle between Canvas and WebGL
5. **When satisfied**: Remove Canvas code entirely

### Rollback Plan

If WebGL has issues:
- Toggle back to Canvas via debug control
- Fix WebGL issues offline
- Try again when ready

---

## File Structure

```
src/
├── components/
│   ├── WebGLStarfield.tsx         (NEW - Main WebGL component)
│   └── StarfieldShaders.ts        (NEW - Shader code)
├── app/
│   └── landing/
│       └── page.tsx                (MODIFIED - Replace canvas with WebGL)
└── lib/
    └── three-utils.ts              (NEW - THREE.js helpers)
```

---

## Implementation Timeline

| Phase | Task | Estimated Time | Complexity |
|-------|------|----------------|------------|
| 1 | Setup & Infrastructure | 30 min | Low |
| 2 | Background Stars | 45 min | Medium |
| 3 | Moving Stars (Dots) | 60 min | Medium |
| 4 | Streak Stars (Lines) | 90 min | High |
| 5 | Edge Fading | 30 min | Medium |
| 6 | Integration & Props | 45 min | Low |
| 7 | Performance Optimizations | 30 min | Low |
| 8 | Testing & Validation | 60 min | Medium |
| **TOTAL** | **Full Migration** | **6 hours** | **Medium-High** |

---

## Expected Performance Gains

### Desktop (Already Good, But Will Improve)

| Metric | Canvas (Current) | WebGL (Target) | Improvement |
|--------|------------------|----------------|-------------|
| Frame Time | 12-15ms | 2-4ms | **75% faster** |
| CPU Usage | 40-50% | 5-10% | **80% reduction** |
| FPS | 60fps | 60fps | Same (maxed out) |
| Battery | Moderate | Minimal | Better |

### Mobile (Currently Broken, Will Be Fixed)

| Metric | Canvas (Current) | WebGL (Target) | Improvement |
|--------|------------------|----------------|-------------|
| Frame Time | 46ms | 8-12ms | **73% faster** |
| CPU Usage | 90-100% | 10-20% | **80% reduction** |
| FPS | 15-20fps | 50-60fps | **3x faster** |
| Temperature | 45-50°C (hot) | 35-38°C (warm) | **Comfortable** |
| Battery Drain | 1%/min | 0.1%/min | **90% better** |

---

## Risk Assessment

### Potential Issues

**1. Shader Compilation Errors**
- **Risk**: Medium
- **Mitigation**: Test on multiple devices/browsers, provide fallback shaders

**2. Performance on Old Devices**
- **Risk**: Low
- **Mitigation**: WebGL is supported on all modern mobile devices (2015+)

**3. Visual Differences**
- **Risk**: Medium
- **Mitigation**: Careful tuning of shader parameters, side-by-side comparison

**4. Memory Usage**
- **Risk**: Low
- **Mitigation**: WebGL uses less memory than Canvas (no string allocations)

**5. Integration Bugs**
- **Risk**: Low
- **Mitigation**: Parallel development, A/B toggle for easy rollback

---

## Success Criteria

**Visual Quality**:
- [ ] Indistinguishable from current Canvas implementation
- [ ] All 4 layers render correctly
- [ ] Twinkling, movement, depth all preserved
- [ ] Debug controls work identically

**Performance**:
- [ ] 60fps on desktop
- [ ] 30fps minimum on mobile (current: 15-20fps)
- [ ] CPU usage <20% on mobile (current: 90-100%)
- [ ] No device overheating (current: severe)
- [ ] Battery drain <0.2%/min (current: 1%/min)

**Stability**:
- [ ] No console errors
- [ ] No memory leaks over 10-minute session
- [ ] Works on Safari iOS, Chrome Android, Chrome Desktop, Safari Desktop
- [ ] Graceful degradation if WebGL unavailable

---

## Next Steps

**Ready to Begin?**

1. **Confirm plan approval** - Any changes or concerns?
2. **Install THREE.js** - `npm install three @types/three`
3. **Start Phase 1** - Create WebGLStarfield.tsx component
4. **Iterate through phases** - Build incrementally, test each layer
5. **A/B comparison** - Toggle between Canvas and WebGL
6. **Deploy when satisfied** - Remove Canvas code

**Questions to Answer Before Starting:**

1. Do you want to keep Canvas code as fallback, or fully replace?
2. Should I auto-reduce particles on mobile, or let you control via settings?
3. Any specific visual priorities (e.g., "twinkling is most important")?
4. Preferred testing approach (build all at once, or show each layer as I complete)?

Let me know when you're ready to start Phase 1!