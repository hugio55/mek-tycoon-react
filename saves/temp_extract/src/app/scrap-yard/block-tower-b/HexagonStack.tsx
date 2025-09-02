"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HexBlock {
  mesh: THREE.Mesh;
  rotation: number;
  rotationSpeed: number;
  size: number;
  height: number;
  position: { x: number; y: number; z: number };
  isMoving: boolean;
  edges: number[];
}

export default function HexagonStack() {
  // Add CSS for HUD effects
  if (typeof document !== 'undefined' && !document.getElementById('hexagon-stack-styles')) {
    const style = document.createElement('style');
    style.id = 'hexagon-stack-styles';
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
    `;
    document.head.appendChild(style);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [alignment, setAlignment] = useState(100);
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    hexBlocks: HexBlock[];
    animationId: number | null;
    isInitialized: boolean;
    currentState: 'ready' | 'playing' | 'over';
  }>({
    renderer: null,
    scene: null,
    camera: null,
    hexBlocks: [],
    animationId: null,
    isInitialized: false,
    currentState: 'ready'
  });

  const gameActionsRef = useRef<{
    startGame: () => void;
    placeHex: () => void;
    restartGame: () => void;
  }>({
    startGame: () => {},
    placeHex: () => {},
    restartGame: () => {}
  });

  useEffect(() => {
    if (!containerRef.current || gameRef.current.isInitialized) return;
    gameRef.current.isInitialized = true;

    console.log("Initializing Hexagon Stack...");

    // Setup renderer with HUD styling
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000800, 1);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    gameRef.current.renderer = renderer;

    // Setup scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000800, 10, 70);
    gameRef.current.scene = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      70,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(12, 18, 12);
    camera.lookAt(0, 8, 0);
    gameRef.current.camera = camera;

    // HUD-style lighting
    const ambientLight = new THREE.AmbientLight(0xffcc00, 0.15);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffff00, 0.7);
    mainLight.position.set(10, 25, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    
    // Green HUD accent lights
    const hudLight1 = new THREE.PointLight(0x00ff00, 0.5, 20);
    hudLight1.position.set(10, 5, 0);
    scene.add(hudLight1);
    
    const hudLight2 = new THREE.PointLight(0x00ff88, 0.5, 20);
    hudLight2.position.set(-10, 5, 0);
    scene.add(hudLight2);

    // Add hexagonal grid base
    const gridRadius = 15;
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x224400,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(angle) * gridRadius, 0, Math.sin(angle) * gridRadius),
        new THREE.Vector3(Math.cos(nextAngle) * gridRadius, 0, Math.sin(nextAngle) * gridRadius),
        new THREE.Vector3(0, 0, 0)
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      scene.add(line);
    }

    // Helper functions
    const createHexagonGeometry = (radius: number, height: number) => {
      const shape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      shape.closePath();
      
      const extrudeSettings = {
        depth: height,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 1
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, height / 2, 0);
      
      return geometry;
    };

    const addBaseHex = () => {
      const geometry = createHexagonGeometry(4, 2);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffcc00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 1, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const baseHex: HexBlock = {
        mesh,
        rotation: 0,
        rotationSpeed: 0,
        size: 4,
        height: 2,
        position: { x: 0, y: 1, z: 0 },
        isMoving: false,
        edges: [0, 60, 120, 180, 240, 300]
      };
      
      gameRef.current.hexBlocks.push(baseHex);
    };

    const addHex = () => {
      if (gameRef.current.hexBlocks.length === 0) return;
      
      const lastHex = gameRef.current.hexBlocks[gameRef.current.hexBlocks.length - 1];
      const newIndex = gameRef.current.hexBlocks.length;
      
      // Shrinking size as tower grows
      const newSize = Math.max(2, lastHex.size - 0.05);
      const geometry = createHexagonGeometry(newSize, 1.5);
      
      // Industrial yellow-green gradient
      const colorIntensity = 0.6 + (newIndex * 0.02);
      const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(0xccff00).multiplyScalar(colorIntensity),
        emissive: 0xffcc00,
        emissiveIntensity: 0.15 + (newIndex * 0.01),
        metalness: 0.7,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position
      const heightY = lastHex.position.y + 2;
      mesh.position.set(0, heightY, 0);
      
      // Random starting rotation
      const startRotation = Math.random() * Math.PI * 2;
      mesh.rotation.y = startRotation;
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const newHex: HexBlock = {
        mesh,
        rotation: startRotation,
        rotationSpeed: 0.01 + newIndex * 0.002,
        size: newSize,
        height: 1.5,
        position: { x: 0, y: heightY, z: 0 },
        isMoving: true,
        edges: [0, 60, 120, 180, 240, 300]
      };
      
      gameRef.current.hexBlocks.push(newHex);
      
      // Move camera up
      if (camera && newIndex > 5) {
        const targetY = 18 + (newIndex - 5) * 1.5;
        camera.position.y = targetY;
        camera.lookAt(0, targetY - 10, 0);
      }
    };

    // Game actions
    gameActionsRef.current.startGame = () => {
      console.log("Starting hexagon game...");
      setScore(0);
      setAlignment(100);
      
      // Clear existing hexagons except base
      if (gameRef.current.hexBlocks.length > 1) {
        for (let i = gameRef.current.hexBlocks.length - 1; i > 0; i--) {
          const hex = gameRef.current.hexBlocks[i];
          scene.remove(hex.mesh);
          gameRef.current.hexBlocks.splice(i, 1);
        }
      }
      
      addHex();
      gameRef.current.currentState = 'playing';
      setGameState('playing');
    };

    gameActionsRef.current.placeHex = () => {
      if (gameRef.current.hexBlocks.length < 2) return;
      
      const currentHex = gameRef.current.hexBlocks[gameRef.current.hexBlocks.length - 1];
      const previousHex = gameRef.current.hexBlocks[gameRef.current.hexBlocks.length - 2];
      
      // Stop rotation
      currentHex.isMoving = false;
      
      // Calculate rotation difference
      let rotDiff = Math.abs(currentHex.rotation - previousHex.rotation);
      rotDiff = rotDiff % (Math.PI / 3); // Modulo 60 degrees
      
      // Check alignment (hexagons align every 60 degrees)
      const alignmentError = Math.min(rotDiff, Math.PI / 3 - rotDiff);
      const alignmentPercent = 100 - (alignmentError / (Math.PI / 6)) * 100;
      setAlignment(Math.floor(alignmentPercent));
      
      // Perfect alignment threshold
      const threshold = Math.PI / 18; // 10 degrees
      
      if (alignmentError > threshold) {
        // Calculate overlap
        const overlapRatio = 1 - (alignmentError / (Math.PI / 6));
        
        if (overlapRatio < 0.3) {
          // Missed too much - game over
          gameRef.current.currentState = 'over';
          setGameState('over');
          
          // Fall animation
          let velocity = 0;
          const animateFall = () => {
            velocity += 0.5;
            currentHex.mesh.position.y -= velocity;
            currentHex.mesh.rotation.x += 0.15;
            currentHex.mesh.rotation.z += 0.1;
            
            if (currentHex.mesh.position.y > -30) {
              requestAnimationFrame(animateFall);
            } else {
              scene.remove(currentHex.mesh);
            }
          };
          animateFall();
          return;
        }
        
        // Shrink hex based on misalignment
        const newSize = currentHex.size * overlapRatio;
        scene.remove(currentHex.mesh);
        
        const newGeometry = createHexagonGeometry(newSize, currentHex.height);
        currentHex.mesh = new THREE.Mesh(newGeometry, currentHex.mesh.material);
        currentHex.mesh.position.set(
          currentHex.position.x,
          currentHex.position.y,
          currentHex.position.z
        );
        currentHex.mesh.rotation.y = currentHex.rotation;
        currentHex.size = newSize;
        scene.add(currentHex.mesh);
        
        // Create falling piece
        const fallingSize = currentHex.size * (1 - overlapRatio);
        const fallingGeometry = createHexagonGeometry(fallingSize, currentHex.height);
        const fallingMesh = new THREE.Mesh(fallingGeometry, currentHex.mesh.material.clone());
        fallingMesh.position.copy(currentHex.mesh.position);
        fallingMesh.position.x += Math.cos(currentHex.rotation) * (newSize + fallingSize) / 2;
        fallingMesh.position.z += Math.sin(currentHex.rotation) * (newSize + fallingSize) / 2;
        scene.add(fallingMesh);
        
        // Animate falling
        let velocity = 0;
        const animateFall = () => {
          velocity += 0.5;
          fallingMesh.position.y -= velocity;
          fallingMesh.rotation.y += 0.1;
          fallingMesh.rotation.x += 0.05;
          
          if (fallingMesh.position.y > -30) {
            requestAnimationFrame(animateFall);
          } else {
            scene.remove(fallingMesh);
          }
        };
        animateFall();
      } else {
        // Perfect or near-perfect alignment!
        // Green flash for perfect alignment
        const originalEmissive = currentHex.mesh.material.emissive.getHex();
        currentHex.mesh.material.emissive = new THREE.Color(0x00ff00);
        currentHex.mesh.material.emissiveIntensity = 1;
        setTimeout(() => {
          currentHex.mesh.material.emissive.setHex(originalEmissive);
          currentHex.mesh.material.emissiveIntensity = 0.15 + (gameRef.current.hexBlocks.length * 0.01);
        }, 300);
      }
      
      // Update score
      const points = Math.floor(10 + alignmentPercent / 5);
      setScore(prev => prev + points);
      
      // Add next hex
      setTimeout(() => addHex(), 200);
    };

    gameActionsRef.current.restartGame = () => {
      gameRef.current.hexBlocks.forEach(hex => {
        scene.remove(hex.mesh);
      });
      gameRef.current.hexBlocks = [];
      
      camera.position.set(12, 18, 12);
      camera.lookAt(0, 8, 0);
      
      addBaseHex();
      
      gameRef.current.currentState = 'ready';
      setGameState('ready');
      setScore(0);
      setAlignment(100);
    };

    // Initialize with base hex
    addBaseHex();

    // Animation loop
    const animate = () => {
      // Rotate moving hexagons
      gameRef.current.hexBlocks.forEach(hex => {
        if (hex.isMoving) {
          hex.rotation += hex.rotationSpeed;
          hex.mesh.rotation.y = hex.rotation;
        }
      });

      // Orbit camera slowly
      const time = Date.now() * 0.0004;
      if (camera) {
        camera.position.x = Math.cos(time) * 18;
        camera.position.z = Math.sin(time) * 18;
        camera.lookAt(0, camera.position.y - 10, 0);
      }

      renderer.render(scene, camera);
      gameRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Event handlers
    const handleAction = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;
      e.preventDefault();
      
      if (gameRef.current.currentState === 'ready') {
        gameActionsRef.current.startGame();
      } else if (gameRef.current.currentState === 'playing') {
        gameActionsRef.current.placeHex();
      } else if (gameRef.current.currentState === 'over') {
        gameActionsRef.current.restartGame();
      }
    };
    
    window.addEventListener('keydown', handleAction);
    containerRef.current.addEventListener('click', handleAction);
    const clickElement = containerRef.current;

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

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
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* HUD Grid overlay */}
      <div className="hud-grid"></div>
      
      {/* Score & Alignment display */}
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
          <div className="text-lg" style={{color: alignment > 80 ? '#00ff00' : alignment > 50 ? '#ffcc00' : '#ff4400', textShadow: `0 0 8px ${alignment > 80 ? 'rgba(0, 255, 0, 0.6)' : alignment > 50 ? 'rgba(255, 204, 0, 0.6)' : 'rgba(255, 68, 0, 0.6)'}`}}>
            ALIGNMENT: {alignment}%
          </div>
        </div>
      </div>

      {/* HUD corner decorations */}
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-yellow-400/30"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-yellow-400/30"></div>
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-yellow-400/30"></div>

      {/* Game canvas */}
      <div ref={containerRef} className="w-full h-full">
        {/* Game UI overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4" style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(255, 204, 0, 0.6)',
                letterSpacing: '2px'
              }}>⬡ HEXAGON STACK ⬡</h2>
              <p className="text-green-400 mb-2" style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>Six-sided precision stacking</p>
              <p className="text-yellow-400/70 mb-8 text-sm" style={{fontFamily: 'monospace'}}>ALIGN EDGES FOR MAXIMUM STABILITY</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-black/80 border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-xl font-bold hover:bg-yellow-400/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 204, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                Deploy System
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
              <span className="text-green-400 uppercase tracking-wider" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>⬡ SPACE TO LOCK ⬡</span>
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
              }}>⬡ STRUCTURAL FAILURE ⬡</h2>
              <p className="text-yellow-400 text-2xl mb-2" style={{fontFamily: 'monospace'}}>FINAL SCORE: {score.toString().padStart(6, '0')}</p>
              <p className="text-green-400 mb-8" style={{fontFamily: 'monospace'}}>ALIGNMENT: {alignment}%</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-black/80 border-2 border-red-500 text-red-500 px-8 py-4 text-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                Reinitialize
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}