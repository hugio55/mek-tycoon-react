'use client';

import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Physics/physicsEngineComponent';
import * as CANNON from 'cannon';
import { CannonJSPlugin } from '@babylonjs/core/Physics/Plugins/cannonJSPlugin';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

// Shape configurations with enhanced visual properties
const SHAPE_CONFIGS = {
  circle: {
    name: 'Circle Clear',
    icon: '⭕',
    color: new Color3(0.4, 0.8, 1),
    glowIntensity: 1.5,
    particleColor1: new Color4(0.4, 0.8, 1, 1),
    particleColor2: new Color4(0.2, 0.6, 1, 0.8),
    difficulty: 'Easy',
    timeLimit: 30,
    targetPercentage: 85,
    particleDensity: 0.8,
    radius: 2
  },
  square: {
    name: 'Square Sweep',
    icon: '⬜',
    color: new Color3(1, 0.8, 0.2),
    glowIntensity: 1.8,
    particleColor1: new Color4(1, 0.9, 0.4, 1),
    particleColor2: new Color4(1, 0.7, 0, 0.8),
    difficulty: 'Easy',
    timeLimit: 35,
    targetPercentage: 90,
    particleDensity: 0.9,
    size: 1.8
  },
  triangle: {
    name: 'Triangle Tackle',
    icon: '🔺',
    color: new Color3(1, 0.4, 0.4),
    glowIntensity: 2,
    particleColor1: new Color4(1, 0.6, 0.6, 1),
    particleColor2: new Color4(1, 0.3, 0.3, 0.8),
    difficulty: 'Medium',
    timeLimit: 25,
    targetPercentage: 80,
    particleDensity: 0.7,
    size: 2
  },
  hexagon: {
    name: 'Hexagon Hunt',
    icon: '⬡',
    color: new Color3(0.8, 0.3, 1),
    glowIntensity: 2.2,
    particleColor1: new Color4(0.8, 0.3, 1, 1),
    particleColor2: new Color4(0.6, 0.1, 0.8, 0.8),
    difficulty: 'Medium',
    timeLimit: 40,
    targetPercentage: 85,
    particleDensity: 0.85,
    size: 1.8
  },
  star: {
    name: 'Star Scatter',
    icon: '⭐',
    color: new Color3(1, 1, 0.2),
    glowIntensity: 2.5,
    particleColor1: new Color4(1, 1, 0.4, 1),
    particleColor2: new Color4(1, 0.8, 0, 0.8),
    difficulty: 'Hard',
    timeLimit: 35,
    targetPercentage: 75,
    particleDensity: 0.75,
    outerRadius: 2,
    innerRadius: 0.8
  },
  heart: {
    name: 'Heart Harvest',
    icon: '❤️',
    color: new Color3(1, 0.2, 0.5),
    glowIntensity: 2,
    particleColor1: new Color4(1, 0.4, 0.6, 1),
    particleColor2: new Color4(1, 0.1, 0.3, 0.8),
    difficulty: 'Hard',
    timeLimit: 40,
    targetPercentage: 80,
    particleDensity: 0.8,
    size: 2
  }
};

type ShapeType = keyof typeof SHAPE_CONFIGS;

