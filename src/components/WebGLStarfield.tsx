'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

  // Animation stage control
  animationStage: 'initial' | 'stars' | 'logo';
}

// Vertex shader for static background stars
const bgStarVertexShader = `
  attribute float size;
  attribute float twinkleOffset;
  attribute float twinkleSpeed;
  attribute float brightness;

  uniform float time;
  uniform float twinkleAmount;
  uniform float twinkleSpeedGlobal;

  varying float vOpacity;

  void main() {
    // Calculate twinkle (sin wave oscillation)
    float twinkle = sin(time * twinkleSpeedGlobal * twinkleSpeed + twinkleOffset);
    float twinkleEffect = twinkle * twinkleAmount;

    // Standard projection
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Calculate depth-based scaling (same as moving stars)
    float depth = abs(mvPosition.z);
    float depthScale = 1000.0 / max(depth, 100.0);

    // Apply depth scale and twinkle to size
    float finalSize = size * depthScale * (1.0 + twinkleEffect);

    // Apply twinkle to opacity
    vOpacity = brightness * (1.0 + twinkleEffect * 0.5);

    gl_PointSize = max(finalSize, 1.0);
  }
`;

// Fragment shader for background stars
const bgStarFragmentShader = `
  varying float vOpacity;

  void main() {
    // Draw circular star (not square)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft edge falloff
    float alpha = smoothstep(0.5, 0.3, dist) * vOpacity;

    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

// Vertex shader for moving stars with 3D depth projection
const movingStarVertexShader = `
  attribute float size;
  attribute float twinkleOffset;
  attribute float twinkleSpeed;

  uniform float time;
  uniform float twinkleAmount;
  uniform float twinkleSpeedGlobal;
  uniform float starScale;
  uniform vec2 resolution;
  uniform float fadePosition;
  uniform float fadeFeather;

  varying float vOpacity;
  varying vec2 vScreenPosition;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // 3D projection scaling (like Canvas: scale = 1000 / z)
    // Closer stars (higher z) appear larger - THIS IS THE KEY EFFECT
    float depth = abs(mvPosition.z);
    float depthScale = 1000.0 / max(depth, 100.0); // Prevent divide by zero

    // Calculate twinkle
    float twinkle = sin(time * twinkleSpeedGlobal * twinkleSpeed + twinkleOffset);
    float twinkleEffect = twinkle * twinkleAmount;

    // Apply depth scaling + twinkle + user scale
    float finalSize = size * depthScale * starScale * (1.0 + twinkleEffect);

    // Opacity based on depth (fade distant stars) and twinkle
    float maxDepth = 2000.0;
    float depthFade = clamp(1.0 - (depth / maxDepth), 0.0, 1.0);
    vOpacity = depthFade * (1.0 + twinkleEffect * 0.5);

    // Calculate screen position for edge fading
    vec4 screenPos = projectionMatrix * mvPosition;
    vScreenPosition = (screenPos.xy / screenPos.w) * 0.5 + 0.5;

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = max(finalSize, 1.0); // Minimum size of 1px
  }
`;

// Fragment shader for moving stars with edge fading
const movingStarFragmentShader = `
  uniform float fadePosition;
  uniform float fadeFeather;

  varying float vOpacity;
  varying vec2 vScreenPosition;

  void main() {
    // Draw circular star
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft edge falloff for star shape
    float shapeAlpha = smoothstep(0.5, 0.3, dist);

    // Calculate distance from screen center for edge fading
    vec2 centerDist = abs(vScreenPosition - 0.5) * 2.0;
    float edgeDist = max(centerDist.x, centerDist.y);

    // Apply edge fade
    float fadeStart = fadePosition / 100.0;
    float fadeEnd = fadeStart + (fadeFeather / 100.0);
    float edgeFade = 1.0 - smoothstep(fadeStart, fadeEnd, edgeDist);

    // Combine all alpha factors
    float finalAlpha = shapeAlpha * vOpacity * edgeFade;

    gl_FragColor = vec4(1.0, 1.0, 1.0, finalAlpha);
  }
