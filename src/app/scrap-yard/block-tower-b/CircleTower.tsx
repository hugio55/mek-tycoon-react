"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CircleBlock {
  mesh: THREE.Mesh;
  radius: number;
  direction: number;
  speed: number;
  position: { x: number; y: number; z: number };
  pendulumAngle: number;
  pendulumRotation: number;
}

export default function CircleTower() {
  // Add CSS for HUD effects
  if (typeof document !== 'undefined' && !document.getElementById('circle-tower-styles')) {
    const style = document.createElement('style');
    style.id = 'circle-tower-styles';
    style.innerHTML = `
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      .hud-grid {
        position: absolute;
        inset: 0;
        background-image: 
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 204, 0, 0.03) 2px, rgba(255, 204, 0, 0.03) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 204, 0, 0.03) 2px, rgba(255, 204, 0, 0.03) 4px);
        pointer-events: none;
      }
      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      .crt-scanline {
        position: absolute;
        width: 100%;
        height: 2px;
        background: linear-gradient(transparent, rgba(255, 255, 0, 0.1), transparent);
        animation: scanline 8s linear infinite;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [precision, setPrecision] = useState(100);
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | null;
    blocks: CircleBlock[];
    animationId: number | null;
    isInitialized: boolean;
    currentState: 'ready' | 'playing' | 'over';
  }>({
    renderer: null,
    scene: null,
    camera: null,
    blocks: [],
    animationId: null,
    isInitialized: false,
    currentState: 'ready'
  });

  const gameActionsRef = useRef<{
    startGame: () => void;
    placeBlock: () => void;
    restartGame: () => void;
  }>({
    startGame: () => {},
    placeBlock: () => {},
    restartGame: () => {}
  });

  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current.isInitialized) return;
    gameRef.current.isInitialized = true;

    console.log("Initializing Circle Tower...");

    // Setup renderer with HUD styling
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000800, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    gameRef.current.renderer = renderer;

    // Setup scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000800, 10, 100);
    gameRef.current.scene = scene;

    // Setup camera - orthographic for consistent view
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = 30;
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 10, 0);
    gameRef.current.camera = camera;

    // HUD-style lighting
    const ambientLight = new THREE.AmbientLight(0xffcc00, 0.3);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffff88, 0.7);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Green accent light
    const accentLight = new THREE.DirectionalLight(0x88ff00, 0.2);
    accentLight.position.set(-10, 15, -5);
    scene.add(accentLight);

    // Add grid floor
    const gridHelper = new THREE.GridHelper(40, 20, 0x444400, 0x222200);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Helper functions
    const addBaseBlock = () => {
      const geometry = new THREE.CylinderGeometry(5, 5, 2, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffcc00,
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 1, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);
      
      const baseBlock: CircleBlock = {
        mesh,
        radius: 5,
        direction: 0,
        speed: 0,
        position: { x: 0, y: 1, z: 0 },
        pendulumAngle: 0,
        pendulumRotation: 0
      };
      
      gameRef.current.blocks.push(baseBlock);
    };

    const addBlock = () => {
      if (gameRef.current.blocks.length === 0) return;
      
      const lastBlock = gameRef.current.blocks[gameRef.current.blocks.length - 1];
      const newIndex = gameRef.current.blocks.length;
      
      // Create new circular block
      const geometry = new THREE.CylinderGeometry(lastBlock.radius, lastBlock.radius, 2, 32);
      
      // Industrial yellow-green gradient
      const intensity = 0.5 + (newIndex * 0.02);
      const color = new THREE.Color(0xccff00).multiplyScalar(intensity);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffaa00,
        emissive: color,
        emissiveIntensity: 0.2 + (newIndex * 0.01),
        metalness: 0.6,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position
      const position = {
        x: lastBlock.position.x,
        y: lastBlock.position.y + 2,
        z: lastBlock.position.z
      };
      
      // Start from edge with flower/pendulum pattern
      // Initial pendulum rotation angle (changes which direction the pendulum swings)
      const pendulumRotation = (newIndex * 0.8) % (Math.PI * 2);
      
      // Start at maximum pendulum swing
      position.x = Math.cos(pendulumRotation) * 15;
      position.z = Math.sin(pendulumRotation) * 15;
      
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);
      
      const newBlock: CircleBlock = {
        mesh,
        radius: lastBlock.radius,
        direction: 0.3,
        speed: 0.3,
        position,
        pendulumAngle: -Math.PI / 2, // Start at edge of swing
        pendulumRotation: pendulumRotation
      };
      
      gameRef.current.blocks.push(newBlock);
      
      // Move camera up after a few blocks
      if (camera && newIndex > 5) {
        const targetY = 30 + (newIndex - 5) * 2;
        camera.position.y = targetY;
        camera.lookAt(0, targetY - 20, 0);
      }
    };

    // Define game actions
    gameActionsRef.current.startGame = () => {
      console.log("Starting circle tower game...");
      setScore(0);
      setPrecision(100);
      
      // Clear existing blocks except the base
      if (gameRef.current.blocks.length > 1) {
        for (let i = gameRef.current.blocks.length - 1; i > 0; i--) {
          const block = gameRef.current.blocks[i];
          scene.remove(block.mesh);
          gameRef.current.blocks.splice(i, 1);
        }
      }
      
      // Add first moving block
      addBlock();
      gameRef.current.currentState = 'playing';
      setGameState('playing');
    };

    gameActionsRef.current.placeBlock = () => {
      if (gameRef.current.blocks.length < 2) return;
      
      const currentBlock = gameRef.current.blocks[gameRef.current.blocks.length - 1];
      const previousBlock = gameRef.current.blocks[gameRef.current.blocks.length - 2];
      
      // Stop the current block
      currentBlock.direction = 0;
      
      // Calculate distance from center of previous block
      const deltaX = currentBlock.position.x - previousBlock.position.x;
      const deltaZ = currentBlock.position.z - previousBlock.position.z;
      const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      
      // Calculate overlap
      const overlap = (previousBlock.radius * 2) - distance;
      
      if (overlap <= 0) {
        // Missed completely - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        
        // Make block fall
        let velocity = 0;
        const animateFall = () => {
          velocity += 0.5;
          currentBlock.mesh.position.y -= velocity;
          currentBlock.mesh.rotation.x += 0.1;
          currentBlock.mesh.rotation.z += 0.05;
          
          if (currentBlock.mesh.position.y > -30) {
            requestAnimationFrame(animateFall);
          } else {
            scene.remove(currentBlock.mesh);
          }
        };
        animateFall();
        return;
      }
      
      // Calculate new radius based on overlap
      const newRadius = overlap / 2;
      
      if (newRadius < 0.5) {
        // Too small to continue - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Calculate precision
      const precisionValue = Math.floor((newRadius / currentBlock.radius) * 100);
      setPrecision(precisionValue);
      
      if (newRadius < currentBlock.radius) {
        // Update current block with new size
        currentBlock.radius = newRadius;
        
        // Calculate new center position (midpoint of overlap)
        const overlapCenterX = previousBlock.position.x + (deltaX * (1 - distance / (previousBlock.radius * 2)) / 2);
        const overlapCenterZ = previousBlock.position.z + (deltaZ * (1 - distance / (previousBlock.radius * 2)) / 2);
        
        currentBlock.position.x = overlapCenterX;
        currentBlock.position.z = overlapCenterZ;
        
        // Recreate mesh with new dimensions
        scene.remove(currentBlock.mesh);
        const geometry = new THREE.CylinderGeometry(newRadius, newRadius, 2, 32);
        currentBlock.mesh = new THREE.Mesh(geometry, currentBlock.mesh.material);
        currentBlock.mesh.position.set(
          currentBlock.position.x,
          currentBlock.position.y,
          currentBlock.position.z
        );
        currentBlock.mesh.castShadow = true;
        currentBlock.mesh.receiveShadow = true;
        scene.add(currentBlock.mesh);
        
        // Create falling piece (the cut-off part)
        const fallingRadius = previousBlock.radius - newRadius;
        if (fallingRadius > 0.1) {
          const fallingGeometry = new THREE.CylinderGeometry(fallingRadius, fallingRadius, 2, 32);
          const fallingMesh = new THREE.Mesh(fallingGeometry, currentBlock.mesh.material.clone());
          
          // Position falling piece on opposite side of overlap
          const fallingX = previousBlock.position.x + (deltaX * (1 + fallingRadius / previousBlock.radius));
          const fallingZ = previousBlock.position.z + (deltaZ * (1 + fallingRadius / previousBlock.radius));
          
          fallingMesh.position.set(fallingX, currentBlock.position.y, fallingZ);
          scene.add(fallingMesh);
          
          // Animate falling piece
          let velocity = 0;
          const animateFall = () => {
            velocity += 0.5;
            fallingMesh.position.y -= velocity;
            fallingMesh.rotation.x += 0.1;
            fallingMesh.rotation.z += 0.05;
            
            if (fallingMesh.position.y > -30) {
              requestAnimationFrame(animateFall);
            } else {
              scene.remove(fallingMesh);
            }
          };
          animateFall();
        }
      } else {
        // Perfect alignment!
        // Flash green effect
        const originalEmissive = currentBlock.mesh.material.emissive.getHex();
        currentBlock.mesh.material.emissive = new THREE.Color(0x00ff00);
        currentBlock.mesh.material.emissiveIntensity = 1;
        setTimeout(() => {
          currentBlock.mesh.material.emissive.setHex(originalEmissive);
          currentBlock.mesh.material.emissiveIntensity = 0.2 + (gameRef.current.blocks.length * 0.01);
        }, 300);
      }
      
      // Update score
      const points = Math.floor(10 + precisionValue / 10);
      setScore(prev => prev + points);
      
      // Add next block
      setTimeout(() => addBlock(), 200);
    };

    gameActionsRef.current.restartGame = () => {
      // Clear all blocks
      gameRef.current.blocks.forEach(block => {
        scene.remove(block.mesh);
      });
      gameRef.current.blocks = [];
      
      // Reset camera
      camera.position.y = 30;
      camera.lookAt(0, 10, 0);
      
      // Add base block again
      addBaseBlock();
      
      // Reset state
      gameRef.current.currentState = 'ready';
      setGameState('ready');
      setScore(0);
      setPrecision(100);
    };

    // Add initial base block
    addBaseBlock();

    // Animation loop
    const animate = () => {
      // Update moving blocks with flower/pendulum pattern
      const currentBlock = gameRef.current.blocks[gameRef.current.blocks.length - 1];
      if (currentBlock && currentBlock.direction !== 0) {
        // Update pendulum angle
        currentBlock.pendulumAngle += currentBlock.direction;
        
        // Calculate pendulum position (swinging motion)
        const swingRadius = 15;
        const x = Math.sin(currentBlock.pendulumAngle) * swingRadius;
        
        // Apply rotation to create flower pattern
        currentBlock.position.x = x * Math.cos(currentBlock.pendulumRotation);
        currentBlock.position.z = x * Math.sin(currentBlock.pendulumRotation);
        
        // Slowly rotate the pendulum direction
        currentBlock.pendulumRotation += 0.005;
        
        // Reverse direction at swing limits
        if (Math.abs(currentBlock.pendulumAngle) > Math.PI / 2) {
          currentBlock.direction = -currentBlock.direction;
        }
        
        currentBlock.mesh.position.x = currentBlock.position.x;
        currentBlock.mesh.position.z = currentBlock.position.z;
      }

      // Render
      renderer.render(scene, camera);
      gameRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const frustumSize = 30;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Handle keyboard/mouse input
    const handleAction = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      e.preventDefault();
      
      console.log("Action triggered, current state:", gameRef.current.currentState);
      
      if (gameRef.current.currentState === 'ready') {
        gameActionsRef.current.startGame();
      } else if (gameRef.current.currentState === 'playing') {
        gameActionsRef.current.placeBlock();
      } else if (gameRef.current.currentState === 'over') {
        gameActionsRef.current.restartGame();
      }
    };
    
    window.addEventListener('keydown', handleAction);
    containerRef.current.addEventListener('click', handleAction);
    const clickElement = containerRef.current;

    // Cleanup
    return () => {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleAction);
      clickElement?.removeEventListener('click', handleAction);
      
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      gameRef.current.isInitialized = false;
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="relative w-full h-full bg-black">
      {/* HUD Grid overlay */}
      <div className="hud-grid"></div>
      {/* CRT Scanline effect */}
      <div className="crt-scanline"></div>
      
      {/* Score display with HUD styling */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <div className="bg-black/90 border-2 border-yellow-400/60 px-4 py-2" style={{
          boxShadow: '0 0 25px rgba(255, 204, 0, 0.4), inset 0 0 15px rgba(255, 204, 0, 0.15)',
          fontFamily: 'monospace',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
        }}>
          <div className="text-xl text-green-400" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>
            SCORE: <span className="text-yellow-400 font-bold text-2xl" style={{textShadow: '0 0 12px rgba(255, 204, 0, 0.9)'}}>{score.toString().padStart(6, '0')}</span>
          </div>
        </div>
        <div className="bg-black/90 border-2 border-green-400/60 px-4 py-2" style={{
          boxShadow: '0 0 25px rgba(0, 255, 0, 0.4), inset 0 0 15px rgba(0, 255, 0, 0.15)',
          fontFamily: 'monospace',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
        }}>
          <div className="text-lg" style={{
            color: precision > 80 ? '#00ff00' : precision > 50 ? '#ffcc00' : '#ff4400',
            textShadow: `0 0 8px ${precision > 80 ? 'rgba(0, 255, 0, 0.6)' : precision > 50 ? 'rgba(255, 204, 0, 0.6)' : 'rgba(255, 68, 0, 0.6)'}`
          }}>
            PRECISION: {precision}%
          </div>
        </div>
      </div>

      {/* HUD corner decorations */}
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-yellow-400/30"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-yellow-400/30"></div>
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-yellow-400/30"></div>

      {/* Game canvas */}
      <div ref={containerRef} className="flex-1 relative">
        {/* Game UI overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4" style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(255, 204, 0, 0.6)',
                letterSpacing: '2px'
              }}>◉ CIRCLE TOWER ◉</h2>
              <p className="text-green-400 mb-2" style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>Flower pattern stacking</p>
              <p className="text-yellow-400/70 mb-8 text-sm" style={{fontFamily: 'monospace'}}>BLOCKS SWING IN ROTATING PENDULUM MOTION</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-black/80 border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-xl font-bold hover:bg-yellow-400/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 204, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                Start System
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="bg-black/90 border-2 border-green-400/60 px-6 py-2" style={{
              fontFamily: 'monospace',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)',
              clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)'
            }}>
              <span className="text-green-400 uppercase tracking-wider" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>◉ SPACE TO LOCK ◉</span>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-red-500 mb-4" style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(255, 0, 0, 0.6)',
                letterSpacing: '2px',
                animation: 'pulse 1s infinite'
              }}>◉ TOWER COLLAPSED ◉</h2>
              <p className="text-yellow-400 text-2xl mb-2" style={{fontFamily: 'monospace'}}>FINAL SCORE: {score.toString().padStart(6, '0')}</p>
              <p className="text-green-400 mb-8" style={{fontFamily: 'monospace'}}>PRECISION: {precision}%</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-black/80 border-2 border-red-500 text-red-500 px-8 py-4 text-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}