export default function ShapeKnockdown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const [currentShape, setCurrentShape] = useState<ShapeType>('circle');
  const [particlesCleared, setParticlesCleared] = useState(0);
  const [totalParticles, setTotalParticles] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [hitWall, setHitWall] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Store shape particles and effects
  const shapeParticlesRef = useRef<{ mesh: BABYLON.Mesh; destroyed: boolean }[]>([]);
  const wallMeshRef = useRef<BABYLON.Mesh | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const trailParticlesRef = useRef<ParticleSystem[]>([]);
  const glowLayerRef = useRef<GlowLayer | null>(null);
  const pipelineRef = useRef<DefaultRenderingPipeline | null>(null);
  const ambientParticlesRef = useRef<ParticleSystem | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const drawingPathRef = useRef<Vector3[]>([]);
  const lastValidPositionRef = useRef<Vector3 | null>(null);

  // Check if point is inside shape
  const isPointInsideShape = (point: Vector3, shape: ShapeType): boolean => {
    const config = SHAPE_CONFIGS[shape];
    
    switch (shape) {
      case 'circle':
        return point.length() <= config.radius;
      
      case 'square':
        return Math.abs(point.x) <= config.size && Math.abs(point.y) <= config.size;
      
      case 'triangle': {
        const height = config.size * Math.sqrt(3) / 2;
        const v1 = new Vector3(0, config.size, 0);
        const v2 = new Vector3(-config.size, -height, 0);
        const v3 = new Vector3(config.size, -height, 0);
        
        // Barycentric coordinates
        const denominator = ((v2.y - v3.y)*(v1.x - v3.x) + (v3.x - v2.x)*(v1.y - v3.y));
        const a = ((v2.y - v3.y)*(point.x - v3.x) + (v3.x - v2.x)*(point.y - v3.y)) / denominator;
        const b = ((v3.y - v1.y)*(point.x - v3.x) + (v1.x - v3.x)*(point.y - v3.y)) / denominator;
        const c = 1 - a - b;
        
        return a >= 0 && b >= 0 && c >= 0;
      }
      
      case 'hexagon': {
        const angle = Math.atan2(point.y, point.x);
        const radius = point.length();
        const sectorAngle = Math.PI / 3;
        const nearestVertex = Math.round(angle / sectorAngle) * sectorAngle;
        const localAngle = Math.abs(angle - nearestVertex);
        const maxRadius = config.size / Math.cos(localAngle);
        return radius <= Math.min(maxRadius, config.size);
      }
      
      case 'star': {
        const angle = Math.atan2(point.y, point.x) + Math.PI;
        const radius = point.length();
        const sectorAngle = Math.PI / 5;
        const sectorPhase = (angle % (2 * sectorAngle)) / sectorAngle;
        
        let maxRadius;
        if (sectorPhase <= 1) {
          maxRadius = config.innerRadius + (config.outerRadius - config.innerRadius) * sectorPhase;
        } else {
          maxRadius = config.outerRadius - (config.outerRadius - config.innerRadius) * (sectorPhase - 1);
        }
        
        return radius <= maxRadius;
      }
      
      case 'heart': {
        const x = point.x / config.size;
        const y = point.y / config.size;
        
        // Heart shape equation
        const heartEq = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
        return heartEq <= 0;
      }
      
      default:
        return false;
    }
  };

  // Create shape outline for walls
  const createShapeOutline = (shape: ShapeType, scene: BABYLON.Scene): Vector3[] => {
    const points: Vector3[] = [];
    const config = SHAPE_CONFIGS[shape];
    
    switch (shape) {
      case 'circle':
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          points.push(new Vector3(
            Math.cos(angle) * config.radius,
            Math.sin(angle) * config.radius,
            0
          ));
        }
        break;
      
      case 'square':
        points.push(new Vector3(-config.size, -config.size, 0));
        points.push(new Vector3(config.size, -config.size, 0));
        points.push(new Vector3(config.size, config.size, 0));
        points.push(new Vector3(-config.size, config.size, 0));
        points.push(new Vector3(-config.size, -config.size, 0));
        break;
      
      case 'triangle': {
        const height = config.size * Math.sqrt(3) / 2;
        points.push(new Vector3(0, config.size, 0));
        points.push(new Vector3(-config.size, -height, 0));
        points.push(new Vector3(config.size, -height, 0));
        points.push(new Vector3(0, config.size, 0));
        break;
      }
      
      case 'hexagon':
        for (let i = 0; i <= 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          points.push(new Vector3(
            Math.cos(angle) * config.size,
            Math.sin(angle) * config.size,
            0
          ));
        }
        break;
      
      case 'star':
        for (let i = 0; i <= 10; i++) {
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const radius = i % 2 === 0 ? config.outerRadius : config.innerRadius;
          points.push(new Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          ));
        }
        break;
      
      case 'heart': {
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
          points.push(new Vector3(x / 10 * config.size, y / 10 * config.size, 0));
        }
        break;
      }
    }
    
    return points;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Babylon.js with optimized settings
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
    engineRef.current = engine;
    engine.setHardwareScalingLevel(1);

    // Create scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0, 0, 0.05, 1);

    // Camera setup - same angle as SpellCasterBabylon
    const camera = new BABYLON.UniversalCamera('camera', new Vector3(0, 0, -5), scene);
    camera.setTarget(Vector3.Zero());
    cameraRef.current = camera;

    // Enable physics
    const gravityVector = new Vector3(0, -20, 0);
    scene.enablePhysics(gravityVector, new CannonJSPlugin(true, 10, CANNON));

    // Enhanced lighting - same as SpellCasterBabylon
    const light1 = new BABYLON.HemisphericLight('light1', new Vector3(0, 1, 0), scene);
    light1.intensity = 0.4;
    light1.diffuse = new Color3(0.8, 0.8, 1);
    
    const light2 = new BABYLON.DirectionalLight('light2', new Vector3(0, -1, 1), scene);
    light2.intensity = 0.5;
    light2.diffuse = new Color3(1, 0.9, 0.8);

    const pointLight1 = new BABYLON.PointLight('pointLight1', new Vector3(-3, 2, 0), scene);
    pointLight1.diffuse = new Color3(0.5, 0.7, 1);
    pointLight1.intensity = 0.3;

    const pointLight2 = new BABYLON.PointLight('pointLight2', new Vector3(3, 2, 0), scene);
    pointLight2.diffuse = new Color3(1, 0.7, 0.5);
    pointLight2.intensity = 0.3;

    // Create floor with better material
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 12,
      height: 12
    }, scene);
    ground.position.y = -3.5;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.4, friction: 0.6 },
      scene
    );
    
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.05, 0.05, 0.1);
    groundMat.specularColor = new Color3(0.1, 0.1, 0.2);
    groundMat.emissiveColor = new Color3(0.02, 0.02, 0.05);
    ground.material = groundMat;

    // Add glow layer for enhanced visuals
    const glowLayer = new GlowLayer('glow', scene, {
      mainTextureFixedSize: 512,
      blurKernelSize: 64
    });
    glowLayer.intensity = 1.2;
    glowLayerRef.current = glowLayer;

    // Add post-processing pipeline
    const pipeline = new DefaultRenderingPipeline(
      'defaultPipeline',
      true,
      scene,
      [camera]
    );
    
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.8;
    pipeline.bloomWeight = 0.5;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.exposure = 1.2;
    pipeline.imageProcessing.contrast = 1.3;
    pipeline.imageProcessing.toneMappingEnabled = true;
    
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 2;
    pipeline.imageProcessing.vignetteFOV = 0.5;
    pipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0.1, 1);
    
    pipelineRef.current = pipeline;

    // Create ambient particle system for atmosphere
    const ambientParticles = new ParticleSystem('ambientParticles', 200, scene);
    ambientParticles.particleTexture = new Texture('', scene);
    ambientParticles.emitter = Vector3.Zero();
    ambientParticles.minEmitBox = new Vector3(-5, -3, -2);
    ambientParticles.maxEmitBox = new Vector3(5, 3, 2);
    
    ambientParticles.color1 = new Color4(0.5, 0.7, 1, 0.3);
    ambientParticles.color2 = new Color4(1, 0.7, 0.5, 0.2);
    ambientParticles.colorDead = new Color4(0, 0, 0, 0);
    
    ambientParticles.minSize = 0.01;
    ambientParticles.maxSize = 0.05;
    ambientParticles.minLifeTime = 5;
    ambientParticles.maxLifeTime = 10;
    
    ambientParticles.emitRate = 10;
    ambientParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    
    ambientParticles.direction1 = new Vector3(-0.1, 0.1, 0);
    ambientParticles.direction2 = new Vector3(0.1, 0.2, 0);
    ambientParticles.minEmitPower = 0.01;
    ambientParticles.maxEmitPower = 0.05;
    
    ambientParticles.start();
    ambientParticlesRef.current = ambientParticles;

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Enhanced input handling
    let isLocalDrawing = false;

    const getPointerPosition = (event: PointerEvent | Touch): Vector3 => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return new Vector3(x * 2, y * 2, 0);
    };

    const startDrawing = (pos: Vector3) => {
      // Check if position is inside shape
      if (!isPointInsideShape(pos, currentShape)) {
        setHitWall(true);
        setTimeout(() => setHitWall(false), 500);
        return;
      }
      
      isLocalDrawing = true;
      setIsDrawing(true);
      drawingPathRef.current = [pos];
      lastValidPositionRef.current = pos;
      
      if (!gameStarted) {
        setGameStarted(true);
        startTimer();
      }
      
      // Create enhanced particle system for erasing
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }
      
      const config = SHAPE_CONFIGS[currentShape];
      const particleSystem = new ParticleSystem('particles', 1000, scene);
      
      const particleTexture = new Texture('', scene);
      particleSystem.particleTexture = particleTexture;
      
      particleSystem.emitter = pos.clone();
      
      particleSystem.color1 = config.particleColor1;
      particleSystem.color2 = config.particleColor2;
      particleSystem.colorDead = new Color4(0, 0, 0, 0);
      
      particleSystem.minSize = 0.02;
      particleSystem.maxSize = 0.2;
      
      particleSystem.minLifeTime = 0.2;
      particleSystem.maxLifeTime = 1;
      
      particleSystem.emitRate = 200;
      
      particleSystem.minEmitPower = 0.05;
      particleSystem.maxEmitPower = 0.5;
      particleSystem.updateSpeed = 0.01;
      
      particleSystem.direction1 = new Vector3(-0.3, -0.3, -0.3);
      particleSystem.direction2 = new Vector3(0.3, 0.3, 0.3);
      
      particleSystem.gravity = new Vector3(0, -0.5, 0);
      
      particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
      
      particleSystem.start();
      particleSystemRef.current = particleSystem;
    };

    const draw = (pos: Vector3) => {
      if (!isLocalDrawing) return;

      // Check if still inside shape
      if (!isPointInsideShape(pos, currentShape)) {
        // Hit the wall - stop drawing
        isLocalDrawing = false;
        setIsDrawing(false);
        setHitWall(true);
        
        // Stop particle system
        if (particleSystemRef.current) {
          particleSystemRef.current.stop();
          setTimeout(() => {
            if (particleSystemRef.current) {
              particleSystemRef.current.dispose();
              particleSystemRef.current = null;
            }
          }, 1500);
        }
        
        // Visual feedback for hitting wall
        const config = SHAPE_CONFIGS[currentShape];
        const wallFlash = new ParticleSystem('wallFlash', 100, scene);
        wallFlash.particleTexture = new Texture('', scene);
        wallFlash.emitter = lastValidPositionRef.current || pos;
        
        wallFlash.color1 = new Color4(1, 0, 0, 1);
        wallFlash.color2 = new Color4(1, 0.5, 0, 0.5);
        wallFlash.colorDead = new Color4(0, 0, 0, 0);
        
        wallFlash.minSize = 0.1;
        wallFlash.maxSize = 0.3;
        wallFlash.minLifeTime = 0.3;
        wallFlash.maxLifeTime = 0.6;
        
        wallFlash.emitRate = 1000;
        wallFlash.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        wallFlash.direction1 = new Vector3(-1, -1, -1);
        wallFlash.direction2 = new Vector3(1, 1, 1);
        wallFlash.minEmitPower = 2;
        wallFlash.maxEmitPower = 4;
        
        wallFlash.start();
        
        setTimeout(() => {
          wallFlash.stop();
          setTimeout(() => wallFlash.dispose(), 1000);
        }, 100);
        
        // Reset combo
        setCombo(0);
        
        setTimeout(() => setHitWall(false), 1000);
        return;
      }

      drawingPathRef.current.push(pos);
      lastValidPositionRef.current = pos;
      
      // Update particle emitter position
      if (particleSystemRef.current) {
        particleSystemRef.current.emitter = pos.clone();
      }

      // Create trail particles for extra visual impact
      const config = SHAPE_CONFIGS[currentShape];
      const trailParticle = new ParticleSystem('trail', 50, scene);
      trailParticle.particleTexture = new Texture('', scene);
      trailParticle.emitter = pos.clone();
      
      trailParticle.color1 = config.particleColor1;
      trailParticle.color2 = new Color4(config.particleColor2.r, config.particleColor2.g, config.particleColor2.b, 0);
      
      trailParticle.minSize = 0.1;
      trailParticle.maxSize = 0.3;
      trailParticle.minLifeTime = 0.5;
      trailParticle.maxLifeTime = 1;
      
      trailParticle.emitRate = 30;
      trailParticle.blendMode = ParticleSystem.BLENDMODE_ADD;
      
      trailParticle.direction1 = Vector3.Zero();
      trailParticle.direction2 = Vector3.Zero();
      trailParticle.minEmitPower = 0;
      trailParticle.maxEmitPower = 0;
      
      trailParticle.start();
      trailParticlesRef.current.push(trailParticle);
      
      // Stop trail particle after short time
      setTimeout(() => {
        trailParticle.stop();
        setTimeout(() => {
          trailParticle.dispose();
          trailParticlesRef.current = trailParticlesRef.current.filter(p => p !== trailParticle);
        }, 1000);
      }, 100);

      // Erase nearby particles
      eraseNearbyParticles(pos, scene);
    };

    const eraseNearbyParticles = (pos: Vector3, scene: BABYLON.Scene) => {
      const erasureRadius = 0.3;
      const config = SHAPE_CONFIGS[currentShape];
      let particlesErasedThisFrame = 0;
      
      shapeParticlesRef.current.forEach((particleData) => {
        if (!particleData.destroyed && Vector3.Distance(particleData.mesh.position, pos) < erasureRadius) {
          particleData.destroyed = true;
          particlesErasedThisFrame++;
          
          // Flash the particle before destruction
          const mat = particleData.mesh.material as BABYLON.StandardMaterial;
          mat.emissiveColor = config.color.scale(2);
          
          setTimeout(() => {
            // Create explosion effect
            const explosionParticles = new ParticleSystem('explosion', 30, scene);
            explosionParticles.particleTexture = new Texture('', scene);
            explosionParticles.emitter = particleData.mesh.position.clone();
            
            explosionParticles.color1 = config.particleColor1;
            explosionParticles.color2 = config.particleColor2;
            explosionParticles.colorDead = new Color4(0, 0, 0, 0);
            
            explosionParticles.minSize = 0.05;
            explosionParticles.maxSize = 0.15;
            explosionParticles.minLifeTime = 0.3;
            explosionParticles.maxLifeTime = 0.8;
            
            explosionParticles.emitRate = 1000;
            explosionParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
            
            explosionParticles.direction1 = new Vector3(-1, -1, -1);
            explosionParticles.direction2 = new Vector3(1, 1, 1);
            explosionParticles.minEmitPower = 1;
            explosionParticles.maxEmitPower = 3;
            
            explosionParticles.start();
            
            setTimeout(() => {
              explosionParticles.stop();
              setTimeout(() => {
                explosionParticles.dispose();
              }, 1000);
            }, 100);
            
            // Remove the particle
            particleData.mesh.dispose();
          }, 50);
        }
      });
      
      if (particlesErasedThisFrame > 0) {
        setParticlesCleared(prev => {
          const newCleared = prev + particlesErasedThisFrame;
          return newCleared;
        });
        
        // Update combo
        setCombo(prev => {
          const newCombo = prev + particlesErasedThisFrame;
          setBestStreak(current => Math.max(current, newCombo));
          return newCombo;
        });
        
        // Update score with combo bonus
        const comboMultiplier = 1 + (combo * 0.05);
        const points = Math.round(particlesErasedThisFrame * 10 * comboMultiplier);
        setTotalScore(prev => prev + points);
      }
    };

    const stopDrawing = () => {
      if (!isLocalDrawing) return;
      isLocalDrawing = false;
      setIsDrawing(false);
      drawingPathRef.current = [];
      lastValidPositionRef.current = null;
      
      // Stop and dispose particle system with fade out
      if (particleSystemRef.current) {
        particleSystemRef.current.stop();
        setTimeout(() => {
          if (particleSystemRef.current) {
            particleSystemRef.current.dispose();
            particleSystemRef.current = null;
          }
        }, 1500);
      }
      
      // Stop all trail particles
      trailParticlesRef.current.forEach(p => {
        p.stop();
        setTimeout(() => p.dispose(), 1500);
      });
      trailParticlesRef.current = [];
    };

    // Event listeners
    canvasRef.current.addEventListener('pointerdown', (e) => {
      const pos = getPointerPosition(e);
      startDrawing(pos);
    });

    canvasRef.current.addEventListener('pointermove', (e) => {
      const pos = getPointerPosition(e);
      draw(pos);
    });

    canvasRef.current.addEventListener('pointerup', stopDrawing);
    canvasRef.current.addEventListener('pointerleave', stopDrawing);

    // Touch events
    canvasRef.current.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const pos = getPointerPosition(e.touches[0]);
      startDrawing(pos);
    }, { passive: false });

    canvasRef.current.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const pos = getPointerPosition(e.touches[0]);
      draw(pos);
    }, { passive: false });

    canvasRef.current.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopDrawing();
    }, { passive: false });

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (ambientParticlesRef.current) {
        ambientParticlesRef.current.dispose();
      }
      
      trailParticlesRef.current.forEach(p => p.dispose());
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      engine.dispose();
    };
  }, []); // Empty dependency array - only run once

  // Handle shape changes and create particles
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Remove old shape particles
    shapeParticlesRef.current.forEach(({ mesh }) => {
      if (!mesh.isDisposed()) {
        mesh.dispose();
      }
    });
    shapeParticlesRef.current = [];
    
    // Remove old wall
    if (wallMeshRef.current) {
      wallMeshRef.current.dispose();
      wallMeshRef.current = null;
    }
    
    const config = SHAPE_CONFIGS[currentShape];
    
    // Create wall outline
    const wallPoints = createShapeOutline(currentShape, scene);
    const wall = BABYLON.MeshBuilder.CreateLines('wall', {
      points: wallPoints
    }, scene);
    wall.color = config.color;
    wall.isPickable = false;
    wallMeshRef.current = wall;
    
    // Add glow to wall
    if (glowLayerRef.current) {
      glowLayerRef.current.addIncludedOnlyMesh(wall);
      glowLayerRef.current.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
        if (mesh === wall) {
          result.set(
            config.color.r * config.glowIntensity,
            config.color.g * config.glowIntensity,
            config.color.b * config.glowIntensity,
            1
          );
        }
      };
    }
    
    // Calculate particle grid dimensions
    const particleSize = 0.08;
    const spacing = particleSize * 1.2;
    let bounds = { minX: -2, maxX: 2, minY: -2, maxY: 2 };
    
    // Adjust bounds based on shape
    if (currentShape === 'square') {
      bounds = { minX: -config.size, maxX: config.size, minY: -config.size, maxY: config.size };
    } else if (currentShape === 'circle') {
      bounds = { minX: -config.radius, maxX: config.radius, minY: -config.radius, maxY: config.radius };
    } else if (currentShape === 'triangle') {
      bounds = { minX: -config.size, maxX: config.size, minY: -config.size, maxY: config.size };
    } else if (currentShape === 'hexagon') {
      bounds = { minX: -config.size, maxX: config.size, minY: -config.size, maxY: config.size };
    } else if (currentShape === 'star') {
      bounds = { minX: -config.outerRadius, maxX: config.outerRadius, minY: -config.outerRadius, maxY: config.outerRadius };
    } else if (currentShape === 'heart') {
      bounds = { minX: -config.size * 1.5, maxX: config.size * 1.5, minY: -config.size * 1.2, maxY: config.size };
    }
    
    // Create dense grid of particles filling the shape
    let particleCount = 0;
    for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
      for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
        const position = new Vector3(x, y, 0);
        
        // Skip if random density check fails
        if (Math.random() > config.particleDensity) continue;
        
        // Check if position is inside shape
        if (!isPointInsideShape(position, currentShape)) continue;
        
        // Create particle
        const particle = BABYLON.MeshBuilder.CreateBox(`particle_${particleCount}`, { 
          size: particleSize 
        }, scene);
        particle.position = position;
        
        // Enhanced material with glow
        const particleMat = new BABYLON.StandardMaterial(`particleMat_${particleCount}`, scene);
        
        // Add color variation
        const colorVariation = 0.3;
        const r = Math.max(0, Math.min(1, config.color.r + (Math.random() - 0.5) * colorVariation));
        const g = Math.max(0, Math.min(1, config.color.g + (Math.random() - 0.5) * colorVariation));
        const b = Math.max(0, Math.min(1, config.color.b + (Math.random() - 0.5) * colorVariation));
        
        particleMat.diffuseColor = new Color3(r, g, b);
        particleMat.emissiveColor = particleMat.diffuseColor.scale(0.3);
        particleMat.specularColor = new Color3(1, 1, 1);
        particleMat.specularPower = 32;
        particle.material = particleMat;
        
        // Add to glow layer
        if (glowLayerRef.current) {
          glowLayerRef.current.addIncludedOnlyMesh(particle);
          glowLayerRef.current.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            if (mesh === particle) {
              result.set(
                r * config.glowIntensity * 0.5,
                g * config.glowIntensity * 0.5,
                b * config.glowIntensity * 0.5,
                1
              );
            }
          };
        }
        
        // Random rotation for visual interest
        particle.rotation.x = Math.random() * Math.PI;
        particle.rotation.y = Math.random() * Math.PI;
        particle.rotation.z = Math.random() * Math.PI;
        
        // Subtle animation
        scene.registerBeforeRender(() => {
          if (!particle.isDisposed() && !particleData.destroyed) {
            particle.rotation.x += 0.005;
            particle.rotation.y += 0.008;
            particle.rotation.z += 0.003;
            
            // Subtle floating
            const time = Date.now() * 0.001;
            particle.position.z = Math.sin(time + particleCount * 0.1) * 0.01;
          }
        });
        
        const particleData = { mesh: particle, destroyed: false };
        shapeParticlesRef.current.push(particleData);
        particleCount++;
      }
    }
    
    setTotalParticles(particleCount);
    setParticlesCleared(0);
    setTimeRemaining(config.timeLimit);
    setGameStarted(false);
    setGameComplete(false);
    setCombo(0);
    
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
  }, [currentShape]);

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setGameComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetShape = () => {
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset state
    setParticlesCleared(0);
    setTimeRemaining(SHAPE_CONFIGS[currentShape].timeLimit);
    setGameStarted(false);
    setGameComplete(false);
    setCombo(0);
    setHitWall(false);
    
    // Trigger shape recreation
    const temp = currentShape;
    setCurrentShape('circle');
    setTimeout(() => setCurrentShape(temp), 10);
  };

  const config = SHAPE_CONFIGS[currentShape];
  const percentageCleared = totalParticles > 0 ? Math.round((particlesCleared / totalParticles) * 100) : 0;
  const targetMet = percentageCleared >= config.targetPercentage;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center p-4">
      {/* Enhanced Header */}
      <div className="w-full max-w-6xl mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center mb-2 font-orbitron tracking-wider">
          SHAPE KNOCKDOWN
        </h1>
        
        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Total Score</span>
            <div className="text-2xl font-bold text-yellow-400">{totalScore}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Combo</span>
            <div className="text-2xl font-bold text-orange-400">x{combo}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Best Streak</span>
            <div className="text-2xl font-bold text-purple-400">{bestStreak}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Time</span>
            <div className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              {timeRemaining}s
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Cleared: {particlesCleared}/{totalParticles}</span>
            <span className={`font-bold ${percentageCleared >= config.targetPercentage ? 'text-green-400' : 'text-yellow-400'}`}>
              {percentageCleared}% / {config.targetPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${
                percentageCleared >= config.targetPercentage ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                'bg-gradient-to-r from-yellow-500 to-orange-400'
              }`}
              style={{ width: `${percentageCleared}%` }}
            />
            <div 
              className="absolute top-0 h-full w-0.5 bg-white opacity-50"
              style={{ left: `${config.targetPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative w-full max-w-4xl mb-6" style={{ aspectRatio: '16/9' }}>
        <canvas 
          ref={canvasRef}
          className="w-full h-full rounded-lg shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #0a0a1a 0%, #000000 100%)',
            touchAction: 'none'
          }}
        />
        
        {/* Status Indicators */}
        {isDrawing && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded font-bold animate-pulse">
            ERASING
          </div>
        )}
        
        {hitWall && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded font-bold animate-bounce">
            WALL HIT!
          </div>
        )}
        
        {!gameStarted && !gameComplete && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
            <div className="text-2xl font-bold text-yellow-400 animate-pulse mb-2">
              Draw Inside The Shape!
            </div>
            <div className="text-gray-400">
              Erase {config.targetPercentage}% of particles before time runs out
            </div>
          </div>
        )}
      </div>

      {/* Shape Selection Grid */}
      <div className="w-full max-w-6xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-3 text-center">Select Shape</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(SHAPE_CONFIGS).map(([key, shape]) => (
            <button
              key={key}
              onClick={() => setCurrentShape(key as ShapeType)}
              className={`group relative p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                currentShape === key 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20' 
                  : 'bg-black/50 backdrop-blur border-gray-700 hover:border-yellow-500/50 hover:bg-gray-900/50'
              }`}
            >
              {/* Shape Icon */}
              <div className="text-4xl mb-2">{shape.icon}</div>
              
              {/* Shape Name */}
              <div className={`font-bold text-lg mb-1 ${
                currentShape === key ? 'text-yellow-400' : 'text-gray-300 group-hover:text-yellow-400'
              }`}>
                {shape.name}
              </div>
              
              {/* Difficulty Badge */}
              <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
                shape.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                shape.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {shape.difficulty}
              </div>
              
              {/* Target Info */}
              <div className="text-sm text-gray-400">
                <span className="text-cyan-400">{shape.targetPercentage}%</span>
                {' in '}
                <span className="text-purple-400">{shape.timeLimit}s</span>
              </div>
              
              {/* Selection Indicator */}
              {currentShape === key && (
                <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-pulse pointer-events-none" />
              )}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={resetShape}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg"
          >
            Reset Shape
          </button>
        </div>
      </div>

      {/* Game Complete Modal */}
      {gameComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-black/90 rounded-lg p-8 border border-yellow-500/30 max-w-md">
            <h2 className="text-3xl font-orbitron text-yellow-400 mb-4">
              {targetMet ? 'SUCCESS!' : 'TIME\'S UP!'}
            </h2>
            <div className="space-y-2 mb-6">
              <div className="text-cyan-400">Particles Cleared: {particlesCleared}/{totalParticles}</div>
              <div className={`text-xl font-bold ${targetMet ? 'text-green-400' : 'text-red-400'}`}>
                {percentageCleared}% / {config.targetPercentage}%
              </div>
              <div className="text-yellow-400">Final Score: {totalScore}</div>
              <div className="text-purple-400">Best Combo: {bestStreak}</div>
            </div>
            <button
              onClick={resetShape}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}