'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function AdminPlinkoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  
  // Configuration states
  const [ballSize, setBallSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [gravity, setGravity] = useState<'low' | 'medium' | 'high'>('medium');
  const [pegSpacing, setPegSpacing] = useState<'tight' | 'normal' | 'wide'>('normal');

  const ballSizes = {
    small: 4,
    medium: 6,
    large: 8
  };

  const gravityValues = {
    low: 0.5,
    medium: 0.68,
    high: 0.85
  };

  const pegSpacingValues = {
    tight: { horizontal: 20, vertical: 12 },
    normal: { horizontal: 24, vertical: 14 },
    wide: { horizontal: 28, vertical: 16 }
  };

  useEffect(() => {
    // Initialize game when Matter.js is loaded and settings change
    if ((window as any).Matter) {
      initGame();
    }
    
    // Clean up on unmount or before reinitializing
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (engineRef.current && (window as any).Matter) {
        const Matter = (window as any).Matter;
        if (renderRef.current) {
          Matter.Render.stop(renderRef.current);
        }
        Matter.Engine.clear(engineRef.current);
        Matter.World.clear(engineRef.current.world);
        engineRef.current = null;
        renderRef.current = null;
      }
    };
  }, [ballSize, gravity, pegSpacing]);

  const initGame = () => {
    if (!canvasRef.current || !(window as any).Matter) return;

    // Clean up existing engine if it exists
    if (engineRef.current) {
      const Matter = (window as any).Matter;
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      Matter.Engine.clear(engineRef.current);
      Matter.World.clear(engineRef.current.world);
    }

    const Matter = (window as any).Matter;
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Events = Matter.Events;

    // Game configuration
    const config = {
      width: 360,
      height: 640,
      pegRows: 28,
      pegRadius: 2.4,
      ballRadius: ballSizes[ballSize],
      zoneCount: 10,
      gravity: gravityValues[gravity],
      pegSpacingH: pegSpacingValues[pegSpacing].horizontal,
      pegSpacingV: pegSpacingValues[pegSpacing].vertical
    };

    const pegs: any[] = [];
    const litPegs = new Map();
    const balls: any[] = [];
    let isDropping = false;
    let rapidFireCount = 0;

    // Create Matter.js engine
    const engine = Engine.create();
    engine.world.gravity.y = config.gravity;
    engineRef.current = engine;

    // Create renderer
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: config.width,
        height: config.height,
        wireframes: false,
        background: '#111111'
      }
    });
    renderRef.current = render;

    // Create walls (no guardrails)
    const wallThickness = 20;

    const walls = [
      Bodies.rectangle(config.width/2, -wallThickness/2, config.width, wallThickness, { isStatic: true }),
      Bodies.rectangle(config.width/2, config.height + wallThickness/2, config.width, wallThickness, { isStatic: true }),
      Bodies.rectangle(-wallThickness/2, config.height/2, wallThickness, config.height, { isStatic: true }),
      Bodies.rectangle(config.width + wallThickness/2, config.height/2, wallThickness, config.height, { isStatic: true })
    ];

    World.add(engine.world, walls);

    // Create pegs with adjusted spacing
    const startY = 80;

    for (let row = 0; row < config.pegRows; row++) {
      const pegCount = row + 3;
      const rowWidth = pegCount * config.pegSpacingH;
      const startX = (config.width - rowWidth) / 2 + config.pegSpacingH / 2;

      for (let col = 0; col < pegCount; col++) {
        // Add slight random offset to break up patterns
        const randomOffsetX = (Math.random() - 0.5) * 2;
        const randomOffsetY = (Math.random() - 0.5) * 1;
        
        const x = startX + col * config.pegSpacingH + randomOffsetX;
        const y = startY + row * config.pegSpacingV + randomOffsetY;

        const peg = Bodies.circle(x, y, config.pegRadius, {
          isStatic: true,
          render: { fillStyle: '#666666' },
          label: 'peg'
        });

        pegs.push(peg);
        World.add(engine.world, peg);
      }
    }

    // Create zones (buckets) with proper physics
    const zones: any[] = [];
    const bucketWalls: any[] = [];
    const zoneWidth = config.width / config.zoneCount;
    const zoneY = config.height - 40;
    const bucketImages = [
      '/meks/thumbnails/MEK_3043.png',
      '/meks/thumbnails/MEK_3042.png',
      '/meks/thumbnails/MEK_3041.png',
      '/meks/thumbnails/MEK_3040.png',
      '/meks/thumbnails/MEK_3039.png',
      '/meks/thumbnails/MEK_3038.png',
      '/meks/thumbnails/MEK_3037.png',
      '/meks/thumbnails/MEK_3036.png',
      '/meks/thumbnails/MEK_3035.png',
      '/meks/thumbnails/MEK_3034.png'
    ];

    for (let i = 0; i < config.zoneCount; i++) {
      const x = i * zoneWidth + zoneWidth / 2;
      
      // Create bucket floor (solid, not sensor)
      const bucketFloor = Bodies.rectangle(x, zoneY + 15, zoneWidth - 4, 4, {
        isStatic: true,
        render: { fillStyle: '#ffc107' },
        label: `bucket-floor-${i}`
      });
      
      // Create visual bucket walls (solid)
      const leftWall = Bodies.rectangle(x - zoneWidth/2 + 1, zoneY, 3, 50, {
        isStatic: true,
        render: { fillStyle: '#ffc107' },
        label: `bucket-left-${i}`
      });
      const rightWall = Bodies.rectangle(x + zoneWidth/2 - 1, zoneY, 3, 50, {
        isStatic: true,
        render: { fillStyle: '#ffc107' },
        label: `bucket-right-${i}`
      });
      
      bucketWalls.push(bucketFloor, leftWall, rightWall);
      World.add(engine.world, [bucketFloor, leftWall, rightWall]);
      
      // Store bucket info for rendering
      zones.push({
        index: i,
        x: x,
        image: bucketImages[i]
      });
    }

    // Handle collisions
    Events.on(engine, 'collisionStart', (event: any) => {
      const pairs = event.pairs;
      
      for (let pair of pairs) {
        const { bodyA, bodyB } = pair;
        
        // Check for ball-peg collision
        if ((bodyA.label === 'ball' && bodyB.label === 'peg') ||
            (bodyA.label === 'peg' && bodyB.label === 'ball')) {
          const peg = bodyA.label === 'peg' ? bodyA : bodyB;
          litPegs.set(peg.id, 1.0);
        }
      }
    });

    // Custom render for lit pegs
    Events.on(render, 'afterRender', () => {
      const context = render.canvas.getContext('2d');
      
      litPegs.forEach((opacity, pegId) => {
        const peg = pegs.find(p => p.id === pegId);
        if (peg && opacity > 0) {
          context.beginPath();
          context.arc(peg.position.x, peg.position.y, config.pegRadius + 2, 0, 2 * Math.PI);
          context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          context.fill();
        }
      });
    });

    // Update lit pegs (fade effect)
    setInterval(() => {
      litPegs.forEach((opacity, pegId) => {
        const newOpacity = opacity - 0.05;
        if (newOpacity <= 0) {
          litPegs.delete(pegId);
        } else {
          litPegs.set(pegId, newOpacity);
        }
      });
    }, 50);

    // Drop single ball function
    const dropBall = () => {
      if (isDropping) return;
      isDropping = true;

      const xVariation = (Math.random() - 0.5) * 30;
      const ball = Bodies.circle(config.width / 2 + xVariation, 20, config.ballRadius, {
        restitution: 0.75,
        friction: 0.2,
        density: 0.001,
        render: { fillStyle: '#ffc107' },
        label: 'ball'
      });

      balls.push(ball);
      World.add(engine.world, ball);

      setTimeout(() => {
        isDropping = false;
      }, 500);
    };

    // Rapid fire function - 30 balls from same spot
    const rapidFire = () => {
      if (rapidFireCount > 0) return; // Already firing
      
      rapidFireCount = 0;
      const targetCount = 30;
      const xPosition = config.width / 2; // Same spot for all balls
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Launch 3 balls per second
      intervalRef.current = setInterval(() => {
        if (rapidFireCount >= targetCount) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          rapidFireCount = 0;
          return;
        }
        
        // Create ball at exact same position, pointing straight down
        const ball = Bodies.circle(xPosition, 20, config.ballRadius, {
          restitution: 0.6,  // Less bounce for rapid fire
          friction: 0.3,
          density: 0.002,    // Slightly heavier for better stacking
          render: { fillStyle: '#ffc107' },
          label: 'ball',
          velocity: { x: 0, y: 0 } // Start with no horizontal velocity
        });
        
        balls.push(ball);
        World.add(engine.world, ball);
        rapidFireCount++;
        
      }, 333); // 3 balls per second (1000ms / 3 = ~333ms)
    };

    // Reset function
    const reset = () => {
      // Stop rapid fire if running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      rapidFireCount = 0;
      
      // Remove all balls
      balls.forEach(ball => {
        World.remove(engine.world, ball);
      });
      balls.length = 0;
      isDropping = false;
      litPegs.clear();
    };

    // Attach functions to buttons
    const dropButton = document.getElementById('dropButton');
    const rapidFireButton = document.getElementById('rapidFireButton');
    const resetButton = document.getElementById('resetButton');
    
    if (dropButton) {
      dropButton.onclick = () => dropBall();
    }
    
    if (rapidFireButton) {
      rapidFireButton.onclick = () => rapidFire();
    }
    
    if (resetButton) {
      resetButton.onclick = () => reset();
    }

    // Run the engine
    Engine.run(engine);
    Render.run(render);
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          initGame();
        }}
      />
      
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        {/* Configuration Tabs */}
        <div className="mb-4 flex flex-col gap-4 bg-gray-900 p-4 rounded-lg border-2 border-yellow-500">
          <div className="flex gap-4">
            <div>
              <label className="text-yellow-400 text-sm font-bold mb-2 block">Ball Size</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBallSize('small')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    ballSize === 'small' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Small
                </button>
                <button
                  onClick={() => setBallSize('medium')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    ballSize === 'medium' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setBallSize('large')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    ballSize === 'large' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>

            <div>
              <label className="text-yellow-400 text-sm font-bold mb-2 block">Gravity</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGravity('low')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    gravity === 'low' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Low
                </button>
                <button
                  onClick={() => setGravity('medium')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    gravity === 'medium' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setGravity('high')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    gravity === 'high' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  High
                </button>
              </div>
            </div>

            <div>
              <label className="text-yellow-400 text-sm font-bold mb-2 block">Peg Spacing</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPegSpacing('tight')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    pegSpacing === 'tight' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Tight
                </button>
                <button
                  onClick={() => setPegSpacing('normal')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    pegSpacing === 'normal' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setPegSpacing('wide')}
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all ${
                    pegSpacing === 'wide' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Wide
                </button>
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative w-full max-w-[400px] h-[90vh] max-h-[800px] bg-gray-900 border-4 border-yellow-500 shadow-2xl shadow-yellow-500/30 flex flex-col items-center p-4"
        >
          <canvas 
            ref={canvasRef}
            width={360}
            height={640}
            className="border-2 border-gray-700 bg-black"
          />
          
          <div className="flex gap-2 mt-4">
            <button
              id="dropButton"
              className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 border-2 border-black uppercase tracking-wider transition-all duration-200 hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
            >
              DROP
            </button>
            <button
              id="rapidFireButton"
              className="px-4 py-2 text-sm font-bold text-black bg-green-500 border-2 border-black uppercase tracking-wider transition-all duration-200 hover:bg-green-400 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
            >
              RAPID FIRE (30)
            </button>
            <button
              id="resetButton"
              className="px-4 py-2 text-sm font-bold text-black bg-red-500 border-2 border-black uppercase tracking-wider transition-all duration-200 hover:bg-red-400 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
            >
              RESET
            </button>
          </div>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex w-[360px] pointer-events-none">
            {[
              '/meks/thumbnails/MEK_3043.png',
              '/meks/thumbnails/MEK_3042.png',
              '/meks/thumbnails/MEK_3041.png',
              '/meks/thumbnails/MEK_3040.png',
              '/meks/thumbnails/MEK_3039.png',
              '/meks/thumbnails/MEK_3038.png',
              '/meks/thumbnails/MEK_3037.png',
              '/meks/thumbnails/MEK_3036.png',
              '/meks/thumbnails/MEK_3035.png',
              '/meks/thumbnails/MEK_3034.png'
            ].map((img, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-center"
              >
                <img src={img} alt={`Bucket ${i}`} className="w-8 h-8 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}