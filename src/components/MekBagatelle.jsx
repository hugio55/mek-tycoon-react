"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MekBagatelle.css';

const MekBagatelle = ({ 
  numberOfMeks = 3,
  onScoreUpdate = () => {},
  theme = 'mek'
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState([]);
  const [pegs, setPegs] = useState([]);
  const [cups, setCups] = useState([]);
  const [mekImages, setMekImages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ballsRemaining, setBallsRemaining] = useState(10);
  const [loadedImages, setLoadedImages] = useState({});
  const [cameraY, setCameraY] = useState(0);
  const [targetCameraY, setTargetCameraY] = useState(0);

  // Dynamic board scaling based on number of Meks
  const getBoardDimensions = useCallback(() => {
    // Much larger size that scales with Mek count
    const baseSizeFactor = Math.sqrt(numberOfMeks / 3);
    const baseWidth = 1200;
    const baseHeight = 1600;
    
    return {
      width: Math.max(baseWidth, baseWidth * baseSizeFactor * 0.8),
      height: Math.max(baseHeight, baseHeight * baseSizeFactor),
      pegRows: Math.max(numberOfMeks - 1, 2), // N-1 rows formula
      wallThickness: 15,
      cupDepth: 60,
    };
  }, [numberOfMeks]);

  // Generate pyramid/triangle peg pattern (Galton board style)
  const generatePegPatterns = useCallback((boardDims) => {
    const pegs = [];
    const { width: boardWidth, height: boardHeight, pegRows, wallThickness } = boardDims;
    
    // Define the pyramid area (accounting for walls)
    const topY = boardHeight * 0.15;
    const bottomY = boardHeight * 0.65;
    const usableWidth = boardWidth - (wallThickness * 4); // Leave space for walls
    const pegSpacing = usableWidth / (numberOfMeks + 1); // Horizontal spacing between pegs
    const rowHeight = (bottomY - topY) / pegRows;
    
    // Create perfect pyramid/triangle arrangement
    for (let row = 0; row < pegRows; row++) {
      const pegsInRow = row + 1; // Start with 1 peg, then 2, then 3, etc.
      const y = topY + rowHeight * row;
      
      // Center the pegs in each row (within the walls)
      const rowWidth = pegSpacing * (pegsInRow - 1);
      const startX = (boardWidth - rowWidth) / 2;
      
      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * pegSpacing;
        pegs.push({
          x,
          y,
          radius: 7, // Slightly larger pegs
          type: 'standard',
          color: '#fbbf24' // Gold color for pegs
        });
      }
    }

    return pegs;
  }, [numberOfMeks]);

  // Load random Mek images
  const loadMekImages = useCallback(async () => {
    // List of all available Mek image filenames (sampling from the directory)
    const mekFilenames = [
      '000-000-000.webp', '111-111-111.webp', '222-222-222.webp', '333-333-333.webp',
      '444-444-444.webp', '555-555-555.webp', '666-666-666.webp', '777-777-777.webp',
      '888-888-888.webp', '999-999-999.webp', 'aa1-aa1-cd1.webp', 'aa1-aa3-hn1.webp',
      'aa1-ak1-bc2.webp', 'aa1-ak1-de1.webp', 'aa1-ak1-ji2.webp', 'aa1-ak1-kq2.webp',
      'aa1-ak1-mo1.webp', 'aa1-ak1-nm1.webp', 'aa1-ak2-lg1.webp', 'aa1-ak3-mt1.webp',
      'aa1-at1-ji2.webp', 'aa1-at4-ey2.webp', 'aa1-bf1-cd1.webp', 'aa1-bf1-of2.webp',
      'aa1-bf2-ap2.webp', 'aa1-bf2-il2.webp', 'aa1-bf3-fb2.webp', 'aa1-bf4-cu1.webp',
      'aa1-bi1-ap1.webp', 'aa1-bi1-br2.webp', 'aa1-bi1-ji2.webp', 'aa1-bi1-nm1.webp',
      'aa1-bi2-da3.webp', 'aa1-bi2-lg2.webp', 'aa1-bj1-fb1.webp', 'aa1-bj1-hn2.webp',
      'aa1-bj2-cd2.webp', 'aa1-bj2-gk1.webp', 'aa1-bj2-ji1.webp', 'aa1-bj3-ap1.webp'
    ];
    
    // Randomly select images for the number of Meks
    const selectedImages = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numberOfMeks; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * mekFilenames.length);
      } while (usedIndices.has(randomIndex));
      
      usedIndices.add(randomIndex);
      const filename = mekFilenames[randomIndex];
      
      selectedImages.push({
        src: `/mek-images/150px/${filename}`,
        name: filename.replace('.webp', ''),
        index: i
      });
    }
    
    // Preload images
    const imagePromises = selectedImages.map(imgData => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ ...imgData, img });
        img.onerror = () => resolve({ ...imgData, img: null });
        img.src = imgData.src;
      });
    });
    
    const loadedImgs = await Promise.all(imagePromises);
    const imgMap = {};
    loadedImgs.forEach(data => {
      if (data.img) {
        imgMap[data.index] = data;
      }
    });
    
    setLoadedImages(imgMap);
    setMekImages(selectedImages);
  }, [numberOfMeks]);

  // Generate cup-shaped buckets with Mek images
  const generateCups = useCallback((boardDims) => {
    const cups = [];
    const { width: boardWidth, height: boardHeight, wallThickness, cupDepth } = boardDims;
    const cupY = boardHeight * 0.75;
    const usableWidth = boardWidth - (wallThickness * 4);
    const cupWidth = usableWidth / (numberOfMeks + 1);
    const cupSpacing = usableWidth / numberOfMeks;
    
    for (let i = 0; i < numberOfMeks; i++) {
      const x = wallThickness * 2 + cupSpacing * i + cupSpacing / 2;
      
      // Calculate scoring based on normal distribution
      // Center cups get lower scores (more common), edge cups get higher scores (rarer)
      const centerIndex = (numberOfMeks - 1) / 2;
      const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex;
      
      // Exponential scoring for rarity
      const value = Math.floor(10 + Math.pow(distanceFromCenter, 2) * 990);
      
      cups.push({
        x,
        y: cupY,
        width: cupWidth * 0.8,
        depth: cupDepth,
        value,
        hits: 0,
        index: i,
        mekImage: mekImages[i] || null,
        balls: [] // Track balls in this cup for physics
      });
    }
    
    return cups;
  }, [numberOfMeks, mekImages]);

  // Load Mek images on mount or when numberOfMeks changes
  useEffect(() => {
    loadMekImages();
  }, [numberOfMeks, loadMekImages]);

  // Initialize board
  useEffect(() => {
    const boardDims = getBoardDimensions();
    setPegs(generatePegPatterns(boardDims));
    setCups(generateCups(boardDims));
  }, [numberOfMeks, getBoardDimensions, generatePegPatterns, generateCups]);

  // Ball physics class with chrome appearance
  class Ball {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = 0;
      this.radius = 14; // Larger chrome ball
      this.gravity = 0.15; // Slower, more dramatic fall
      this.damping = 0.985;
      this.bounciness = 0.75;
      this.active = true;
      this.trail = [];
      this.maxTrailLength = 15;
      this.inCup = null;
      this.cupBounces = 0;
    }

    update(pegs, cups, boardDims) {
      if (!this.active) return;

      // Add to trail
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }

      // Apply gravity
      this.vy += this.gravity;
      
      // Apply damping
      this.vx *= this.damping;
      this.vy *= this.damping;
      
      // Update position
      this.x += this.vx;
      this.y += this.vy;
      
      // Outer wall collisions (balls cannot escape)
      const { wallThickness } = boardDims;
      if (this.x - this.radius < wallThickness * 2) {
        this.x = wallThickness * 2 + this.radius;
        this.vx *= -this.bounciness;
      } else if (this.x + this.radius > boardDims.width - wallThickness * 2) {
        this.x = boardDims.width - wallThickness * 2 - this.radius;
        this.vx *= -this.bounciness;
      }
      
      // Peg collisions with proper Galton board physics
      pegs.forEach(peg => {
        const dx = this.x - peg.x;
        const dy = this.y - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.radius + peg.radius;
        
        if (distance < minDistance) {
          // Collision detected
          const angle = Math.atan2(dy, dx);
          const targetX = peg.x + Math.cos(angle) * minDistance;
          const targetY = peg.y + Math.sin(angle) * minDistance;
          
          // Adjust position
          this.x = targetX;
          this.y = targetY;
          
          // Calculate new velocity with slight randomness for natural distribution
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          // Add small random factor to create the bell curve distribution
          const randomFactor = (Math.random() - 0.5) * 0.3;
          const randomAngle = angle + randomFactor;
          this.vx = Math.cos(randomAngle) * speed * this.bounciness;
          this.vy = Math.sin(randomAngle) * speed * this.bounciness;
        }
      });
      
      // Check if ball fell into a cup with realistic physics
      let hitCup = null;
      cups.forEach(cup => {
        const cupTop = cup.y - cup.depth / 2;
        const cupBottom = cup.y + cup.depth;
        const cupLeft = cup.x - cup.width / 2;
        const cupRight = cup.x + cup.width / 2;
        
        // Check if ball is within cup bounds
        if (this.x > cupLeft && this.x < cupRight &&
            this.y > cupTop && this.y < cupBottom) {
          
          if (!this.inCup) {
            this.inCup = cup;
            this.cupBounces = 0;
          }
          
          // Cup wall bouncing physics (like ping pong)
          if (this.x - this.radius < cupLeft + 5) {
            this.x = cupLeft + 5 + this.radius;
            this.vx *= -0.6; // Less bounce in cup
            this.cupBounces++;
          } else if (this.x + this.radius > cupRight - 5) {
            this.x = cupRight - 5 - this.radius;
            this.vx *= -0.6;
            this.cupBounces++;
          }
          
          // Cup bottom bounce
          if (this.y + this.radius > cupBottom - 5) {
            this.y = cupBottom - 5 - this.radius;
            this.vy *= -0.4; // Dampen vertical bounce
            this.cupBounces++;
            
            // Ball settles after bouncing
            if (Math.abs(this.vy) < 0.5 && this.cupBounces > 3) {
              this.active = false;
              cup.hits++;
              hitCup = cup;
              cup.balls.push(this);
            }
          }
        }
      });
      
      // Check if ball fell off the board
      if (this.y > boardDims.height + 100) {
        this.active = false;
      }
      
      return hitCup;
    }
  }

  // Launch a new ball
  const launchBall = useCallback(() => {
    if (ballsRemaining <= 0) return;
    
    const boardDims = getBoardDimensions();
    const newBall = new Ball(
      boardDims.width / 2 + (Math.random() - 0.5) * 50,
      30
    );
    
    setBalls(prev => [...prev, newBall]);
    setBallsRemaining(prev => prev - 1);
    setIsPlaying(true);
  }, [ballsRemaining, getBoardDimensions]);

  // Smooth camera panning
  useEffect(() => {
    const smoothCamera = () => {
      const diff = targetCameraY - cameraY;
      if (Math.abs(diff) > 1) {
        setCameraY(prev => prev + diff * 0.1);
      }
    };
    
    const interval = setInterval(smoothCamera, 16);
    return () => clearInterval(interval);
  }, [cameraY, targetCameraY]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const boardDims = getBoardDimensions();
    
    const animate = () => {
      // Save context for camera transform
      ctx.save();
      
      // Apply camera transform
      ctx.translate(0, -cameraY);
      
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, boardDims.width, boardDims.height + 500);
      
      // Draw outer walls
      const { wallThickness } = boardDims;
      ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
      ctx.fillRect(wallThickness, 0, wallThickness, boardDims.height);
      ctx.fillRect(boardDims.width - wallThickness * 2, 0, wallThickness, boardDims.height);
      
      // Add metallic gradient to walls
      const wallGradient = ctx.createLinearGradient(0, 0, boardDims.width, 0);
      wallGradient.addColorStop(0, 'rgba(150, 150, 170, 0.4)');
      wallGradient.addColorStop(0.5, 'rgba(200, 200, 220, 0.2)');
      wallGradient.addColorStop(1, 'rgba(150, 150, 170, 0.4)');
      ctx.fillStyle = wallGradient;
      ctx.fillRect(wallThickness, 0, wallThickness, boardDims.height);
      ctx.fillRect(boardDims.width - wallThickness * 2, 0, wallThickness, boardDims.height);
      
      // Draw pegs with glow effect
      pegs.forEach(peg => {
        // Outer glow
        const glowGradient = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.radius * 2);
        glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Main peg
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fillStyle = peg.color;
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      // Draw cups with realistic depth
      cups.forEach(cup => {
        const cupLeft = cup.x - cup.width / 2;
        const cupRight = cup.x + cup.width / 2;
        const cupTop = cup.y - cup.depth / 2;
        const cupBottom = cup.y + cup.depth;
        
        // Draw cup shape with gradient for depth
        const cupGradient = ctx.createLinearGradient(cup.x, cupTop, cup.x, cupBottom);
        cupGradient.addColorStop(0, 'rgba(30, 30, 40, 0.9)');
        cupGradient.addColorStop(0.3, 'rgba(40, 40, 55, 0.95)');
        cupGradient.addColorStop(1, 'rgba(20, 20, 30, 1)');
        
        // Draw cup walls
        ctx.fillStyle = cupGradient;
        ctx.beginPath();
        ctx.moveTo(cupLeft - 5, cupTop);
        ctx.lineTo(cupLeft, cupBottom);
        ctx.lineTo(cupRight, cupBottom);
        ctx.lineTo(cupRight + 5, cupTop);
        ctx.closePath();
        ctx.fill();
        
        // Draw cup rim highlight
        ctx.strokeStyle = 'rgba(150, 150, 170, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cupLeft - 5, cupTop);
        ctx.lineTo(cupRight + 5, cupTop);
        ctx.stroke();
        
        // Draw Mek image in cup
        const imageData = loadedImages[cup.index];
        if (imageData && imageData.img) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.drawImage(
            imageData.img,
            cup.x - cup.width / 3,
            cupBottom - cup.width * 0.7,
            cup.width * 0.66,
            cup.width * 0.66
          );
          ctx.restore();
        }
        
        // Draw value and stats
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${cup.value}pts`, cup.x, cupBottom + 5);
        
        if (cup.hits > 0) {
          ctx.fillStyle = '#10b981';
          ctx.font = '16px bold sans-serif';
          ctx.fillText(`×${cup.hits}`, cup.x, cupTop - 20);
        }
        
        // Draw Mek name
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Mek #${cup.index + 1}`, cup.x, cupBottom + 25);
      });
      
      // Update and draw balls
      let activeBalls = 0;
      let lowestBallY = 0;
      balls.forEach(ball => {
        if (ball.active) {
          activeBalls++;
          
          // Track lowest ball for camera
          if (ball.y > lowestBallY) {
            lowestBallY = ball.y;
          }
          
          // Update physics
          const hitCup = ball.update(pegs, cups, boardDims);
          
          if (hitCup && hitCup.value) {
            setScore(prev => {
              const newScore = prev + hitCup.value;
              onScoreUpdate(newScore);
              return newScore;
            });
          }
          
          // Draw trail
          ball.trail.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, (index / ball.trail.length) * ball.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${index / ball.trail.length * 0.3})`;
            ctx.fill();
          });
          
          // Draw chrome ball with metallic appearance
          // Outer glow
          const glowGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
          glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Main chrome ball with multiple gradients for metallic look
          const chromeGradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
          );
          chromeGradient.addColorStop(0, '#ffffff');
          chromeGradient.addColorStop(0.3, '#e0e0e0');
          chromeGradient.addColorStop(0.6, '#a0a0a0');
          chromeGradient.addColorStop(0.9, '#606060');
          chromeGradient.addColorStop(1, '#404040');
          
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fillStyle = chromeGradient;
          ctx.fill();
          
          // Reflection highlight
          ctx.beginPath();
          ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2);
          const highlightGradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4
          );
          highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = highlightGradient;
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
      
      // Restore context after camera transform
      ctx.restore();
      
      // Update camera to follow lowest ball
      if (lowestBallY > 0) {
        const viewportHeight = window.innerHeight * 0.8;
        const targetY = Math.max(0, lowestBallY - viewportHeight / 2);
        setTargetCameraY(targetY);
      }
      
      // Check if game should continue
      if (activeBalls > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        // Reset camera when no balls active
        setTargetCameraY(0);
      }
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balls, pegs, cups, isPlaying, getBoardDimensions, onScoreUpdate, loadedImages, numberOfMeks, cameraY]);

  // Reset game
  const resetGame = () => {
    setScore(0);
    setBalls([]);
    setBallsRemaining(10);
    setIsPlaying(false);
    setCameraY(0);
    setTargetCameraY(0);
    loadMekImages(); // Reload random Mek images
    
    const boardDims = getBoardDimensions();
    setPegs(generatePegPatterns(boardDims));
    setCups(generateCups(boardDims));
    onScoreUpdate(0);
  };

  const boardDims = getBoardDimensions();

  return (
    <>
      {/* Starfield Background */}
      <div className="starfield-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #0a0e27 0%, #000000 100%)',
        zIndex: -1
      }}>
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              backgroundColor: '#fff',
              borderRadius: '50%',
              animation: `twinkle ${Math.random() * 5 + 3}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random()
            }}
          />
        ))}
      </div>
      
      <div ref={containerRef} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: '40px 20px',
        minHeight: '100vh',
        position: 'relative'
      }}>
      <div style={{ 
        marginBottom: '20px',
        textAlign: 'center',
        color: '#e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          Mek Pyramid Drop
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '30px',
          justifyContent: 'center',
          fontSize: '18px'
        }}>
          <div>
            Score: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{score}</span>
          </div>
          <div>
            Balls: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{ballsRemaining}</span>
          </div>
          <div>
            Meks: <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{numberOfMeks}</span>
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'relative',
        width: boardDims.width,
        height: '90vh',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 0 100px rgba(100, 100, 255, 0.3)'
      }}>
        <canvas
          ref={canvasRef}
          width={boardDims.width}
          height={boardDims.height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translateY(${-cameraY}px)`,
            transition: 'transform 0.1s ease-out',
            cursor: ballsRemaining > 0 ? 'pointer' : 'not-allowed',
            backgroundColor: 'transparent'
          }}
          onClick={launchBall}
        />
      </div>
      
      <div style={{ 
        marginTop: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={launchBall}
          disabled={ballsRemaining <= 0 || isPlaying}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: ballsRemaining > 0 && !isPlaying ? '#f59e0b' : '#4a5568',
            border: 'none',
            borderRadius: '6px',
            cursor: ballsRemaining > 0 && !isPlaying ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            boxShadow: ballsRemaining > 0 && !isPlaying ? '0 4px 10px rgba(245, 158, 11, 0.3)' : 'none'
          }}
        >
          Launch Ball
        </button>
        
        <button
          onClick={resetGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
          }}
        >
          Reset Game
        </button>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '6px',
        color: '#fbbf24',
        fontSize: '14px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        Click the board or press "Launch Ball" to drop a ball through the pyramid.
        Watch as it bounces to reveal your Mek's rarity!
      </div>
      </div>
    </>
  );
};

export default MekBagatelle;