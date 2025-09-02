"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Block {
  mesh: THREE.Mesh;
  width: number;
  depth: number;
  direction: number;
  speed: number;
  position: { x: number; y: number; z: number };
  workingPlane: 'x' | 'z';
  workingDimension: 'width' | 'depth';
}

export default function BlockGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  
  const gameRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.OrthographicCamera | null;
    blocks: Block[];
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

  // Game functions that will be called from UI
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

    console.log("Initializing Block Game...");

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    gameRef.current.renderer = renderer;

    // Setup scene
    const scene = new THREE.Scene();
    gameRef.current.scene = scene;

    // Setup camera
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

    // Add lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Helper functions
    const addBaseBlock = () => {
      const geometry = new THREE.BoxGeometry(10, 2, 10);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x806000,
        emissive: 0x201500,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 1, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);
      
      const baseBlock: Block = {
        mesh,
        width: 10,
        depth: 10,
        direction: 0,
        speed: 0,
        position: { x: 0, y: 1, z: 0 },
        workingPlane: 'x',
        workingDimension: 'width'
      };
      
      gameRef.current.blocks.push(baseBlock);
    };

    const addBlock = () => {
      if (gameRef.current.blocks.length === 0) return;
      
      const lastBlock = gameRef.current.blocks[gameRef.current.blocks.length - 1];
      const newIndex = gameRef.current.blocks.length;
      
      // Alternate between x and z plane
      const workingPlane: 'x' | 'z' = newIndex % 2 === 0 ? 'x' : 'z';
      const workingDimension = workingPlane === 'x' ? 'width' : 'depth';
      
      // Create new block
      const geometry = new THREE.BoxGeometry(lastBlock.width, 2, lastBlock.depth);
      const color = new THREE.Color().setHSL((newIndex * 0.1) % 1, 0.7, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position
      const position = {
        x: lastBlock.position.x,
        y: lastBlock.position.y + 2,
        z: lastBlock.position.z
      };
      
      // Start from side
      position[workingPlane] = workingPlane === 'x' ? -15 : 15;
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);
      
      const newBlock: Block = {
        mesh,
        width: lastBlock.width,
        depth: lastBlock.depth,
        direction: workingPlane === 'x' ? 0.3 : -0.3,
        speed: 0.3,
        position,
        workingPlane,
        workingDimension
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
      console.log("Starting game...");
      setScore(0);
      
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
      
      // Calculate overlap
      const delta = currentBlock.position[currentBlock.workingPlane] - 
                    previousBlock.position[currentBlock.workingPlane];
      const overlap = previousBlock[currentBlock.workingDimension] - Math.abs(delta);
      
      if (overlap <= 0) {
        // Missed completely - game over
        gameRef.current.currentState = 'over';
        setGameState('over');
        return;
      }
      
      // Calculate new dimensions
      const newDimension = overlap;
      const hangover = currentBlock[currentBlock.workingDimension] - overlap;
      
      if (hangover > 0.1) {
        // Update current block dimensions
        currentBlock[currentBlock.workingDimension] = newDimension;
        
        // Update position if needed
        if (delta > 0) {
          currentBlock.position[currentBlock.workingPlane] -= hangover / 2;
        } else if (delta < 0) {
          currentBlock.position[currentBlock.workingPlane] += hangover / 2;
        }
        
        // Recreate mesh with new dimensions
        scene.remove(currentBlock.mesh);
        const geometry = new THREE.BoxGeometry(
          currentBlock.width,
          2,
          currentBlock.depth
        );
        currentBlock.mesh = new THREE.Mesh(geometry, currentBlock.mesh.material);
        currentBlock.mesh.position.set(
          currentBlock.position.x,
          currentBlock.position.y,
          currentBlock.position.z
        );
        currentBlock.mesh.castShadow = true;
        currentBlock.mesh.receiveShadow = true;
        scene.add(currentBlock.mesh);
        
        // Create falling piece
        const fallingGeometry = new THREE.BoxGeometry(
          currentBlock.workingPlane === 'x' ? hangover : currentBlock.width,
          2,
          currentBlock.workingPlane === 'z' ? hangover : currentBlock.depth
        );
        const fallingMesh = new THREE.Mesh(fallingGeometry, currentBlock.mesh.material.clone());
        const fallingPosition = { ...currentBlock.position };
        
        if (delta > 0) {
          fallingPosition[currentBlock.workingPlane] += (newDimension + hangover) / 2;
        } else {
          fallingPosition[currentBlock.workingPlane] -= (newDimension + hangover) / 2;
        }
        
        fallingMesh.position.set(fallingPosition.x, fallingPosition.y, fallingPosition.z);
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
      
      // Update score
      setScore(prev => prev + 1);
      
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
    };

    // Add initial base block
    addBaseBlock();

    // Animation loop
    const animate = () => {
      // Update moving blocks
      const currentBlock = gameRef.current.blocks[gameRef.current.blocks.length - 1];
      if (currentBlock && currentBlock.direction !== 0) {
        currentBlock.position[currentBlock.workingPlane] += currentBlock.direction;
        
        // Reverse direction at bounds
        if (Math.abs(currentBlock.position[currentBlock.workingPlane]) > 15) {
          currentBlock.direction = -currentBlock.direction;
        }
        
        currentBlock.mesh.position[currentBlock.workingPlane] = currentBlock.position[currentBlock.workingPlane];
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
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Score display */}
      <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur px-4 py-2 rounded-lg">
        <div className="text-xl text-white">Score: <span className="text-yellow-400 font-bold text-2xl">{score}</span></div>
      </div>

      {/* Game canvas */}
      <div ref={containerRef} className="flex-1 relative">
        {/* Game UI overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">Block Tower</h2>
              <p className="text-white mb-8">Stack the blocks as high as you can!</p>
              <button
                onClick={() => gameActionsRef.current.startGame()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-lg text-xl font-bold"
              >
                Start Game
              </button>
              <p className="text-gray-400 mt-4">Click or press Space to place blocks</p>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-center pointer-events-none">
            Click or press Space to place the block
          </div>
        )}

        {gameState === 'over' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <div className="text-center pointer-events-auto">
              <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over!</h2>
              <p className="text-white text-2xl mb-8">Final Score: {score}</p>
              <button
                onClick={() => gameActionsRef.current.restartGame()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-lg text-xl font-bold"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}