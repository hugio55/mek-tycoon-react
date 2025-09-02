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

// Spell patterns with enhanced visual properties
const SPELL_PATTERNS = {
  lightning: {
    name: 'Lightning Bolt',
    fluxRange: { min: 15, max: 70 },
    color: new Color3(1, 1, 0.2),
    glowIntensity: 1.5,
    particleColor1: new Color4(1, 1, 0.4, 1),
    particleColor2: new Color4(1, 0.8, 0, 0.8),
    icon: '⚡',
    difficulty: 'Easy',
    points: [
      { x: -0.3, y: 0.4 },
      { x: -0.1, y: 0.2 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.2 },
      { x: 0.3, y: -0.4 }
    ]
  },
  wave: {
    name: 'Mystic Wave',
    fluxRange: { min: 12, max: 60 },
    color: new Color3(0.4, 0.8, 1),
    glowIntensity: 1.2,
    particleColor1: new Color4(0.4, 0.8, 1, 1),
    particleColor2: new Color4(0.2, 0.6, 1, 0.8),
    icon: '🌊',
    difficulty: 'Medium',
    points: [
      { x: -0.4, y: 0 },
      { x: -0.3, y: 0.2 },
      { x: -0.2, y: 0 },
      { x: -0.1, y: -0.2 },
      { x: 0, y: 0 },
      { x: 0.1, y: 0.2 },
      { x: 0.2, y: 0 },
      { x: 0.3, y: -0.2 },
      { x: 0.4, y: 0 }
    ]
  },
  arc: {
    name: 'Arcane Arc',
    fluxRange: { min: 20, max: 80 },
    color: new Color3(0.8, 0.3, 1),
    glowIntensity: 1.8,
    particleColor1: new Color4(0.8, 0.3, 1, 1),
    particleColor2: new Color4(0.6, 0.1, 0.8, 0.8),
    icon: '🔮',
    difficulty: 'Medium',
    points: [
      { x: -0.4, y: -0.2 },
      { x: -0.3, y: 0 },
      { x: -0.2, y: 0.2 },
      { x: 0, y: 0.3 },
      { x: 0.2, y: 0.2 },
      { x: 0.3, y: 0 },
      { x: 0.4, y: -0.2 }
    ]
  },
  zigzag: {
    name: 'Fire Zigzag',
    fluxRange: { min: 10, max: 50 },
    color: new Color3(1, 0.4, 0.1),
    glowIntensity: 2,
    particleColor1: new Color4(1, 0.6, 0.1, 1),
    particleColor2: new Color4(1, 0.3, 0, 0.8),
    icon: '🔥',
    difficulty: 'Easy',
    points: [
      { x: -0.4, y: 0.3 },
      { x: -0.2, y: -0.3 },
      { x: 0, y: 0.3 },
      { x: 0.2, y: -0.3 },
      { x: 0.4, y: 0.3 }
    ]
  },
  spiral: {
    name: 'Void Spiral',
    fluxRange: { min: 25, max: 90 },
    color: new Color3(0.5, 0, 0.8),
    glowIntensity: 2.2,
    particleColor1: new Color4(0.6, 0, 1, 1),
    particleColor2: new Color4(0.3, 0, 0.6, 0.8),
    icon: '🌀',
    difficulty: 'Hard',
    points: (() => {
      const points: { x: number, y: number }[] = [];
      const segments = 30;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * 2;
        const radius = 0.05 + t * 0.35;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      return points;
    })()
  },
  star: {
    name: 'Celestial Star',
    fluxRange: { min: 30, max: 100 },
    color: new Color3(1, 0.8, 0.2),
    glowIntensity: 2.5,
    particleColor1: new Color4(1, 0.9, 0.4, 1),
    particleColor2: new Color4(1, 0.7, 0, 0.8),
    icon: '⭐',
    difficulty: 'Hard',
    points: (() => {
      const points: { x: number, y: number }[] = [];
      const outerRadius = 0.4;
      const innerRadius = 0.16;
      const spikes = 5;
      for (let i = 0; i <= spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      return points;
    })()
  }
};

export default function SpellCasterBabylon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.UniversalCamera | null>(null);
  const [currentSpell, setCurrentSpell] = useState<keyof typeof SPELL_PATTERNS>('lightning');
  const [fluxGenerated, setFluxGenerated] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [recreateGuideline, setRecreateGuideline] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  const [totalFlux, setTotalFlux] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [combo, setCombo] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  
  // Store guideline cubes and effects
  const guidelineCubesRef = useRef<{ mesh: BABYLON.Mesh; destroyed: boolean; visible: boolean }[]>([]);
  const fragmentsRef = useRef<BABYLON.Mesh[]>([]);
  const tracedPointsRef = useRef<BABYLON.Vector3[]>([]);
  const physicsEnabledRef = useRef<boolean>(false);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const trailParticlesRef = useRef<ParticleSystem[]>([]);
  const glowLayerRef = useRef<GlowLayer | null>(null);
  const pipelineRef = useRef<DefaultRenderingPipeline | null>(null);
  const ambientParticlesRef = useRef<ParticleSystem | null>(null);

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

    // Camera setup
    const camera = new BABYLON.UniversalCamera('camera', new Vector3(0, 0, -5), scene);
    camera.setTarget(Vector3.Zero());
    cameraRef.current = camera;

    // Enable physics
    const gravityVector = new Vector3(0, -20, 0);
    scene.enablePhysics(gravityVector, new CannonJSPlugin(true, 10, CANNON));
    physicsEnabledRef.current = true;

    // Enhanced lighting
    const light1 = new BABYLON.HemisphericLight('light1', new Vector3(0, 1, 0), scene);
    light1.intensity = 0.4;
    light1.diffuse = new Color3(0.8, 0.8, 1);
    
    const light2 = new BABYLON.DirectionalLight('light2', new Vector3(0, -1, 1), scene);
    light2.intensity = 0.5;
    light2.diffuse = new Color3(1, 0.9, 0.8);

    // Add point lights for more dynamic lighting
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
    
    // Enhanced floor material with gradient
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
    
    // Configure bloom
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.8;
    pipeline.bloomWeight = 0.5;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    
    // Configure image processing
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.exposure = 1.2;
    pipeline.imageProcessing.contrast = 1.3;
    pipeline.imageProcessing.toneMappingEnabled = true;
    
    // Add subtle vignette
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
    let isDrawing = false;

    const getPointerPosition = (event: PointerEvent | Touch): Vector3 => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return new Vector3(x * 2, y * 2, 0);
    };

    const startDrawing = (pos: Vector3) => {
      isDrawing = true;
      setIsTracing(true);
      tracedPointsRef.current = [pos];
      
      // Create enhanced particle system for tracing
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }
      
      const spell = SPELL_PATTERNS[currentSpell];
      const particleSystem = new ParticleSystem('particles', 1000, scene);
      
      // Create a simple white texture for particles
      const particleTexture = new Texture('', scene);
      particleSystem.particleTexture = particleTexture;
      
      particleSystem.emitter = pos.clone();
      
      // Enhanced particle colors based on spell
      particleSystem.color1 = spell.particleColor1;
      particleSystem.color2 = spell.particleColor2;
      particleSystem.colorDead = new Color4(0, 0, 0, 0);
      
      // Varied particle sizing
      particleSystem.minSize = 0.02;
      particleSystem.maxSize = 0.2;
      
      // Lifetime with variation
      particleSystem.minLifeTime = 0.2;
      particleSystem.maxLifeTime = 1;
      
      // High emission rate for dense trail
      particleSystem.emitRate = 200;
      
      // Speed variation
      particleSystem.minEmitPower = 0.05;
      particleSystem.maxEmitPower = 0.5;
      particleSystem.updateSpeed = 0.01;
      
      // Spread pattern
      particleSystem.direction1 = new Vector3(-0.3, -0.3, -0.3);
      particleSystem.direction2 = new Vector3(0.3, 0.3, 0.3);
      
      // Add gravity for natural fall
      particleSystem.gravity = new Vector3(0, -0.5, 0);
      
      // Additive blending for glow effect
      particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
      
      particleSystem.start();
      particleSystemRef.current = particleSystem;
    };

    const draw = (pos: Vector3) => {
      if (!isDrawing) return;

      tracedPointsRef.current.push(pos);
      
      // Update particle emitter position
      if (particleSystemRef.current) {
        particleSystemRef.current.emitter = pos.clone();
      }

      // Create trail particles for extra visual impact
      const spell = SPELL_PATTERNS[currentSpell];
      const trailParticle = new ParticleSystem('trail', 50, scene);
      trailParticle.particleTexture = new Texture('', scene);
      trailParticle.emitter = pos.clone();
      
      trailParticle.color1 = spell.particleColor1;
      trailParticle.color2 = new Color4(spell.particleColor2.r, spell.particleColor2.g, spell.particleColor2.b, 0);
      
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

      // Enhanced cube destruction with more visual feedback
      destroyNearbyCubes(pos, scene);
    };

    const destroyNearbyCubes = (pos: Vector3, scene: BABYLON.Scene) => {
      if (!physicsEnabledRef.current) return;
      
      const destructionRadius = 0.4;
      const spell = SPELL_PATTERNS[currentSpell];
      
      guidelineCubesRef.current.forEach((cubeData) => {
        if (!cubeData.destroyed && Vector3.Distance(cubeData.mesh.position, pos) < destructionRadius) {
          cubeData.destroyed = true;
          
          // Flash the cube before destruction
          const mat = cubeData.mesh.material as BABYLON.StandardMaterial;
          mat.emissiveColor = spell.color.scale(2);
          
          setTimeout(() => {
            cubeData.mesh.isVisible = true;
            
            // Create multiple fragments with enhanced visuals
            for (let i = 0; i < 5; i++) {
              const fragmentSize = 0.015 + Math.random() * 0.03;
              const fragment = BABYLON.MeshBuilder.CreateBox('fragment', { size: fragmentSize }, scene);
              
              // Position with explosion offset
              fragment.position = cubeData.mesh.position.clone();
              fragment.position.x += (Math.random() - 0.5) * 0.1;
              fragment.position.y += (Math.random() - 0.5) * 0.1;
              fragment.position.z += (Math.random() - 0.5) * 0.1;
              
              // Enhanced fragment material
              const fragMat = new BABYLON.StandardMaterial('fragMat', scene);
              fragMat.diffuseColor = spell.color;
              fragMat.emissiveColor = spell.color.scale(0.5);
              fragMat.specularColor = new Color3(1, 1, 1);
              fragment.material = fragMat;
              
              // Add to glow layer
              if (glowLayerRef.current) {
                glowLayerRef.current.addIncludedOnlyMesh(fragment);
                glowLayerRef.current.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
                  if (mesh === fragment) {
                    result.set(spell.color.r * 2, spell.color.g * 2, spell.color.b * 2, 1);
                  }
                };
              }
              
              // Physics with more dramatic explosion
              if (physicsEnabledRef.current) {
                fragment.physicsImpostor = new BABYLON.PhysicsImpostor(
                  fragment,
                  BABYLON.PhysicsImpostor.BoxImpostor,
                  { mass: 0.005, restitution: 0.5, friction: 0.3 },
                  scene
                );
                
                // Explosive force with upward bias
                const explosionForce = new Vector3(
                  (Math.random() - 0.5) * 5,
                  Math.random() * 3 + 2,
                  (Math.random() - 0.5) * 5
                );
                fragment.physicsImpostor.setLinearVelocity(explosionForce);
                
                // Spin
                fragment.physicsImpostor.setAngularVelocity(
                  new Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15
                  )
                );
              }
              
              fragmentsRef.current.push(fragment);
            }
            
            // Create explosion particles at destruction point
            const explosionParticles = new ParticleSystem('explosion', 30, scene);
            explosionParticles.particleTexture = new Texture('', scene);
            explosionParticles.emitter = cubeData.mesh.position.clone();
            
            explosionParticles.color1 = spell.particleColor1;
            explosionParticles.color2 = spell.particleColor2;
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
            
            // Remove the original cube
            cubeData.mesh.dispose();
          }, 50);
        }
      });
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      setIsTracing(false);
      
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
      
      // Calculate accuracy and flux
      calculateSpellResult();
      
      // Make remaining guideline cubes fall dramatically
      breakApartRemainingGuideline(scene);
      
      // Trigger guideline recreation after delay
      setTimeout(() => {
        setRecreateGuideline(prev => prev + 1);
      }, 3000);
    };

    const breakApartRemainingGuideline = (scene: BABYLON.Scene) => {
      if (!physicsEnabledRef.current) return;
      
      const spell = SPELL_PATTERNS[currentSpell];
      
      guidelineCubesRef.current.forEach((cubeData) => {
        if (!cubeData.destroyed) {
          cubeData.destroyed = true;
          
          // Flash and make visible
          const mat = cubeData.mesh.material as BABYLON.StandardMaterial;
          mat.emissiveColor = spell.color.scale(1.5);
          cubeData.mesh.isVisible = true;
          
          // Add physics for dramatic fall
          cubeData.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
            cubeData.mesh,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 0.02, restitution: 0.6, friction: 0.4 },
            scene
          );
          
          // Apply outward impulse
          const center = Vector3.Zero();
          const direction = cubeData.mesh.position.subtract(center).normalize();
          const impulse = direction.scale(Math.random() * 2 + 1);
          impulse.y = Math.random() * 2;
          
          cubeData.mesh.physicsImpostor.setLinearVelocity(impulse);
          cubeData.mesh.physicsImpostor.setAngularVelocity(
            new Vector3(
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10
            )
          );
          
          fragmentsRef.current.push(cubeData.mesh);
        }
      });
      
      guidelineCubesRef.current = [];
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

    // Render loop with fragment cleanup
    engine.runRenderLoop(() => {
      scene.render();
      
      // Clean up fallen fragments
      fragmentsRef.current = fragmentsRef.current.filter(fragment => {
        if (!fragment || fragment.isDisposed()) return false;
        
        // Remove if fallen too far
        if (fragment.position.y < -6) {
          fragment.dispose();
          return false;
        }
        
        // Fade out fragments over time
        const mat = fragment.material as BABYLON.StandardMaterial;
        if (mat && mat.emissiveColor) {
          mat.emissiveColor = mat.emissiveColor.scale(0.98);
          if (mat.emissiveColor.r < 0.01 && mat.emissiveColor.g < 0.01 && mat.emissiveColor.b < 0.01) {
            fragment.dispose();
            return false;
          }
        }
        
        return true;
      });
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      physicsEnabledRef.current = false;
      
      if (ambientParticlesRef.current) {
        ambientParticlesRef.current.dispose();
      }
      
      trailParticlesRef.current.forEach(p => p.dispose());
      
      engine.dispose();
    };
  }, []); // Empty dependency array - only run once

  // Handle spell changes and guideline recreation with enhanced visuals
  useEffect(() => {
    if (!sceneRef.current || !physicsEnabledRef.current) return;
    
    const scene = sceneRef.current;
    
    // Remove old guideline cubes
    guidelineCubesRef.current.forEach(({ mesh }) => {
      mesh.dispose();
    });
    guidelineCubesRef.current = [];
    
    const spell = SPELL_PATTERNS[currentSpell];
    const points = spell.points.map(p => new Vector3(p.x * 3, p.y * 3, 0));
    
    // Create enhanced guideline with varied cube sizes
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const distance = Vector3.Distance(start, end);
      const numCubes = Math.ceil(distance / 0.06);
      
      for (let j = 0; j <= numCubes; j++) {
        const t = j / numCubes;
        const position = Vector3.Lerp(start, end, t);
        
        // Varied cube sizes for organic look
        const baseSize = 0.05;
        const sizeVariation = Math.sin(t * Math.PI) * 0.02;
        const size = baseSize + sizeVariation + Math.random() * 0.01;
        
        const cube = BABYLON.MeshBuilder.CreateBox(`cube_${i}_${j}`, { size }, scene);
        cube.position = position;
        
        // Enhanced material with glow
        const cubeMat = new BABYLON.StandardMaterial(`cubeMat_${i}_${j}`, scene);
        cubeMat.diffuseColor = spell.color;
        cubeMat.emissiveColor = spell.color.scale(0.5);
        cubeMat.specularColor = new Color3(1, 1, 1);
        cubeMat.specularPower = 32;
        cube.material = cubeMat;
        
        // Add to glow layer
        if (glowLayerRef.current) {
          glowLayerRef.current.addIncludedOnlyMesh(cube);
          glowLayerRef.current.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            if (mesh === cube) {
              result.set(
                spell.color.r * spell.glowIntensity,
                spell.color.g * spell.glowIntensity,
                spell.color.b * spell.glowIntensity,
                1
              );
            }
          };
        }
        
        // Animated rotation for visual interest
        cube.rotation.x = Math.random() * Math.PI;
        cube.rotation.y = Math.random() * Math.PI;
        cube.rotation.z = Math.random() * Math.PI;
        
        // Animate cubes
        scene.registerBeforeRender(() => {
          if (!cube.isDisposed() && !cubeData.destroyed) {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.015;
            cube.rotation.z += 0.008;
            
            // Subtle floating animation
            const time = Date.now() * 0.001;
            cube.position.y = position.y + Math.sin(time + j * 0.5) * 0.02;
          }
        });
        
        const cubeData = { mesh: cube, destroyed: false, visible: true };
        guidelineCubesRef.current.push(cubeData);
      }
    }
    
    // Flash the guideline then fade it slightly
    const flashTimer = setTimeout(() => {
      guidelineCubesRef.current.forEach((cubeData) => {
        if (!cubeData.destroyed) {
          const mat = cubeData.mesh.material as BABYLON.StandardMaterial;
          mat.alpha = 0.7;
        }
      });
    }, 1500);
    
    return () => {
      clearTimeout(flashTimer);
    };
  }, [currentSpell, recreateGuideline]);

  const calculateSpellResult = () => {
    if (tracedPointsRef.current.length < 2) return;
    
    const spell = SPELL_PATTERNS[currentSpell];
    const guidelinePoints = spell.points.map(p => new Vector3(p.x * 3, p.y * 3, 0));
    
    // Calculate accuracy
    let totalDistance = 0;
    let pointCount = 0;
    
    tracedPointsRef.current.forEach(tracePoint => {
      let minDist = Infinity;
      
      for (let i = 0; i < guidelinePoints.length - 1; i++) {
        const p1 = guidelinePoints[i];
        const p2 = guidelinePoints[i + 1];
        
        const lineVec = p2.subtract(p1);
        const pointVec = tracePoint.subtract(p1);
        const lineLen = lineVec.length();
        const lineDir = lineVec.normalize();
        const projLength = Math.max(0, Math.min(lineLen, Vector3.Dot(pointVec, lineDir)));
        const projPoint = p1.add(lineDir.scale(projLength));
        const dist = tracePoint.subtract(projPoint).length();
        
        minDist = Math.min(minDist, dist);
      }
      
      totalDistance += minDist;
      pointCount++;
    });
    
    const avgDistance = totalDistance / pointCount;
    const newAccuracy = Math.max(0, Math.min(100, 100 - (avgDistance * 40)));
    setAccuracy(Math.round(newAccuracy));
    
    // Update combo and streaks
    if (newAccuracy >= 90) {
      setCombo(prev => prev + 1);
      setPerfectStreak(prev => prev + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else if (newAccuracy >= 70) {
      setCombo(prev => prev + 1);
      setPerfectStreak(0);
    } else {
      setCombo(0);
      setPerfectStreak(0);
    }
    
    // Calculate flux with combo bonus
    const fluxRange = spell.fluxRange.max - spell.fluxRange.min;
    const baseFlux = spell.fluxRange.min + (fluxRange * (newAccuracy / 100));
    const comboMultiplier = 1 + (combo * 0.1);
    const flux = Math.round(baseFlux * comboMultiplier);
    
    setFluxGenerated(flux);
    setTotalFlux(prev => prev + flux);
  };

  const switchSpell = (spellKey: keyof typeof SPELL_PATTERNS) => {
    setCurrentSpell(spellKey);
    setShowSuccess(false);
  };

  const resetGame = () => {
    setTotalFlux(0);
    setFluxGenerated(0);
    setAccuracy(100);
    setCombo(0);
    setPerfectStreak(0);
    setShowSuccess(false);
    
    // Clear all fragments
    fragmentsRef.current.forEach(fragment => {
      if (!fragment.isDisposed()) {
        fragment.dispose();
      }
    });
    fragmentsRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center p-4">
      {/* Enhanced Header */}
      <div className="w-full max-w-6xl mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center mb-2 font-orbitron tracking-wider">
          FLUX CASTER 3D
        </h1>
        
        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Total Flux</span>
            <div className="text-2xl font-bold text-yellow-400">{totalFlux}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Combo</span>
            <div className="text-2xl font-bold text-orange-400">x{combo}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Perfect Streak</span>
            <div className="text-2xl font-bold text-purple-400">{perfectStreak}</div>
          </div>
          
          <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Last Cast</span>
            <div className={`text-2xl font-bold ${accuracy > 80 ? 'text-green-400' : accuracy > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {fluxGenerated > 0 ? `+${fluxGenerated}` : '-'}
            </div>
          </div>
        </div>
        
        {/* Accuracy Bar */}
        <div className="bg-black/50 backdrop-blur border border-yellow-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Accuracy</span>
            <span className={`font-bold ${accuracy > 80 ? 'text-green-400' : accuracy > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                accuracy > 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                accuracy > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                'bg-gradient-to-r from-red-500 to-red-400'
              }`}
              style={{ width: `${accuracy}%` }}
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
        {isTracing && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded font-bold animate-pulse">
            TRACING
          </div>
        )}
        
        {showSuccess && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="text-6xl font-bold text-yellow-400 animate-bounce">
              PERFECT!
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Spell Selection Grid */}
      <div className="w-full max-w-6xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-3 text-center">Select Your Spell</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(SPELL_PATTERNS).map(([key, spell]) => (
            <button
              key={key}
              onClick={() => switchSpell(key as keyof typeof SPELL_PATTERNS)}
              className={`group relative p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                currentSpell === key 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20' 
                  : 'bg-black/50 backdrop-blur border-gray-700 hover:border-yellow-500/50 hover:bg-gray-900/50'
              }`}
            >
              {/* Spell Icon */}
              <div className="text-4xl mb-2">{spell.icon}</div>
              
              {/* Spell Name */}
              <div className={`font-bold text-lg mb-1 ${
                currentSpell === key ? 'text-yellow-400' : 'text-gray-300 group-hover:text-yellow-400'
              }`}>
                {spell.name}
              </div>
              
              {/* Difficulty Badge */}
              <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
                spell.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                spell.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {spell.difficulty}
              </div>
              
              {/* Flux Range */}
              <div className="text-sm text-gray-400">
                <span className="text-cyan-400">{spell.fluxRange.min}</span>
                {' - '}
                <span className="text-purple-400">{spell.fluxRange.max}</span>
                {' flux'}
              </div>
              
              {/* Visual Pattern Preview (mini dots) */}
              <div className="absolute top-2 right-2 w-8 h-8 opacity-30 group-hover:opacity-60 transition-opacity">
                <svg viewBox="-1 -1 2 2" className="w-full h-full">
                  {spell.points.map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={-point.y}
                      r="0.05"
                      fill={`rgb(${spell.color.r * 255}, ${spell.color.g * 255}, ${spell.color.b * 255})`}
                    />
                  ))}
                </svg>
              </div>
              
              {/* Selection Indicator */}
              {currentSpell === key && (
                <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-pulse pointer-events-none" />
              )}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={resetGame}
            className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Reset Game
          </button>
          
          <button 
            onClick={() => setRecreateGuideline(prev => prev + 1)}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg"
          >
            New Pattern
          </button>
        </div>
      </div>
    </div>
  );
}