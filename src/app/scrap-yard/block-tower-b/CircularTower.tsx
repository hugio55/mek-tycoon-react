"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface RingBlock {
  mesh: THREE.Mesh;
  innerRadius: number;
  outerRadius: number;
  arcStart: number;
  arcEnd: number;
  angle: number;
  rotationSpeed: number;
  height: number;
  position: { x: number; y: number; z: number };
  isMoving: boolean;
}

export default function CircularTower() {
  // Add CSS for HUD effects
  if (typeof document !== 'undefined' && !document.getElementById('circular-tower-styles')) {
    const style = document.createElement('style');
    style.id = 'circular-tower-styles';
    style.innerHTML = `
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
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
  const [combo, setCombo] = useState(0);
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    rings: RingBlock[];
    animationId: number | null;
    isInitialized: boolean;
    currentState: 'ready' | 'playing' | 'over';
  }>({
    renderer: null,
    scene: null,
    camera: null,
    rings: [],
    animationId: null,
    isInitialized: false,
    currentState: 'ready'
  });

  const gameActionsRef = useRef<{
    startGame: () => void;
    placeRing: () => void;
    restartGame: () => void;
  }>({
    startGame: () => {},
    placeRing: () => {},
    restartGame: () => {}
  });

  useEffect(() => {
    if (!containerRef.current || gameRef.current.isInitialized) return;
    gameRef.current.isInitialized = true;

    console.log("Initializing Circular Tower...");

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000800, 1);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    gameRef.current.renderer = renderer;

    // Setup scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000800, 20, 80);
    gameRef.current.scene = scene;

    // Setup camera - perspective for better 3D effect
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 25, 20);
    camera.lookAt(0, 10, 0);
    gameRef.current.camera = camera;

    // Industrial lighting with yellow tint
    const ambientLight = new THREE.AmbientLight(0xffcc00, 0.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffff88, 0.5);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Add CRT-style rim lighting
    const rimLight = new THREE.DirectionalLight(0x88ff00, 0.3);
    rimLight.position.set(-10, 10, -5);
    scene.add(rimLight);

    // Add grid floor for industrial look
    const gridHelper = new THREE.GridHelper(40, 20, 0x444400, 0x222200);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Helper functions
    const createRingGeometry = (innerRadius: number, outerRadius: number, height: number, arcStart: number = 0, arcEnd: number = Math.PI * 1.8) => {
      const shape = new THREE.Shape();
      const segments = 32;
      const arcLength = arcEnd - arcStart;
      
      // Outer arc
      for (let i = 0; i <= segments; i++) {
        const angle = arcStart + (i / segments) * arcLength;
        const x = Math.cos(angle) * outerRadius;
        const y = Math.sin(angle) * outerRadius;
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      
      // Connect to inner arc
      for (let i = segments; i >= 0; i--) {
        const angle = arcStart + (i / segments) * arcLength;
        shape.lineTo(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        );
      }
      
      shape.closePath();
      
      const extrudeSettings = {
        depth: height,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 2
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, height / 2, 0);
      
      return geometry;
    };

    const addBaseRing = () => {
      const geometry = createRingGeometry(3, 7, 2, 0, Math.PI * 2);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 1, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const baseRing: RingBlock = {
        mesh,
        innerRadius: 3,
        outerRadius: 7,
        arcStart: 0,
        arcEnd: Math.PI * 2,
        angle: 0,
        rotationSpeed: 0,
        height: 2,
        position: { x: 0, y: 1, z: 0 },
        isMoving: false
      };
      
      gameRef.current.rings.push(baseRing);
    };

    const addRing = () => {
      if (gameRef.current.rings.length === 0) return;
      
      const lastRing = gameRef.current.rings[gameRef.current.rings.length - 1];
      const newIndex = gameRef.current.rings.length;
      
      // Create C-shaped ring (not full circle)
      const arcLength = Math.PI * 1.8; // 324 degrees - leaving a gap
      const geometry = createRingGeometry(
        lastRing.innerRadius,
        lastRing.outerRadius,
        2,
        0,
        arcLength
      );
      
      // Industrial yellow gradient based on height
      const intensity = 0.4 + (newIndex * 0.02);
      const color = new THREE.Color(0xffcc00).multiplyScalar(intensity);
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
        x: 0,
        y: lastRing.position.y + 2.2,
        z: 0
      };
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Start at random angle
      const startAngle = Math.random() * Math.PI * 2;
      mesh.rotation.y = startAngle;
      
      scene.add(mesh);
      
      const newRing: RingBlock = {
        mesh,
        innerRadius: lastRing.innerRadius,
        outerRadius: lastRing.outerRadius,
        arcStart: 0,
        arcEnd: arcLength,
        angle: startAngle,
        rotationSpeed: 0.02 + (newIndex * 0.002), // Speed increases with height
        height: 2,
        position,
        isMoving: true
      };
      
      gameRef.current.rings.push(newRing);
      
      // Move camera up
      if (camera && newIndex > 5) {
        const targetY = 25 + (newIndex - 5) * 2;
        camera.position.y = targetY;
        camera.lookAt(0, targetY - 15, 0);
      }
    };

    // Game actions
    gameActionsRef.current.startGame = () => {
      console.log("Starting circular game...");
      setScore(0);
      setCombo(0);
      
      // Clear existing rings except base
      if (gameRef.current.rings.length > 1) {
        for (let i = gameRef.current.rings.length - 1; i > 0; i--) {
          const ring = gameRef.current.rings[i];
          scene.remove(ring.mesh);
          gameRef.current.rings.splice(i, 1);
        }
      }
      
      addRing();
      gameRef.current.currentState = 'playing';
      setGameState('playing');
    };

    gameActionsRef.current.placeRing = () => {
      if (gameRef.current.rings.length < 2) return;
      
      const currentRing = gameRef.current.rings[gameRef.current.rings.length - 1];
      const previousRing = gameRef.current.rings[gameRef.current.rings.length - 2];
      
      // Stop rotation
      currentRing.isMoving = false;
      currentRing.rotationSpeed = 0;
      
      // Calculate overlap based on rotation angles
      // Normalize angles to 0-2π range
      const prevStart = previousRing.angle + previousRing.arcStart;
      const prevEnd = previousRing.angle + previousRing.arcEnd;
      const currStart = currentRing.angle + currentRing.arcStart;
      const currEnd = currentRing.angle + currentRing.arcEnd;
      
      // Calculate overlap arc
      const overlapStart = Math.max(prevStart, currStart);
      const overlapEnd = Math.min(prevEnd, currEnd);
      
      // Check if there's any overlap
      let overlapArc = 0;
      if (overlapEnd > overlapStart) {
        overlapArc = overlapEnd - overlapStart;
      } else {
        // Check wrap-around overlap
        const normalizedPrevEnd = prevEnd % (Math.PI * 2);
        const normalizedCurrEnd = currEnd % (Math.PI * 2);
        const normalizedOverlapStart = overlapStart % (Math.PI * 2);
        
        if (normalizedPrevEnd < normalizedOverlapStart && normalizedCurrEnd < normalizedOverlapStart) {
          overlapArc = Math.min(normalizedPrevEnd, normalizedCurrEnd) + (Math.PI * 2 - normalizedOverlapStart);
        }
      }
      
      const previousArcLength = previousRing.arcEnd - previousRing.arcStart;
      const overlapRatio = overlapArc / previousArcLength;
      
      if (overlapRatio <= 0.05) {
        // Missed completely - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        
        // Make ring fall
        let velocity = 0;
        const animateFall = () => {
          velocity += 0.5;
          currentRing.mesh.position.y -= velocity;
          currentRing.mesh.rotation.x += 0.1;
          currentRing.mesh.rotation.z += 0.05;
          
          if (currentRing.mesh.position.y > -30) {
            requestAnimationFrame(animateFall);
          } else {
            scene.remove(currentRing.mesh);
          }
        };
        animateFall();
        return;
      }
      
      if (overlapRatio < 0.95) {
        // Partial overlap - cut the ring
        scene.remove(currentRing.mesh);
        
        // Create new trimmed ring
        const newArcLength = overlapArc;
        const newGeometry = createRingGeometry(
          currentRing.innerRadius,
          currentRing.outerRadius,
          2,
          0,
          newArcLength
        );
        
        currentRing.mesh = new THREE.Mesh(newGeometry, currentRing.mesh.material);
        currentRing.mesh.position.set(
          currentRing.position.x,
          currentRing.position.y,
          currentRing.position.z
        );
        currentRing.mesh.rotation.y = overlapStart;
        currentRing.arcStart = 0;
        currentRing.arcEnd = newArcLength;
        currentRing.angle = overlapStart;
        currentRing.mesh.castShadow = true;
        currentRing.mesh.receiveShadow = true;
        scene.add(currentRing.mesh);
        
        // Create falling piece for the cut-off part
        const fallingArcLength = (currentRing.arcEnd - currentRing.arcStart) - newArcLength;
        if (fallingArcLength > 0.1) {
          const fallingGeometry = createRingGeometry(
            currentRing.innerRadius,
            currentRing.outerRadius,
            2,
            0,
            fallingArcLength
          );
          const fallingMesh = new THREE.Mesh(fallingGeometry, currentRing.mesh.material.clone());
          fallingMesh.position.copy(currentRing.mesh.position);
          fallingMesh.rotation.y = currEnd - fallingArcLength;
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
        }
        
        setCombo(0);
      } else {
        // Perfect or near-perfect alignment!
        setCombo(prev => prev + 1);
        
        // Green flash effect
        const originalEmissive = currentRing.mesh.material.emissive.getHex();
        currentRing.mesh.material.emissive = new THREE.Color(0x00ff00);
        currentRing.mesh.material.emissiveIntensity = 1;
        setTimeout(() => {
          currentRing.mesh.material.emissive.setHex(originalEmissive);
          currentRing.mesh.material.emissiveIntensity = 0.2 + (gameRef.current.rings.length * 0.01);
        }, 200);
      }
      
      // Update score
      const points = Math.floor(10 * (1 + combo * 0.5));
      setScore(prev => prev + points);
      
      // Check if ring is too small to continue
      const currentArcLength = currentRing.arcEnd - currentRing.arcStart;
      if (currentArcLength < 0.3) {
        // Ring too small - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Add next ring
      setTimeout(() => addRing(), 200);
    };

    gameActionsRef.current.restartGame = () => {
      gameRef.current.rings.forEach(ring => {
        scene.remove(ring.mesh);
      });
      gameRef.current.rings = [];
      
      camera.position.set(20, 25, 20);
      camera.lookAt(0, 10, 0);
      
      addBaseRing();
      
      gameRef.current.currentState = 'ready';
      setGameState('ready');
      setScore(0);
      setCombo(0);
    };

    // Initialize with base ring
    addBaseRing();

    // Animation loop
    const animate = () => {
      // Rotate moving rings
      gameRef.current.rings.forEach(ring => {
        if (ring.isMoving) {
          ring.angle += ring.rotationSpeed;
          ring.mesh.rotation.y = ring.angle;
        }
      });

      // Slowly rotate camera around scene
      const time = Date.now() * 0.0005;
      if (camera) {
        camera.position.x = Math.cos(time) * 30;
        camera.position.z = Math.sin(time) * 30;
        camera.lookAt(0, camera.position.y - 15, 0);
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
        gameActionsRef.current.placeRing();
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
      
      {/* Score & Combo display with HUD styling */}
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
        {combo > 0 && (
          <div className="bg-black/90 border-2 border-green-400/60 px-4 py-2 animate-pulse" style={{
            boxShadow: '0 0 25px rgba(0, 255, 0, 0.4), inset 0 0 15px rgba(0, 255, 0, 0.15)',
            fontFamily: 'monospace',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
          }}>
            <div className="text-lg text-green-400" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>COMBO ×{combo}</div>
          </div>
        )}
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
              }}>○ CIRCULAR TOWER ○</h2>
              <p className="text-green-400 mb-2" style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>Stack rotating rings</p>
              <p className="text-yellow-400/70 mb-8 text-sm" style={{fontFamily: 'monospace'}}>ALIGN ROTATION FOR PERFECT STACKS</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-black/80 border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-xl font-bold hover:bg-yellow-400/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 204, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                INITIALIZE
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
              <span className="text-green-400 uppercase tracking-wider" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>○ SPACE TO LOCK ○</span>
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
                animation: 'flicker 0.5s infinite'
              }}>○ SYSTEM FAILURE ○</h2>
              <p className="text-yellow-400 text-2xl mb-2" style={{fontFamily: 'monospace'}}>FINAL SCORE: {score.toString().padStart(6, '0')}</p>
              <p className="text-green-400 mb-8" style={{fontFamily: 'monospace'}}>MAX COMBO: ×{combo}</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-black/80 border-2 border-red-500 text-red-500 px-8 py-4 text-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                RESTART
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}