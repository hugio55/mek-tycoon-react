"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";

// Types for different game modes
type GameMode = 'classic' | 'physics' | 'swingArc' | 'spiralDrop';

interface Block {
  mesh: THREE.Mesh;
  body?: CANNON.Body;
  width: number;
  depth: number;
  direction?: number;
  speed?: number;
  position: { x: number; y: number; z: number };
  workingPlane?: 'x' | 'z';
  workingDimension?: 'width' | 'depth';
  angle?: number;
  rotationSpeed?: number;
  spiralAngle?: number;
  dropSpeed?: number;
  swingAmplitude?: number;
  swingSpeed?: number;
  isMoving?: boolean;
}

interface RingBlock {
  mesh: THREE.Mesh;
  body?: CANNON.Body;
  innerRadius: number;
  outerRadius: number;
  arcStart: number;
  arcEnd: number;
  angle: number;
  height: number;
  position: { x: number; y: number; z: number };
  isMoving: boolean;
}

interface FallingPiece {
  mesh: THREE.Mesh;
  body: CANNON.Body;
}

export default function EnhancedTowerGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [towerHeight, setTowerHeight] = useState(0);
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | THREE.PerspectiveCamera | null;
    world: CANNON.World | null;
    blocks: Block[];
    rings: RingBlock[];
    fallingPieces: FallingPiece[];
    animationId: number | null;
    isInitialized: boolean;
    currentState: 'ready' | 'playing' | 'over';
    currentMode: GameMode;
    groundBody: CANNON.Body | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    world: null,
    blocks: [],
    rings: [],
    fallingPieces: [],
    animationId: null,
    isInitialized: false,
    currentState: 'ready',
    currentMode: 'classic',
    groundBody: null
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

  // Game mode configurations
  const gameModes = [
    {
      id: 'classic' as GameMode,
      name: 'Classic Stack',
      description: 'Traditional tower stacking - blocks slide left/right or forward/back',
      icon: '⬜'
    },
    {
      id: 'physics' as GameMode,
      name: 'Physics C-Rings',
      description: 'C-shaped rings with realistic physics - pieces fall and bounce',
      icon: '⟳'
    },
    {
      id: 'swingArc' as GameMode,
      name: 'Swing Arc',
      description: 'Semi-circular pieces swing like pendulums - time the perfect drop',
      icon: '🌙'
    },
    {
      id: 'spiralDrop' as GameMode,
      name: 'Spiral Drop',
      description: 'Pieces spiral down from above - lock them at the right moment',
      icon: '🌀'
    }
  ];

  useEffect(() => {
    if (!containerRef.current || gameRef.current.isInitialized) return;
    gameRef.current.isInitialized = true;

    console.log("Initializing Enhanced Tower Game...");

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
    scene.fog = new THREE.Fog(0x000800, 30, 100);
    gameRef.current.scene = scene;

    // Setup camera (static position - NO rotation)
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // Fixed camera position - NO animation
    camera.position.set(25, 30, 25);
    camera.lookAt(0, 10, 0);
    gameRef.current.camera = camera;

    // Setup physics world
    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    world.allowSleep = false; // Keep physics always active for all pieces
    gameRef.current.world = world;

    // Create ground physics body
    const groundShape = new CANNON.Box(new CANNON.Vec3(50, 0.5, 50));
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      position: new CANNON.Vec3(0, -0.5, 0),
      type: CANNON.Body.STATIC
    });
    world.addBody(groundBody);
    gameRef.current.groundBody = groundBody;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffcc00, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffff88, 0.6);
    dirLight.position.set(10, 30, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Add grid floor
    const gridHelper = new THREE.GridHelper(50, 25, 0x444400, 0x222200);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Floor mesh
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0a0a0a,
      transparent: true,
      opacity: 0.8
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Helper function to create ring geometry (for C-shaped pieces)
    const createRingGeometry = (innerRadius: number, outerRadius: number, height: number, arcStart: number = 0, arcEnd: number = Math.PI * 1.8) => {
      const shape = new THREE.Shape();
      const segments = 24;
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
      
      // Inner arc
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
        bevelEnabled: false
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, height / 2, 0);
      
      return geometry;
    };

    // Helper function to create arc geometry (for swing arc mode)
    const createArcGeometry = (radius: number, thickness: number, height: number, arcAngle: number = Math.PI) => {
      const shape = new THREE.Shape();
      const segments = 20;
      
      // Outer arc
      for (let i = 0; i <= segments; i++) {
        const angle = -arcAngle/2 + (i / segments) * arcAngle;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      
      // Inner arc
      for (let i = segments; i >= 0; i--) {
        const angle = -arcAngle/2 + (i / segments) * arcAngle;
        shape.lineTo(
          Math.cos(angle) * (radius - thickness),
          Math.sin(angle) * (radius - thickness)
        );
      }
      
      shape.closePath();
      
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, height / 2, 0);
      
      return geometry;
    };

    // Create physics body for pieces
    const createPhysicsBody = (dimensions: any, position: CANNON.Vec3, mass: number = 5) => {
      let shape;
      if (dimensions.type === 'box') {
        shape = new CANNON.Box(new CANNON.Vec3(dimensions.width/2, dimensions.height/2, dimensions.depth/2));
      } else {
        // Approximate complex shapes with boxes
        shape = new CANNON.Box(new CANNON.Vec3(dimensions.width/2, dimensions.height/2, dimensions.depth/2));
      }
      
      const body = new CANNON.Body({
        mass: mass,
        shape: shape,
        position: position,
        material: new CANNON.Material({
          friction: 0.4,
          restitution: 0.3
        })
      });
      
      return body;
    };

    // Add base for physics mode (C-shaped ring on the ground)
    const addPhysicsBase = () => {
      const arcLength = Math.PI * 1.8; // C-shaped
      const geometry = createRingGeometry(3, 7, 2, 0, arcLength);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffaa00,
        emissive: 0xff8800,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 1, 0);
      mesh.rotation.y = Math.PI; // Gap faces camera
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);

      // Create physics body for the base
      const body = createPhysicsBody(
        { type: 'box', width: 8, height: 2, depth: 8 },
        new CANNON.Vec3(0, 1, 0),
        0 // Static mass
      );
      world.addBody(body);

      const firstRing: RingBlock = {
        mesh,
        body,
        innerRadius: 3,
        outerRadius: 7,
        arcStart: 0,
        arcEnd: arcLength,
        angle: Math.PI,
        height: 2,
        position: { x: 0, y: 1, z: 0 },
        isMoving: false
      };
      
      gameRef.current.rings.push(firstRing);
      setTowerHeight(1);
    };

    // Classic mode functions
    const addClassicBlock = () => {
      const blocks = gameRef.current.blocks;
      const lastBlock = blocks[blocks.length - 1];
      const newIndex = blocks.length;
      
      const width = lastBlock ? lastBlock.width : 10;
      const depth = lastBlock ? lastBlock.depth : 10;
      const workingPlane = newIndex % 2 ? 'x' : 'z';
      const workingDimension = workingPlane === 'x' ? 'width' : 'depth';
      
      const geometry = new THREE.BoxGeometry(width, 2, depth);
      const color = new THREE.Color().setHSL((newIndex * 0.1) % 1, 0.7, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const position = {
        x: lastBlock ? lastBlock.position.x : 0,
        y: newIndex * 2.1,
        z: lastBlock ? lastBlock.position.z : 0
      };
      
      if (newIndex > 0) {
        position[workingPlane] = (Math.random() > 0.5 ? -1 : 1) * 12;
      }
      
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const newBlock: Block = {
        mesh,
        width,
        depth,
        direction: newIndex === 0 ? 0 : (0.1 + newIndex * 0.005) * (Math.random() > 0.5 ? 1 : -1),
        speed: 0.1 + newIndex * 0.005,
        position,
        workingPlane,
        workingDimension,
        isMoving: newIndex > 0
      };
      
      blocks.push(newBlock);
      setTowerHeight(blocks.length);
      
      // Move camera up for higher blocks
      if (camera && newIndex > 8) {
        const targetY = 30 + (newIndex - 8) * 2;
        camera.position.y = targetY;
        camera.lookAt(0, targetY - 20, 0);
      }
    };

    // Swing Arc mode functions
    const addSwingArcBlock = () => {
      const blocks = gameRef.current.blocks;
      const lastBlock = blocks[blocks.length - 1];
      const newIndex = blocks.length;
      
      const radius = lastBlock ? Math.min(lastBlock.width, 8) : 8;
      const thickness = 3;
      const arcAngle = Math.PI * 0.6; // 108 degree arc
      
      const geometry = createArcGeometry(radius, thickness, 2, arcAngle);
      const color = new THREE.Color().setHSL((newIndex * 0.15) % 1, 0.8, 0.6);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        metalness: 0.3,
        roughness: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const position = {
        x: 0,
        y: newIndex * 2.2,
        z: 0
      };
      
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const newBlock: Block = {
        mesh,
        width: radius * 2,
        depth: thickness,
        position,
        swingAmplitude: Math.PI * 0.4, // Swing range
        swingSpeed: 0.02 + newIndex * 0.002,
        angle: 0,
        isMoving: newIndex > 0
      };
      
      blocks.push(newBlock);
      setTowerHeight(blocks.length);
    };

    // Spiral Drop mode functions
    const addSpiralDropBlock = () => {
      const blocks = gameRef.current.blocks;
      const lastBlock = blocks[blocks.length - 1];
      const newIndex = blocks.length;
      
      const width = lastBlock ? lastBlock.width : 10;
      const depth = lastBlock ? lastBlock.depth : 10;
      
      const geometry = new THREE.BoxGeometry(width, 2, depth);
      const color = new THREE.Color().setHSL((newIndex * 0.12 + 0.5) % 1, 0.9, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const targetY = newIndex * 2.1;
      const position = {
        x: lastBlock ? lastBlock.position.x : 0,
        y: targetY + 15, // Start high above target
        z: lastBlock ? lastBlock.position.z : 0
      };
      
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const newBlock: Block = {
        mesh,
        width,
        depth,
        position,
        spiralAngle: 0,
        dropSpeed: 0.15,
        angle: 0,
        isMoving: newIndex > 0
      };
      
      blocks.push(newBlock);
      setTowerHeight(blocks.length);
    };

    // Physics mode ring functions
    const addPhysicsRing = () => {
      if (gameRef.current.rings.length === 0) return;
      
      const lastRing = gameRef.current.rings[gameRef.current.rings.length - 1];
      const newIndex = gameRef.current.rings.length;
      
      const arcLength = lastRing.arcEnd - lastRing.arcStart;
      const geometry = createRingGeometry(
        lastRing.innerRadius,
        lastRing.outerRadius,
        2,
        0,
        arcLength
      );
      
      const color = new THREE.Color().setHSL((newIndex * 0.08) % 1, 0.7, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffaa00,
        emissive: color,
        emissiveIntensity: 0.15
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const position = {
        x: 0,
        y: lastRing.position.y + 2.2,
        z: 0
      };
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      
      const newRing: RingBlock = {
        mesh,
        innerRadius: lastRing.innerRadius,
        outerRadius: lastRing.outerRadius,
        arcStart: 0,
        arcEnd: arcLength,
        angle: mesh.rotation.y,
        height: 2,
        position,
        isMoving: true
      };
      
      gameRef.current.rings.push(newRing);
    };

    // Place block functions for different modes
    const placeClassicBlock = () => {
      const blocks = gameRef.current.blocks;
      const currentBlock = blocks[blocks.length - 1];
      if (!currentBlock || !currentBlock.isMoving) return;
      
      currentBlock.isMoving = false;
      
      if (blocks.length === 1) {
        setScore(10);
        setTimeout(() => addClassicBlock(), 200);
        return;
      }
      
      const previousBlock = blocks[blocks.length - 2];
      const overlap = previousBlock[currentBlock.workingDimension!] - 
        Math.abs(currentBlock.position[currentBlock.workingPlane!] - previousBlock.position[currentBlock.workingPlane!]);
      
      if (overlap <= 0) {
        // Missed - create falling physics body
        const body = createPhysicsBody(
          { type: 'box', width: currentBlock.width, height: 2, depth: currentBlock.depth },
          new CANNON.Vec3(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z),
          5
        );
        
        body.velocity.set(
          currentBlock.workingPlane === 'x' ? currentBlock.direction! * 3 : 0,
          -2,
          currentBlock.workingPlane === 'z' ? currentBlock.direction! * 3 : 0
        );
        
        world.addBody(body);
        currentBlock.body = body;
        
        gameRef.current.fallingPieces.push({
          mesh: currentBlock.mesh,
          body: body
        });
        
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Calculate cut
      const cutSize = currentBlock[currentBlock.workingDimension!] - overlap;
      if (cutSize > 0.1) {
        // Create falling piece
        const cutGeometry = new THREE.BoxGeometry(
          currentBlock.workingPlane === 'x' ? cutSize : currentBlock.width,
          2,
          currentBlock.workingPlane === 'z' ? cutSize : currentBlock.depth
        );
        const cutMesh = new THREE.Mesh(cutGeometry, currentBlock.mesh.material.clone());
        
        const cutPosition = {
          x: currentBlock.position.x,
          y: currentBlock.position.y,
          z: currentBlock.position.z
        };
        
        if (currentBlock.position[currentBlock.workingPlane!] > previousBlock.position[currentBlock.workingPlane!]) {
          cutPosition[currentBlock.workingPlane!] += (overlap + cutSize) / 2;
        } else {
          cutPosition[currentBlock.workingPlane!] -= (overlap + cutSize) / 2;
        }
        
        cutMesh.position.set(cutPosition.x, cutPosition.y, cutPosition.z);
        cutMesh.castShadow = true;
        scene.add(cutMesh);
        
        // Add physics to cut piece
        const body = createPhysicsBody(
          { type: 'box', width: cutMesh.geometry.parameters.width, height: 2, depth: cutMesh.geometry.parameters.depth },
          new CANNON.Vec3(cutPosition.x, cutPosition.y, cutPosition.z),
          3
        );
        
        body.velocity.set(
          currentBlock.workingPlane === 'x' ? currentBlock.direction! * 5 : (Math.random() - 0.5),
          -1,
          currentBlock.workingPlane === 'z' ? currentBlock.direction! * 5 : (Math.random() - 0.5)
        );
        
        world.addBody(body);
        gameRef.current.fallingPieces.push({ mesh: cutMesh, body });
        
        // Update current block size
        scene.remove(currentBlock.mesh);
        const newGeometry = new THREE.BoxGeometry(
          currentBlock.workingPlane === 'x' ? overlap : currentBlock.width,
          2,
          currentBlock.workingPlane === 'z' ? overlap : currentBlock.depth
        );
        currentBlock.mesh = new THREE.Mesh(newGeometry, currentBlock.mesh.material);
        currentBlock[currentBlock.workingDimension!] = overlap;
        
        if (currentBlock.position[currentBlock.workingPlane!] < previousBlock.position[currentBlock.workingPlane!]) {
          currentBlock.position[currentBlock.workingPlane!] = previousBlock.position[currentBlock.workingPlane!];
        }
        
        currentBlock.mesh.position.set(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z);
        currentBlock.mesh.castShadow = true;
        currentBlock.mesh.receiveShadow = true;
        scene.add(currentBlock.mesh);
      }
      
      setScore(prev => prev + Math.floor(10 * (overlap / previousBlock[currentBlock.workingDimension!])));
      
      // Check if block is too small
      if (overlap < 1) {
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      setTimeout(() => addClassicBlock(), 200);
    };

    const placeSwingArcBlock = () => {
      const blocks = gameRef.current.blocks;
      const currentBlock = blocks[blocks.length - 1];
      if (!currentBlock || !currentBlock.isMoving) return;
      
      currentBlock.isMoving = false;
      
      if (blocks.length === 1) {
        setScore(10);
        setTimeout(() => addSwingArcBlock(), 200);
        return;
      }
      
      const previousBlock = blocks[blocks.length - 2];
      
      // Calculate overlap based on rotation alignment
      const angleDiff = Math.abs(currentBlock.angle! - (previousBlock.angle || 0));
      const maxOverlap = Math.min(currentBlock.width, previousBlock.width);
      const overlap = maxOverlap * Math.cos(angleDiff);
      
      if (overlap <= maxOverlap * 0.1) {
        // Missed - fall with physics
        const body = createPhysicsBody(
          { type: 'box', width: currentBlock.width, height: 2, depth: currentBlock.depth },
          new CANNON.Vec3(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z),
          5
        );
        
        // Add swing momentum
        const swingVelocity = Math.sin(currentBlock.angle!) * 10;
        body.velocity.set(swingVelocity, -2, 0);
        body.angularVelocity.set(0, 0, currentBlock.angle! * 2);
        
        world.addBody(body);
        currentBlock.body = body;
        
        gameRef.current.fallingPieces.push({
          mesh: currentBlock.mesh,
          body: body
        });
        
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Calculate size reduction
      const newWidth = overlap;
      if (newWidth < currentBlock.width * 0.9) {
        // Create falling pieces for cut portions
        const cutRatio = 1 - (newWidth / currentBlock.width);
        
        // Recreate the arc with smaller radius
        scene.remove(currentBlock.mesh);
        const geometry = createArcGeometry(newWidth / 2, 3, 2, Math.PI * 0.6);
        currentBlock.mesh = new THREE.Mesh(geometry, currentBlock.mesh.material);
        currentBlock.mesh.position.set(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z);
        currentBlock.mesh.rotation.y = currentBlock.angle!;
        currentBlock.mesh.castShadow = true;
        currentBlock.mesh.receiveShadow = true;
        scene.add(currentBlock.mesh);
        currentBlock.width = newWidth;
        
        // Create falling cut pieces
        for (let i = 0; i < 2; i++) {
          const cutGeometry = createArcGeometry(currentBlock.width * cutRatio / 4, 3, 2, Math.PI * 0.3);
          const cutMesh = new THREE.Mesh(cutGeometry, currentBlock.mesh.material.clone());
          const side = i === 0 ? -1 : 1;
          cutMesh.position.set(
            currentBlock.position.x + side * newWidth / 2,
            currentBlock.position.y,
            currentBlock.position.z
          );
          cutMesh.rotation.y = currentBlock.angle! + side * Math.PI/4;
          cutMesh.castShadow = true;
          scene.add(cutMesh);
          
          const body = createPhysicsBody(
            { type: 'box', width: 2, height: 2, depth: 2 },
            new CANNON.Vec3(cutMesh.position.x, cutMesh.position.y, cutMesh.position.z),
            2
          );
          
          body.velocity.set(side * 8, 2, (Math.random() - 0.5) * 3);
          body.angularVelocity.set(
            (Math.random() - 0.5) * 5,
            side * 3,
            (Math.random() - 0.5) * 5
          );
          
          world.addBody(body);
          gameRef.current.fallingPieces.push({ mesh: cutMesh, body });
        }
      }
      
      setScore(prev => prev + Math.floor(15 * (overlap / maxOverlap)));
      
      if (newWidth < 2) {
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      setTimeout(() => addSwingArcBlock(), 200);
    };

    const placeSpiralDropBlock = () => {
      const blocks = gameRef.current.blocks;
      const currentBlock = blocks[blocks.length - 1];
      if (!currentBlock || !currentBlock.isMoving) return;
      
      currentBlock.isMoving = false;
      
      if (blocks.length === 1) {
        setScore(10);
        setTimeout(() => addSpiralDropBlock(), 200);
        return;
      }
      
      const previousBlock = blocks[blocks.length - 2];
      
      // Calculate overlap based on X-Z position
      const xDiff = Math.abs(currentBlock.position.x - previousBlock.position.x);
      const zDiff = Math.abs(currentBlock.position.z - previousBlock.position.z);
      const distance = Math.sqrt(xDiff * xDiff + zDiff * zDiff);
      const maxDistance = Math.sqrt(currentBlock.width * currentBlock.width + currentBlock.depth * currentBlock.depth) / 2;
      
      if (distance > maxDistance * 0.9) {
        // Missed - dramatic spiral fall
        const body = createPhysicsBody(
          { type: 'box', width: currentBlock.width, height: 2, depth: currentBlock.depth },
          new CANNON.Vec3(currentBlock.position.x, currentBlock.position.y, currentBlock.position.z),
          5
        );
        
        // Spiral momentum
        body.velocity.set(
          Math.cos(currentBlock.spiralAngle!) * 5,
          -3,
          Math.sin(currentBlock.spiralAngle!) * 5
        );
        body.angularVelocity.set(0, 5, 0);
        
        world.addBody(body);
        currentBlock.body = body;
        
        gameRef.current.fallingPieces.push({
          mesh: currentBlock.mesh,
          body: body
        });
        
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Calculate size reduction based on overlap
      const overlapRatio = 1 - (distance / maxDistance);
      const newWidth = currentBlock.width * (0.5 + overlapRatio * 0.5);
      const newDepth = currentBlock.depth * (0.5 + overlapRatio * 0.5);
      
      if (overlapRatio < 0.9) {
        // Create spiral falling pieces
        scene.remove(currentBlock.mesh);
        const newGeometry = new THREE.BoxGeometry(newWidth, 2, newDepth);
        currentBlock.mesh = new THREE.Mesh(newGeometry, currentBlock.mesh.material);
        currentBlock.mesh.position.set(
          previousBlock.position.x,
          currentBlock.position.y,
          previousBlock.position.z
        );
        currentBlock.position.x = previousBlock.position.x;
        currentBlock.position.z = previousBlock.position.z;
        currentBlock.mesh.castShadow = true;
        currentBlock.mesh.receiveShadow = true;
        scene.add(currentBlock.mesh);
        
        // Create spiraling cut pieces
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + currentBlock.spiralAngle!;
          const cutGeometry = new THREE.BoxGeometry(
            (currentBlock.width - newWidth) / 2,
            2,
            (currentBlock.depth - newDepth) / 2
          );
          const cutMesh = new THREE.Mesh(cutGeometry, currentBlock.mesh.material.clone());
          cutMesh.position.set(
            currentBlock.position.x + Math.cos(angle) * newWidth/2,
            currentBlock.position.y,
            currentBlock.position.z + Math.sin(angle) * newDepth/2
          );
          cutMesh.castShadow = true;
          scene.add(cutMesh);
          
          const body = createPhysicsBody(
            { type: 'box', width: cutGeometry.parameters.width, height: 2, depth: cutGeometry.parameters.depth },
            new CANNON.Vec3(cutMesh.position.x, cutMesh.position.y, cutMesh.position.z),
            2
          );
          
          // Dramatic spiral effect
          body.velocity.set(
            Math.cos(angle) * 10,
            -2,
            Math.sin(angle) * 10
          );
          body.angularVelocity.set(
            (Math.random() - 0.5) * 10,
            10,
            (Math.random() - 0.5) * 10
          );
          
          world.addBody(body);
          gameRef.current.fallingPieces.push({ mesh: cutMesh, body });
        }
        
        currentBlock.width = newWidth;
        currentBlock.depth = newDepth;
      }
      
      setScore(prev => prev + Math.floor(20 * overlapRatio));
      
      if (newWidth < 2 || newDepth < 2) {
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      setTimeout(() => addSpiralDropBlock(), 200);
    };

    const placePhysicsRing = () => {
      const rings = gameRef.current.rings;
      const currentRing = rings[rings.length - 1];
      if (!currentRing || !currentRing.isMoving) return;
      
      currentRing.isMoving = false;
      
      if (rings.length === 1) {
        // First player ring placed
        setScore(10);
        setTimeout(() => addPhysicsRing(), 200);
        return;
      }
      
      const previousRing = rings[rings.length - 2];
      
      // Calculate overlap
      const angleDiff = Math.abs(currentRing.angle - previousRing.angle);
      const normalizedDiff = angleDiff % (Math.PI * 2);
      const effectiveDiff = Math.min(normalizedDiff, Math.PI * 2 - normalizedDiff);
      
      const maxArc = currentRing.arcEnd - currentRing.arcStart;
      const overlapArc = maxArc * Math.max(0, 1 - effectiveDiff / Math.PI);
      
      if (overlapArc < maxArc * 0.1) {
        // Missed - entire ring falls
        const body = createPhysicsBody(
          { type: 'box', width: 8, height: 2, depth: 8 },
          new CANNON.Vec3(currentRing.position.x, currentRing.position.y, currentRing.position.z),
          8
        );
        
        body.velocity.set(
          (Math.random() - 0.5) * 5,
          -1,
          (Math.random() - 0.5) * 5
        );
        body.angularVelocity.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        );
        
        world.addBody(body);
        currentRing.body = body;
        
        gameRef.current.fallingPieces.push({
          mesh: currentRing.mesh,
          body: body
        });
        
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      if (overlapArc < maxArc * 0.95) {
        // Partial overlap - cut the ring
        scene.remove(currentRing.mesh);
        
        const newGeometry = createRingGeometry(
          currentRing.innerRadius,
          currentRing.outerRadius,
          2,
          0,
          overlapArc
        );
        
        currentRing.mesh = new THREE.Mesh(newGeometry, currentRing.mesh.material);
        currentRing.mesh.position.set(
          currentRing.position.x,
          currentRing.position.y,
          currentRing.position.z
        );
        currentRing.mesh.rotation.y = previousRing.angle;
        currentRing.angle = previousRing.angle;
        currentRing.arcEnd = overlapArc;
        currentRing.mesh.castShadow = true;
        currentRing.mesh.receiveShadow = true;
        scene.add(currentRing.mesh);
        
        // Create falling cut pieces
        const cutArc = maxArc - overlapArc;
        if (cutArc > 0.2) {
          for (let i = 0; i < 2; i++) {
            const pieceArc = cutArc / 2;
            const pieceGeometry = createRingGeometry(
              currentRing.innerRadius,
              currentRing.outerRadius,
              2,
              0,
              pieceArc
            );
            const pieceMesh = new THREE.Mesh(pieceGeometry, currentRing.mesh.material.clone());
            const angleOffset = overlapArc + i * pieceArc;
            pieceMesh.position.set(
              currentRing.position.x,
              currentRing.position.y,
              currentRing.position.z
            );
            pieceMesh.rotation.y = currentRing.angle + angleOffset;
            pieceMesh.castShadow = true;
            scene.add(pieceMesh);
            
            const body = createPhysicsBody(
              { type: 'box', width: 4, height: 2, depth: 2 },
              new CANNON.Vec3(
                currentRing.position.x + Math.cos(angleOffset) * 5,
                currentRing.position.y,
                currentRing.position.z + Math.sin(angleOffset) * 5
              ),
              3
            );
            
            body.velocity.set(
              Math.cos(angleOffset) * 8,
              2,
              Math.sin(angleOffset) * 8
            );
            body.angularVelocity.set(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            );
            
            world.addBody(body);
            gameRef.current.fallingPieces.push({ mesh: pieceMesh, body });
          }
        }
      }
      
      setScore(prev => prev + Math.floor(15 * (overlapArc / maxArc)));
      setTowerHeight(rings.length);
      
      if (overlapArc < 0.5) {
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      setTimeout(() => addPhysicsRing(), 200);
    };

    // Main game actions
    gameActionsRef.current.startGame = () => {
      console.log(`Starting game in ${gameRef.current.currentMode} mode...`);
      setScore(0);
      setTowerHeight(0);
      
      // Clear everything
      gameRef.current.blocks.forEach(block => {
        scene.remove(block.mesh);
        if (block.body) world.removeBody(block.body);
      });
      gameRef.current.blocks = [];
      
      gameRef.current.rings.forEach(ring => {
        scene.remove(ring.mesh);
        if (ring.body) world.removeBody(ring.body);
      });
      gameRef.current.rings = [];
      
      gameRef.current.fallingPieces.forEach(piece => {
        scene.remove(piece.mesh);
        world.removeBody(piece.body);
      });
      gameRef.current.fallingPieces = [];
      
      // Reset camera to fixed position
      camera.position.set(25, 30, 25);
      camera.lookAt(0, 10, 0);
      
      // Add first block/ring based on mode
      switch (gameRef.current.currentMode) {
        case 'classic':
          addClassicBlock();
          break;
        case 'physics':
          addPhysicsBase();
          setTimeout(() => addPhysicsRing(), 100);
          break;
        case 'swingArc':
          addSwingArcBlock();
          break;
        case 'spiralDrop':
          addSpiralDropBlock();
          break;
      }
      
      gameRef.current.currentState = 'playing';
      setGameState('playing');
    };

    gameActionsRef.current.placeBlock = () => {
      switch (gameRef.current.currentMode) {
        case 'classic':
          placeClassicBlock();
          break;
        case 'physics':
          placePhysicsRing();
          break;
        case 'swingArc':
          placeSwingArcBlock();
          break;
        case 'spiralDrop':
          placeSpiralDropBlock();
          break;
      }
    };

    gameActionsRef.current.restartGame = () => {
      // Clear all objects
      gameRef.current.blocks.forEach(block => {
        scene.remove(block.mesh);
        if (block.body) world.removeBody(block.body);
      });
      gameRef.current.blocks = [];
      
      gameRef.current.rings.forEach(ring => {
        scene.remove(ring.mesh);
        if (ring.body) world.removeBody(ring.body);
      });
      gameRef.current.rings = [];
      
      gameRef.current.fallingPieces.forEach(piece => {
        scene.remove(piece.mesh);
        world.removeBody(piece.body);
      });
      gameRef.current.fallingPieces = [];
      
      // Reset camera
      camera.position.set(25, 30, 25);
      camera.lookAt(0, 10, 0);
      
      gameRef.current.currentState = 'ready';
      setGameState('ready');
      setScore(0);
      setTowerHeight(0);
    };

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const deltaTime = clock.getDelta();
      
      // Update physics
      if (world) {
        world.step(1/60, deltaTime, 3);
        
        // Update falling pieces from physics
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
        
        // Update physics for placed blocks/rings that have bodies
        gameRef.current.blocks.forEach(block => {
          if (block.body && !block.isMoving) {
            block.mesh.position.copy(block.body.position as any);
            block.mesh.quaternion.copy(block.body.quaternion as any);
          }
        });
        
        gameRef.current.rings.forEach(ring => {
          if (ring.body && !ring.isMoving) {
            ring.mesh.position.copy(ring.body.position as any);
            ring.mesh.quaternion.copy(ring.body.quaternion as any);
          }
        });
      }
      
      // Mode-specific animations
      switch (gameRef.current.currentMode) {
        case 'classic':
          // Animate sliding blocks
          gameRef.current.blocks.forEach(block => {
            if (block.isMoving && block.workingPlane) {
              block.position[block.workingPlane] += block.direction!;
              if (Math.abs(block.position[block.workingPlane]) > 12) {
                block.direction! *= -1;
              }
              block.mesh.position[block.workingPlane] = block.position[block.workingPlane];
            }
          });
          break;
          
        case 'physics':
          // Rotate moving rings (no camera rotation)
          gameRef.current.rings.forEach(ring => {
            if (ring.isMoving) {
              ring.angle += 0.02;
              ring.mesh.rotation.y = ring.angle;
            }
          });
          break;
          
        case 'swingArc':
          // Animate swinging arcs
          gameRef.current.blocks.forEach(block => {
            if (block.isMoving) {
              block.angle! += block.swingSpeed!;
              const swing = Math.sin(block.angle!) * block.swingAmplitude!;
              block.mesh.rotation.y = swing;
            }
          });
          break;
          
        case 'spiralDrop':
          // Animate spiral descent
          gameRef.current.blocks.forEach(block => {
            if (block.isMoving) {
              block.spiralAngle! += 0.05;
              const targetY = (gameRef.current.blocks.indexOf(block)) * 2.1;
              
              // Spiral motion
              const radius = 3;
              block.position.x = Math.cos(block.spiralAngle!) * radius;
              block.position.z = Math.sin(block.spiralAngle!) * radius;
              
              // Drop motion
              if (block.position.y > targetY) {
                block.position.y -= block.dropSpeed!;
              }
              
              block.mesh.position.set(block.position.x, block.position.y, block.position.z);
              block.mesh.rotation.y = block.spiralAngle!;
            }
          });
          break;
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
        gameActionsRef.current.placeBlock();
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

  // Handle mode changes
  const handleModeChange = (newMode: GameMode) => {
    setSelectedMode(newMode);
    gameRef.current.currentMode = newMode;
    gameActionsRef.current.restartGame();
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Mode selector */}
      <div className="absolute top-4 right-4 z-30 bg-black/90 border border-yellow-400/30 rounded-lg p-2">
        <div className="text-xs text-yellow-400 mb-2 uppercase tracking-wider">Game Mode:</div>
        <div className="flex gap-2">
          {gameModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`px-3 py-2 text-xs rounded transition-all ${
                selectedMode === mode.id
                  ? 'bg-yellow-500/30 border border-yellow-400 text-yellow-400'
                  : 'bg-gray-800/50 border border-gray-600 text-gray-400 hover:border-yellow-500/50'
              }`}
              title={mode.description}
            >
              <div className="text-lg mb-1">{mode.icon}</div>
              <div>{mode.name}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Score & Height display */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <div className="bg-black/90 border-2 border-yellow-400/60 px-4 py-2" style={{
          boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)',
          fontFamily: 'monospace'
        }}>
          <div className="text-xl text-green-400">
            SCORE: <span className="text-yellow-400 font-bold text-2xl">{score.toString().padStart(6, '0')}</span>
          </div>
        </div>
        
        <div className="bg-black/90 border-2 border-blue-400/60 px-4 py-2" style={{
          boxShadow: '0 0 20px rgba(0, 150, 255, 0.3)',
          fontFamily: 'monospace'
        }}>
          <div className="text-lg text-blue-400">
            HEIGHT: {towerHeight}
          </div>
        </div>
      </div>

      {/* Game canvas */}
      <div ref={containerRef} className="w-full h-full">
        {/* Game UI overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4" style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(255, 204, 0, 0.6)'
              }}>TOWER BUILDER</h2>
              <p className="text-gray-400 mb-8">Select a mode above, then click to start</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-black/80 border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-xl font-bold hover:bg-yellow-400/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 204, 0, 0.4)'
                }}
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="bg-black/90 border border-green-400/60 px-6 py-2 rounded" style={{
              fontFamily: 'monospace',
              boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)'
            }}>
              <span className="text-green-400 uppercase">SPACE / CLICK TO PLACE</span>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-red-500 mb-4" style={{
                fontFamily: 'monospace',
                textShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
              }}>GAME OVER</h2>
              <p className="text-yellow-400 text-2xl mb-2">FINAL SCORE: {score}</p>
              <p className="text-blue-400 mb-8">MAX HEIGHT: {towerHeight}</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-black/80 border-2 border-red-500 text-red-500 px-8 py-4 text-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)'
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