`;

export default function WebGLStarfield(props: WebGLStarfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);

  // Particle system refs
  const bgStarsRef = useRef<THREE.Points | null>(null);
  const layer1StarsRef = useRef<THREE.Points | null>(null);
  const layer2StarsRef = useRef<THREE.Points | null>(null);
  const layer3StarsRef = useRef<THREE.LineSegments | null>(null);

  // Initialize THREE.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[⭐WEBGL] Initializing WebGL scene');

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      1, // Near clipping
      3000 // Far clipping
    );
    camera.position.z = 1000;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true, // Transparent background
      antialias: false, // Disable for performance
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer) {
        containerRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  // Create/update background stars
  useEffect(() => {
    if (!sceneRef.current || !props.enabled) return;

    const scene = sceneRef.current;
    const particleCount = props.bgStarCount;

    // Remove old system if exists
    if (bgStarsRef.current) {
      scene.remove(bgStarsRef.current);
      bgStarsRef.current.geometry.dispose();
      (bgStarsRef.current.material as THREE.Material).dispose();
    }

    if (particleCount === 0) return;

    // Generate particle data
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const twinkleOffsets = new Float32Array(particleCount);
    const twinkleSpeeds = new Float32Array(particleCount);
    const brightnesses = new Float32Array(particleCount);

    const sizeRandomness = props.bgStarSizeRandomness / 100;
    const speedRandomness = props.bgStarTwinkleSpeedRandomness / 100;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = -1500; // Fixed depth for background

      sizes[i] = 1.0 + Math.random() * sizeRandomness;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
      twinkleSpeeds[i] = 1.0 + (Math.random() * 2 - 1) * speedRandomness;

      const minBright = props.bgStarMinBrightness / 100;
      const maxBright = props.bgStarMaxBrightness / 100;
      brightnesses[i] = minBright + Math.random() * (maxBright - minBright);
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    geometry.setAttribute('brightness', new THREE.BufferAttribute(brightnesses, 1));

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        twinkleAmount: { value: props.bgStarTwinkleAmount / 100 },
        twinkleSpeedGlobal: { value: props.bgStarTwinkleSpeed },
      },
      vertexShader: bgStarVertexShader,
      fragmentShader: bgStarFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    bgStarsRef.current = points;

    console.log('[⭐WEBGL] Background stars created:', {
      count: particleCount,
      zPosition: -1500,
      pointsAdded: true
    });

  }, [
    props.enabled,
    props.bgStarCount,
    props.bgStarTwinkleAmount,
    props.bgStarTwinkleSpeed,
    props.bgStarTwinkleSpeedRandomness,
    props.bgStarSizeRandomness,
    props.bgStarMinBrightness,
    props.bgStarMaxBrightness,
  ]);

  // Create/update Layer 1 moving stars
  useEffect(() => {
    if (!sceneRef.current || !props.enabled) return;

    const scene = sceneRef.current;
    const particleCount = props.starFrequency;

    // Remove old system
    if (layer1StarsRef.current) {
      scene.remove(layer1StarsRef.current);
      layer1StarsRef.current.geometry.dispose();
      (layer1StarsRef.current.material as THREE.Material).dispose();
    }

    if (particleCount === 0) return;

    // Generate particle data
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const twinkleOffsets = new Float32Array(particleCount);
    const twinkleSpeeds = new Float32Array(particleCount);

    const sizeRandomness = props.sizeRandomness / 100;
    const speedRandomness = props.twinkleSpeedRandomness / 100;
    const maxZ = 2000;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = -Math.random() * maxZ;

      sizes[i] = 1.0 + Math.random() * sizeRandomness;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
      twinkleSpeeds[i] = 1.0 + (Math.random() * 2 - 1) * speedRandomness;
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        twinkleAmount: { value: props.twinkleAmount / 100 },
        twinkleSpeedGlobal: { value: props.twinkleSpeed },
        starScale: { value: props.starScale },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        fadePosition: { value: props.starFadePosition },
        fadeFeather: { value: props.starFadeFeatherSize },
      },
      vertexShader: movingStarVertexShader,
      fragmentShader: movingStarFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    layer1StarsRef.current = points;

  }, [
    props.enabled,
    props.starFrequency,
    props.starScale,
    props.twinkleAmount,
    props.twinkleSpeed,
    props.twinkleSpeedRandomness,
    props.sizeRandomness,
    props.starFadePosition,
    props.starFadeFeatherSize,
  ]);

  // Create/update Layer 2 moving stars
  useEffect(() => {
    if (!sceneRef.current || !props.enabled) return;

    const scene = sceneRef.current;
    const particleCount = props.starFrequency2;

    // Remove old system
    if (layer2StarsRef.current) {
      scene.remove(layer2StarsRef.current);
      layer2StarsRef.current.geometry.dispose();
      (layer2StarsRef.current.material as THREE.Material).dispose();
    }

    if (particleCount === 0) return;

    // Generate particle data
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const twinkleOffsets = new Float32Array(particleCount);
    const twinkleSpeeds = new Float32Array(particleCount);

    const sizeRandomness = props.sizeRandomness2 / 100;
    const speedRandomness = props.twinkleSpeedRandomness2 / 100;
    const maxZ = 2000;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = -Math.random() * maxZ;

      sizes[i] = 1.0 + Math.random() * sizeRandomness;
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
      twinkleSpeeds[i] = 1.0 + (Math.random() * 2 - 1) * speedRandomness;
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        twinkleAmount: { value: props.twinkleAmount2 / 100 },
        twinkleSpeedGlobal: { value: props.twinkleSpeed2 },
        starScale: { value: props.starScale2 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        fadePosition: { value: props.starFadePosition },
        fadeFeather: { value: props.starFadeFeatherSize },
      },
      vertexShader: movingStarVertexShader,
      fragmentShader: movingStarFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    layer2StarsRef.current = points;

  }, [
    props.enabled,
    props.starFrequency2,
    props.starScale2,
    props.twinkleAmount2,
    props.twinkleSpeed2,
    props.twinkleSpeedRandomness2,
    props.sizeRandomness2,
    props.starFadePosition,
    props.starFadeFeatherSize,
  ]);

  // Create/update Layer 3 streak stars (lines)
  useEffect(() => {
    if (!sceneRef.current || !props.enabled) return;

    const scene = sceneRef.current;
    const particleCount = props.starFrequency3;

    // Remove old system
    if (layer3StarsRef.current) {
      scene.remove(layer3StarsRef.current);
      layer3StarsRef.current.geometry.dispose();
      (layer3StarsRef.current.material as THREE.Material).dispose();
    }

    if (particleCount === 0) return;

    // Each streak needs 2 vertices (start and end of line)
    const positions = new Float32Array(particleCount * 2 * 3);
    const colors = new Float32Array(particleCount * 2 * 3);
    const lineLength = props.lineLength3;
    const maxZ = 2000;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 6; // 2 vertices × 3 coords

      // Random starting position
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = -Math.random() * maxZ;

      // Start of line (tail)
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      // End of line (head) - offset in z to create streak
      positions[idx + 3] = x;
      positions[idx + 4] = y;
      positions[idx + 5] = z + lineLength;

      // White color for both vertices
      colors[idx] = colors[idx + 3] = 1.0;     // R
      colors[idx + 1] = colors[idx + 4] = 1.0; // G
      colors[idx + 2] = colors[idx + 5] = 1.0; // B
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const streaks = new THREE.LineSegments(geometry, material);
    scene.add(streaks);
    layer3StarsRef.current = streaks;

  }, [
    props.enabled,
    props.starFrequency3,
    props.lineLength3,
  ]);

  // Animation loop
  useEffect(() => {
    if (!props.enabled || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
      console.log('[⭐WEBGL] Animation loop blocked:', {
        enabled: props.enabled,
        hasScene: !!sceneRef.current,
        hasCamera: !!cameraRef.current,
        hasRenderer: !!rendererRef.current
      });
      return;
    }

    console.log('[⭐WEBGL] Starting animation loop, stage:', props.animationStage);

    // Animate during ALL stages (will be hidden by opacity during 'initial')
    // Removed early return for 'initial' stage to ensure animation loop starts

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Update background stars twinkle
      if (bgStarsRef.current) {
        const material = bgStarsRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = currentTime * 0.001;
        material.uniforms.twinkleAmount.value = props.bgStarTwinkleAmount / 100;
        material.uniforms.twinkleSpeedGlobal.value = props.bgStarTwinkleSpeed;
      }

      // Update Layer 1 moving stars
      if (layer1StarsRef.current) {
        const geometry = layer1StarsRef.current.geometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const particleCount = props.starFrequency;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // Move star toward viewer
          positions[idx + 2] += props.starSpeed * deltaTime;

          // Reset if too close
          if (positions[idx + 2] > 100) {
            positions[idx] = (Math.random() - 0.5) * 2000;
            positions[idx + 1] = (Math.random() - 0.5) * 2000;
            positions[idx + 2] = -2000;
          }
        }

        geometry.attributes.position.needsUpdate = true;

        // Update shader uniforms
        const material = layer1StarsRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = currentTime * 0.001;
        material.uniforms.twinkleAmount.value = props.twinkleAmount / 100;
        material.uniforms.twinkleSpeedGlobal.value = props.twinkleSpeed;
        material.uniforms.starScale.value = props.starScale;
        material.uniforms.fadePosition.value = props.starFadePosition;
        material.uniforms.fadeFeather.value = props.starFadeFeatherSize;
      }

      // Update Layer 2 moving stars
      if (layer2StarsRef.current) {
        const geometry = layer2StarsRef.current.geometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const particleCount = props.starFrequency2;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // Move star toward viewer
          positions[idx + 2] += props.starSpeed2 * deltaTime;

          // Reset if too close
          if (positions[idx + 2] > 100) {
            positions[idx] = (Math.random() - 0.5) * 2000;
            positions[idx + 1] = (Math.random() - 0.5) * 2000;
            positions[idx + 2] = -2000;
          }
        }

        geometry.attributes.position.needsUpdate = true;

        // Update shader uniforms
        const material = layer2StarsRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = currentTime * 0.001;
        material.uniforms.twinkleAmount.value = props.twinkleAmount2 / 100;
        material.uniforms.twinkleSpeedGlobal.value = props.twinkleSpeed2;
        material.uniforms.starScale.value = props.starScale2;
        material.uniforms.fadePosition.value = props.starFadePosition;
        material.uniforms.fadeFeather.value = props.starFadeFeatherSize;
      }

      // Update Layer 3 streak stars
      if (layer3StarsRef.current) {
        const geometry = layer3StarsRef.current.geometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const particleCount = props.starFrequency3;
        const lineLength = props.lineLength3;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 6;

          // Move both vertices forward
          positions[idx + 2] += props.starSpeed3 * deltaTime;
          positions[idx + 5] += props.starSpeed3 * deltaTime;

          // Reset if past camera
          if (positions[idx + 5] > 100) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = -2000;

            positions[idx] = positions[idx + 3] = x;
            positions[idx + 1] = positions[idx + 4] = y;
            positions[idx + 2] = z;
            positions[idx + 5] = z + lineLength;
          }
        }

        geometry.attributes.position.needsUpdate = true;
      }

      // Render scene
      renderer.render(scene, camera);

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };

  }, [
    props.enabled,
    props.animationStage,
    props.starSpeed,
    props.starSpeed2,
    props.starSpeed3,
    props.starFrequency,
    props.starFrequency2,
    props.starFrequency3,
    props.lineLength3,
    props.starScale,
    props.starScale2,
    props.twinkleAmount,
    props.twinkleAmount2,
    props.twinkleSpeed,
    props.twinkleSpeed2,
    props.bgStarTwinkleAmount,
    props.bgStarTwinkleSpeed,
    props.starFadePosition,
    props.starFadeFeatherSize,
  ]);

  if (!props.enabled) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-[1] pointer-events-none"
      style={{
        opacity: props.animationStage === 'initial' ? 0 : 1,
        transition: 'opacity 1500ms ease-out',
      }}
    />
  );
}
