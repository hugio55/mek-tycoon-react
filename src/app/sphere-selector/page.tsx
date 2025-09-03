"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import BackgroundEffects from '@/components/BackgroundEffects';

type BiasProfile = 'low' | 'medium' | 'high';
type PatternType = 'camo' | 'solid' | 'organic' | 'lines';
type LightingType = 'standard' | 'neon' | 'dark';

const biasProfiles = {
  low: [28, 22, 18, 12, 8, 5, 3.5, 2, 1, 0.5],
  medium: [12, 12, 11, 11, 10, 10, 10, 9, 8, 7],
  high: [5, 6, 7, 8, 9, 11, 13, 14, 13, 14]
};

const zoneColorMapping = {
  low: [0x404040, 0x505050, 0x606060, 0x707070, 0x808080, 0x909090, 0xa0a000, 0xccaa00, 0xff9900, 0xff0000],
  medium: [0x404040, 0x505050, 0x606060, 0x808080, 0x909090, 0xa0a000, 0xb0b000, 0xccaa00, 0xff9900, 0xff6600],
  high: [0x303030, 0x404040, 0x505050, 0x707070, 0x909090, 0xb0b000, 0xccaa00, 0xffcc00, 0xff9900, 0xff6600]
};

export default function SphereSelectorPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [rarityBias, setRarityBias] = useState<BiasProfile>('medium');
  const [currentPattern, setCurrentPattern] = useState<PatternType>('camo');
  const [currentLighting, setCurrentLighting] = useState<LightingType>('standard');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPowerIndicator, setShowPowerIndicator] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [powerAngle, setPowerAngle] = useState(0);
  const [currentZone, setCurrentZone] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultZone, setResultZone] = useState<number>(1);
  const [hasSpun, setHasSpun] = useState(false);
  
  const velocityRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const spinStartTimeRef = useRef(0);
  
  // Create sphere material based on pattern and colors
  const createSphereMaterial = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;
    
    const colors = zoneColorMapping[rarityBias];
    const probabilities = biasProfiles[rarityBias];
    
    // Create weighted distribution
    const distribution: number[] = [];
    colors.forEach((color, index) => {
      const pixelCount = Math.round((probabilities[index] / 100) * 1000);
      for (let i = 0; i < pixelCount; i++) {
        distribution.push(color);
      }
    });
    
    // Shuffle
    distribution.sort(() => Math.random() - 0.5);
    
    if (currentPattern === 'camo') {
      // Digital camo pattern
      const cellSize = 32;
      let distIndex = 0;
      
      for (let y = 0; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
          const color = distribution[distIndex % distribution.length];
          distIndex++;
          
          const r = (color >> 16) & 255;
          const g = (color >> 8) & 255;
          const b = color & 255;
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    } else if (currentPattern === 'solid') {
      // Solid horizontal bands
      let y = 0;
      
      probabilities.forEach((prob, index) => {
        const height = (prob / 100) * canvas.height;
        const color = colors[index];
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, y, canvas.width, height);
        
        y += height;
      });
    } else if (currentPattern === 'organic') {
      // Voronoi-like pattern
      const points: { x: number; y: number; color: number }[] = [];
      
      colors.forEach((color, index) => {
        const numPoints = Math.max(1, Math.round(probabilities[index] / 3));
        for (let i = 0; i < numPoints; i++) {
          points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: color
          });
        }
      });
      
      // Fast Voronoi approximation
      for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
          let minDist = Infinity;
          let closestPoint = points[0];
          
          points.forEach(point => {
            const dist = Math.sqrt(
              Math.pow(x - point.x, 2) + 
              Math.pow(y - point.y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              closestPoint = point;
            }
          });
          
          const color = closestPoint.color;
          const r = (color >> 16) & 255;
          const g = (color >> 8) & 255;
          const b = color & 255;
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, 4, 4);
        }
      }
    } else {
      // Lines pattern
      const bgColor = colors[0];
      const bgR = (bgColor >> 16) & 255;
      const bgG = (bgColor >> 8) & 255;
      const bgB = bgColor & 255;
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      probabilities.forEach((prob, index) => {
        const lineCount = Math.max(1, Math.round(prob / 2));
        const color = colors[index];
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        for (let i = 0; i < lineCount; i++) {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.lineWidth = 8 + Math.random() * 16;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          const startX = Math.random() * canvas.width;
          const startY = Math.random() * canvas.height;
          const endX = startX + (Math.random() - 0.5) * 400;
          const endY = startY + (Math.random() - 0.5) * 400;
          
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const materialOptions: THREE.MeshPhongMaterialParameters = {
      map: texture,
      shininess: 80,
      specular: 0x222222
    };
    
    if (currentLighting === 'neon') {
      materialOptions.emissive = 0x111111;
      materialOptions.emissiveIntensity = 0.3;
    }
    
    return new THREE.MeshPhongMaterial(materialOptions);
  };
  
  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(600, 600);
    renderer.setPixelRatio(window.devicePixelRatio * 2);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create sphere
    const geometry = new THREE.IcosahedronGeometry(1.5, 6);
    const material = createSphereMaterial();
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;
    
    // Setup lighting
    const setupLighting = () => {
      // Clear existing lights
      scene.children = scene.children.filter(child => !(child instanceof THREE.Light));
      
      if (currentLighting === 'standard') {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        
        const point = new THREE.PointLight(0xffcc00, 1, 100);
        point.position.set(5, 5, 5);
        scene.add(point);
      } else if (currentLighting === 'neon') {
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambient);
        
        const point1 = new THREE.PointLight(0xff00ff, 2, 100);
        point1.position.set(5, 5, 5);
        scene.add(point1);
        
        const point2 = new THREE.PointLight(0x00ffff, 2, 100);
        point2.position.set(-5, -5, 5);
        scene.add(point2);
      } else if (currentLighting === 'dark') {
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambient);
        
        const point = new THREE.PointLight(0xffcc00, 0.5, 100);
        point.position.set(0, 0, 10);
        scene.add(point);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.3);
        directional.position.set(1, 1, 1);
        scene.add(directional);
      }
    };
    
    setupLighting();
    
    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (sphereRef.current) {
        if (isSpinning) {
          // Apply velocity
          sphereRef.current.rotation.x += velocityRef.current.x;
          sphereRef.current.rotation.y += velocityRef.current.y;
          
          // Apply friction
          const friction = 0.985;
          velocityRef.current.x *= friction;
          velocityRef.current.y *= friction;
          
          // Check if should stop
          const spinTime = Date.now() - spinStartTimeRef.current;
          const speedMagnitude = Math.abs(velocityRef.current.x) + Math.abs(velocityRef.current.y);
          
          if (spinTime > 15000 || speedMagnitude < 0.002) {
            velocityRef.current.x = 0;
            velocityRef.current.y = 0;
            setIsSpinning(false);
            setHasSpun(true);
            calculateFinalResult();
          }
        } else if (!isDragging && !hasSpun) {
          // Idle rotation
          sphereRef.current.rotation.x += 0.001;
          sphereRef.current.rotation.y += 0.002;
        }
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentLighting, isSpinning, isDragging, hasSpun]);
  
  // Update material when pattern or bias changes
  useEffect(() => {
    if (sphereRef.current) {
      sphereRef.current.material.dispose();
      sphereRef.current.material = createSphereMaterial();
    }
  }, [rarityBias, currentPattern, currentLighting]);
  
  // Calculate final result
  const calculateFinalResult = () => {
    const zone = Math.floor(Math.random() * 10) + 1; // Simplified for now
    setResultZone(zone);
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      setHasSpun(false);
    }, 4000);
  };
  
  // Handle drag events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpinning) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    dragCurrentRef.current = { ...dragStartRef.current };
    
    setIsDragging(true);
    setShowPowerIndicator(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragCurrentRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 250;
    const power = Math.min(distance / maxDistance, 1);
    const angle = Math.atan2(dy, dx);
    
    setPowerLevel(power);
    setPowerAngle(angle);
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setShowPowerIndicator(false);
    
    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
      const maxDistance = 250;
      const power = Math.min(distance / maxDistance, 1);
      const minPower = 0.35;
      const actualPower = minPower + (1 - minPower) * power;
      
      velocityRef.current = {
        x: -(dy / distance) * actualPower * 0.2,
        y: (dx / distance) * actualPower * 0.2
      };
      
      setIsSpinning(true);
      setHasSpun(false);
      spinStartTimeRef.current = Date.now();
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <BackgroundEffects />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Controls */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={() => {
              const biases: BiasProfile[] = ['low', 'medium', 'high'];
              const currentIndex = biases.indexOf(rarityBias);
              setRarityBias(biases[(currentIndex + 1) % 3]);
            }}
            className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-400 text-yellow-400 uppercase font-mono text-sm hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            RARITY: {rarityBias.toUpperCase()}
          </button>
        </div>
        
        {/* Canvas Container */}
        <div className="relative">
          <div 
            ref={mountRef}
            className="relative w-[600px] h-[600px] border-3 border-yellow-400 rounded-lg cursor-grab"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 204, 0, 0.05) 0%, transparent 70%)',
              boxShadow: '0 0 50px rgba(255, 204, 0, 0.3), inset 0 0 50px rgba(255, 204, 0, 0.1)'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none z-10">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400 transform -translate-y-1/2" style={{ boxShadow: '0 0 10px #ffcc00' }} />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400 transform -translate-x-1/2" style={{ boxShadow: '0 0 10px #ffcc00' }} />
            </div>
            
            {/* Crosshair Ring */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-yellow-400/30 rounded-full pointer-events-none z-10" />
            
            {/* Launch Text */}
            {!isSpinning && !hasSpun && (
              <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm uppercase tracking-widest opacity-80">
                DRAG SPHERE TO LAUNCH
              </div>
            )}
            
            {/* Power Indicator */}
            {showPowerIndicator && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                <svg width="500" height="500" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <circle cx="250" cy="250" r="140" fill="none" stroke="rgba(255,204,0,0.2)" strokeWidth="4"/>
                  <circle 
                    cx="250" 
                    cy="250" 
                    r="140" 
                    fill="none" 
                    stroke="#ffcc00" 
                    strokeWidth={6 + powerLevel * 6}
                    strokeDasharray={`${powerLevel * 880} 880`}
                    strokeLinecap="round"
                    style={{
                      transform: `rotate(${powerAngle * 180 / Math.PI - 90}deg)`,
                      transformOrigin: 'center'
                    }}
                  />
                </svg>
                <div 
                  className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                  style={{
                    boxShadow: '0 0 20px #ffcc00',
                    transform: `translate(${Math.cos(powerAngle) * 140}px, ${Math.sin(powerAngle) * 140}px)`,
                    width: `${8 + powerLevel * 16}px`,
                    height: `${8 + powerLevel * 16}px`,
                    marginLeft: `${-(4 + powerLevel * 8)}px`,
                    marginTop: `${-(4 + powerLevel * 8)}px`
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Probability Matrix */}
        <div className="mt-6 flex gap-4 bg-black/90 border-2 border-yellow-400 p-4 rounded">
          <div className="text-yellow-400 text-sm uppercase tracking-widest mr-4">ZONES</div>
          <div className="flex gap-2">
            {biasProfiles[rarityBias].map((prob, index) => {
              const color = zoneColorMapping[rarityBias][index];
              const hex = '#' + color.toString(16).padStart(6, '0');
              const isActive = currentZone === index + 1;
              
              return (
                <div key={index} className={`flex flex-col items-center p-2 rounded transition-all ${isActive ? 'scale-110' : ''}`}>
                  <div 
                    className={`w-9 h-9 border rounded mb-1 transition-all ${isActive ? 'border-2' : 'border'}`}
                    style={{
                      backgroundColor: hex,
                      borderColor: isActive ? hex : '#333',
                      boxShadow: isActive ? `0 0 15px ${hex}, 0 0 25px ${hex}` : 'none'
                    }}
                  />
                  <div className={`text-xs ${isActive ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
                    {prob}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Result Display */}
        {showResult && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/95 border-3 border-yellow-400 p-8 rounded z-50 animate-pulse">
            <div className="text-2xl text-yellow-400 mb-4">GLYPH FORGED!</div>
            <div className="text-5xl font-bold text-yellow-400 mb-2" style={{ textShadow: '0 0 30px #ffcc00' }}>
              {resultZone}
            </div>
            <div className="text-gray-400">
              {resultZone <= 7 ? '1 Buff' : resultZone === 8 ? '2 Buffs' : '3 Buffs'}
            </div>
          </div>
        )}
        
        {/* Pattern Toggle */}
        <div className="absolute top-20 right-20 bg-black/90 border-2 border-yellow-400 p-4 rounded">
          <div className="text-yellow-400 text-xs mb-2">ZONE PATTERN</div>
          {(['camo', 'solid', 'organic', 'lines'] as PatternType[]).map(pattern => (
            <button
              key={pattern}
              onClick={() => setCurrentPattern(pattern)}
              className={`block w-32 px-2 py-1 mb-1 text-xs uppercase transition-all ${
                currentPattern === pattern 
                  ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400' 
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {pattern === 'camo' ? 'DIGITAL CAMO' : pattern.toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* Lighting Toggle */}
        <div className="absolute bottom-20 left-20 bg-black/90 border-2 border-yellow-400 p-4 rounded">
          <div className="text-yellow-400 text-xs mb-2">LIGHTING</div>
          {(['standard', 'neon', 'dark'] as LightingType[]).map(lighting => (
            <button
              key={lighting}
              onClick={() => setCurrentLighting(lighting)}
              className={`block w-28 px-2 py-1 mb-1 text-xs uppercase transition-all ${
                currentLighting === lighting 
                  ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-400' 
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {lighting === 'neon' ? 'NEON GLOW' : lighting === 'dark' ? 'DARK MODE' : lighting.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}