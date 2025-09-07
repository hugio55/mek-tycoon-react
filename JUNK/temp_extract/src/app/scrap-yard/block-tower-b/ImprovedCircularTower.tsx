"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";

interface RingBlock {
  mesh: THREE.Mesh;
  body?: CANNON.Body;
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

interface FallingPiece {
  mesh: THREE.Mesh;
  body: CANNON.Body;
}

export default function ImprovedCircularTower() {
  // Add CSS for HUD effects
  if (typeof document !== 'undefined' && !document.getElementById('improved-circular-tower-styles')) {
    const style = document.createElement('style');
    style.id = 'improved-circular-tower-styles';
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
  const [towerHeight, setTowerHeight] = useState(0);
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    world: CANNON.World | null;
    rings: RingBlock[];
    fallingPieces: FallingPiece[];
    animationId: number | null;
    isInitialized: boolean;
    currentState: 'ready' | 'playing' | 'over';
    groundBody: CANNON.Body | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    world: null,
    rings: [],
    fallingPieces: [],
    animationId: null,
    isInitialized: false,
    currentState: 'ready',
    groundBody: null
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

    console.log("Initializing Improved Circular Tower with Physics...");

    // Setup renderer
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
    scene.fog = new THREE.Fog(0x000800, 20, 80);
    gameRef.current.scene = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 25, 20);
    camera.lookAt(0, 10, 0);
    gameRef.current.camera = camera;

    // Setup physics world
    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    gameRef.current.world = world;

    // Create ground physics body
    const groundShape = new CANNON.Box(new CANNON.Vec3(50, 0.1, 50));
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      position: new CANNON.Vec3(0, 0, 0)
    });
    world.addBody(groundBody);
    gameRef.current.groundBody = groundBody;

    // Industrial lighting
    const ambientLight = new THREE.AmbientLight(0xffcc00, 0.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffff88, 0.5);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);
    
    const rimLight = new THREE.DirectionalLight(0x88ff00, 0.3);
    rimLight.position.set(-10, 10, -5);
    scene.add(rimLight);

    // Add grid floor
    const gridHelper = new THREE.GridHelper(40, 20, 0x444400, 0x222200);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Add solid floor mesh for visual reference
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x111111,
      transparent: true,
      opacity: 0.5
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Helper function to create ring geometry
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

    // Create physics body for ring piece
    const createRingPhysicsBody = (innerRadius: number, outerRadius: number, height: number, arcLength: number, position: CANNON.Vec3, rotation: number) => {
      // Approximate the ring segment with a box
      const avgRadius = (innerRadius + outerRadius) / 2;
      const width = outerRadius - innerRadius;
      const length = avgRadius * arcLength; // Arc length approximation
      
      const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
      const body = new CANNON.Body({
        mass: 5,
        shape: shape,
        position: position
      });
      
      // Apply rotation
      const quaternion = new CANNON.Quaternion();
      quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
      body.quaternion = quaternion;
      
      return body;
    };

    const addFirstRing = () => {
      // Start with a single C-shaped ring, no platform
      const arcLength = Math.PI * 1.8; // C-shaped (324 degrees)
      const geometry = createRingGeometry(3, 7, 2, 0, arcLength);
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
      
      // Random starting rotation
      const startAngle = Math.random() * Math.PI * 2;
      mesh.rotation.y = startAngle;
      
      scene.add(mesh);

      const firstRing: RingBlock = {
        mesh,
        innerRadius: 3,
        outerRadius: 7,
        arcStart: 0,
        arcEnd: arcLength,
        angle: startAngle,
        rotationSpeed: 0.02,
        height: 2,
        position: { x: 0, y: 1, z: 0 },
        isMoving: true
      };
      
      gameRef.current.rings.push(firstRing);
      setTowerHeight(1);
    };

    const addRing = () => {
      if (gameRef.current.rings.length === 0) return;
      
      const lastRing = gameRef.current.rings[gameRef.current.rings.length - 1];
      const newIndex = gameRef.current.rings.length;
      
      // Use the dimensions from the last successfully placed ring
      const arcLength = lastRing.arcEnd - lastRing.arcStart;
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
        rotationSpeed: 0.02 + (newIndex * 0.002),
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
      console.log("Starting improved circular game...");
      setScore(0);
      setCombo(0);
      setTowerHeight(0);
      
      // Clear everything
      gameRef.current.rings.forEach(ring => {
        scene.remove(ring.mesh);
      });
      gameRef.current.rings = [];
      
      gameRef.current.fallingPieces.forEach(piece => {
        scene.remove(piece.mesh);
        world.removeBody(piece.body);
      });
      gameRef.current.fallingPieces = [];
      
      // Reset camera
      camera.position.set(20, 25, 20);
      camera.lookAt(0, 10, 0);
      
      // Add first spinning ring
      addFirstRing();
      gameRef.current.currentState = 'playing';
      setGameState('playing');
    };

    gameActionsRef.current.placeRing = () => {
      if (gameRef.current.rings.length < 1) return;
      
      const currentRing = gameRef.current.rings[gameRef.current.rings.length - 1];
      
      // Stop rotation
      currentRing.isMoving = false;
      currentRing.rotationSpeed = 0;
      
      // For the first ring, just stop it and add the next one
      if (gameRef.current.rings.length === 1) {
        setTowerHeight(1);
        setScore(10);
        setTimeout(() => addRing(), 200);
        return;
      }
      
      const previousRing = gameRef.current.rings[gameRef.current.rings.length - 2];
      
      // Calculate overlap based on rotation angles
      const prevStart = previousRing.angle + previousRing.arcStart;
      const prevEnd = previousRing.angle + previousRing.arcEnd;
      const currStart = currentRing.angle + currentRing.arcStart;
      const currEnd = currentRing.angle + currentRing.arcEnd;
      
      // Calculate overlap arc (simplified for C-shaped rings)
      let overlapStart = 0;
      let overlapEnd = 0;
      let overlapArc = 0;
      
      // Normalize angles to 0-2π range
      const normalizeAngle = (angle: number) => {
        angle = angle % (Math.PI * 2);
        if (angle < 0) angle += Math.PI * 2;
        return angle;
      };
      
      const prevStartNorm = normalizeAngle(prevStart);
      const prevEndNorm = normalizeAngle(prevEnd);
      const currStartNorm = normalizeAngle(currStart);
      const currEndNorm = normalizeAngle(currEnd);
      
      // Calculate overlap (complex due to wrapping)
      // Simplified approach: check angular overlap
      const angleDiff = Math.abs(normalizeAngle(currentRing.angle - previousRing.angle));
      const maxOverlap = Math.min(previousRing.arcEnd - previousRing.arcStart, currentRing.arcEnd - currentRing.arcStart);
      
      // Calculate overlap based on how well aligned the rings are
      if (angleDiff < Math.PI) {
        overlapArc = maxOverlap * (1 - angleDiff / Math.PI);
      } else {
        overlapArc = maxOverlap * (1 - (Math.PI * 2 - angleDiff) / Math.PI);
      }
      
      overlapStart = Math.max(prevStartNorm, currStartNorm);
      overlapEnd = overlapStart + overlapArc;
      
      const previousArcLength = previousRing.arcEnd - previousRing.arcStart;
      const overlapRatio = overlapArc / previousArcLength;
      
      if (overlapRatio <= 0.1) {
        // Missed completely - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        
        // Make entire ring fall with physics
        const position = new CANNON.Vec3(
          currentRing.position.x,
          currentRing.position.y,
          currentRing.position.z
        );
        
        const body = createRingPhysicsBody(
          currentRing.innerRadius,
          currentRing.outerRadius,
          2,
          currentRing.arcEnd - currentRing.arcStart,
          position,
          currentRing.angle
        );
        
        // Add some random initial velocity for more realistic fall
        body.velocity.set(
          (Math.random() - 0.5) * 5,
          0,
          (Math.random() - 0.5) * 5
        );
        body.angularVelocity.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        
        world.addBody(body);
        currentRing.body = body;
        
        gameRef.current.fallingPieces.push({
          mesh: currentRing.mesh,
          body: body
        });
        
        return;
      }
      
      if (overlapRatio < 0.95) {
        // Partial overlap - cut the ring
        scene.remove(currentRing.mesh);
        
        // Create new trimmed ring (only the overlapping part)
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
        
        // Create falling pieces for the cut-off parts
        const totalOriginalArc = currentRing.arcEnd - currentRing.arcStart + overlapArc;
        const cutOffArc = totalOriginalArc - newArcLength;
        
        if (cutOffArc > 0.1) {
          // Create two falling pieces (before and after the overlap)
          const createFallingPiece = (arcSize: number, startAngle: number) => {
            if (arcSize <= 0.1) return;
            
            const fallingGeometry = createRingGeometry(
              currentRing.innerRadius,
              currentRing.outerRadius,
              2,
              0,
              arcSize
            );
            const fallingMesh = new THREE.Mesh(fallingGeometry, currentRing.mesh.material.clone());
            fallingMesh.position.set(
              currentRing.position.x,
              currentRing.position.y,
              currentRing.position.z
            );
            fallingMesh.rotation.y = startAngle;
            fallingMesh.castShadow = true;
            scene.add(fallingMesh);
            
            // Create physics body for falling piece
            const position = new CANNON.Vec3(
              currentRing.position.x,
              currentRing.position.y,
              currentRing.position.z
            );
            
            const body = createRingPhysicsBody(
              currentRing.innerRadius,
              currentRing.outerRadius,
              2,
              arcSize,
              position,
              startAngle
            );
            
            // Add some outward velocity for more dramatic effect
            const angle = startAngle + arcSize / 2;
            body.velocity.set(
              Math.cos(angle) * 8,
              2,
              Math.sin(angle) * 8
            );
            body.angularVelocity.set(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            );
            
            world.addBody(body);
            
            gameRef.current.fallingPieces.push({
              mesh: fallingMesh,
              body: body
            });
          };
          
          // Create falling piece(s) based on where the overlap occurred
          if (angleDiff < cutOffArc / 2) {
            // Cut happened mostly on one side
            createFallingPiece(cutOffArc, currEndNorm - cutOffArc);
          } else {
            // Cut happened on both sides
            const piece1Size = cutOffArc / 2;
            const piece2Size = cutOffArc / 2;
            createFallingPiece(piece1Size, currStartNorm - piece1Size);
            createFallingPiece(piece2Size, currEndNorm);
          }
        }
        
        setCombo(0);
      } else {
        // Perfect or near-perfect alignment!
        setCombo(prev => prev + 1);
        
        // NO green flash - just keep the original color
        // Visual feedback through score/combo display instead
      }
      
      // Update score
      const points = Math.floor(10 * (1 + overlapRatio) * (1 + combo * 0.5));
      setScore(prev => prev + points);
      setTowerHeight(gameRef.current.rings.length);
      
      // Check if ring is too small to continue
      const currentArcLength = currentRing.arcEnd - currentRing.arcStart;
      if (currentArcLength < 0.3 || (currentRing.outerRadius - currentRing.innerRadius) < 0.5) {
        // Ring too small - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Add next ring
      setTimeout(() => addRing(), 200);
    };

    gameActionsRef.current.restartGame = () => {
      // Clear all rings
      gameRef.current.rings.forEach(ring => {
        scene.remove(ring.mesh);
      });
      gameRef.current.rings = [];
      
      // Clear all falling pieces
      gameRef.current.fallingPieces.forEach(piece => {
        scene.remove(piece.mesh);
        world.removeBody(piece.body);
      });
      gameRef.current.fallingPieces = [];
      
      // Reset camera
      camera.position.set(20, 25, 20);
      camera.lookAt(0, 10, 0);
      
      gameRef.current.currentState = 'ready';
      setGameState('ready');
      setScore(0);
      setCombo(0);
      setTowerHeight(0);
    };

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const deltaTime = clock.getDelta();
      
      // Update physics
      world.step(1/60, deltaTime, 3);
      
      // Update falling pieces positions from physics
      gameRef.current.fallingPieces.forEach((piece, index) => {
        piece.mesh.position.copy(piece.body.position as any);
        piece.mesh.quaternion.copy(piece.body.quaternion as any);
        
        // Remove pieces that have fallen too far
        if (piece.body.position.y < -50) {
          scene.remove(piece.mesh);
          world.removeBody(piece.body);
          gameRef.current.fallingPieces.splice(index, 1);
        }
      });
      
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
      
      {/* Score, Combo & Height display */}
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
        
        <div className="bg-black/90 border-2 border-blue-400/60 px-4 py-2" style={{
          boxShadow: '0 0 25px rgba(0, 150, 255, 0.4), inset 0 0 15px rgba(0, 150, 255, 0.15)',
          fontFamily: 'monospace',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
        }}>
          <div className="text-lg text-blue-400" style={{textShadow: '0 0 8px rgba(0, 150, 255, 0.6)'}}>
            HEIGHT: {towerHeight}
          </div>
        </div>
        
        {combo > 0 && (
          <div className="bg-black/90 border-2 border-purple-400/60 px-4 py-2 animate-pulse" style={{
            boxShadow: '0 0 25px rgba(200, 0, 255, 0.4), inset 0 0 15px rgba(200, 0, 255, 0.15)',
            fontFamily: 'monospace',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
          }}>
            <div className="text-lg text-purple-400" style={{textShadow: '0 0 8px rgba(200, 0, 255, 0.6)'}}>COMBO ×{combo}</div>
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
              }}>⟳ PHYSICS TOWER ⟳</h2>
              <p className="text-green-400 mb-2" style={{fontFamily: 'monospace', textTransform: 'uppercase'}}>Stack rotating C-rings with realistic physics</p>
              <p className="text-yellow-400/70 mb-8 text-sm" style={{fontFamily: 'monospace'}}>CUT PIECES FALL WITH RIGID BODY DYNAMICS</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-black/80 border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-xl font-bold hover:bg-yellow-400/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 204, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                START STACKING
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
              <span className="text-green-400 uppercase tracking-wider" style={{textShadow: '0 0 8px rgba(0, 255, 0, 0.6)'}}>⟳ SPACE/CLICK TO PLACE ⟳</span>
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
              }}>⟳ TOWER COLLAPSED ⟳</h2>
              <p className="text-yellow-400 text-2xl mb-2" style={{fontFamily: 'monospace'}}>FINAL SCORE: {score.toString().padStart(6, '0')}</p>
              <p className="text-blue-400 mb-2" style={{fontFamily: 'monospace'}}>MAX HEIGHT: {towerHeight} LAYERS</p>
              <p className="text-purple-400 mb-8" style={{fontFamily: 'monospace'}}>BEST COMBO: ×{combo}</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-black/80 border-2 border-red-500 text-red-500 px-8 py-4 text-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)',
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}