"use client";

import { useEffect, useRef } from 'react';

interface CraftingTreeVisualProps {
  selectedCategory: 'main' | 'group' | 'style' | 'variation';
  selectedType?: 'heads' | 'bodies' | 'traits';
  selectedGroup?: string;
  selectedStyle?: string;
}

export default function CraftingTreeVisual({ 
  selectedCategory, 
  selectedType, 
  selectedGroup, 
  selectedStyle 
}: CraftingTreeVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(250, 182, 23, 0.05)');
    gradient.addColorStop(1, 'rgba(250, 182, 23, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tree visualization
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw connecting lines
    ctx.strokeStyle = 'rgba(250, 182, 23, 0.3)';
    ctx.lineWidth = 2;

    if (selectedCategory === 'main' && selectedType) {
      // Draw lines from center to groups
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * 150;
        const y = centerY + Math.sin(angle) * 150;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw node
        ctx.fillStyle = 'rgba(250, 182, 23, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (selectedCategory === 'group' && selectedGroup) {
      // Draw branches for styles
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = centerX + Math.cos(angle) * 180;
        const y = centerY + Math.sin(angle) * 180;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw node
        ctx.fillStyle = 'rgba(250, 182, 23, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (selectedCategory === 'style' && selectedStyle) {
      // Draw final variations
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12;
        const x = centerX + Math.cos(angle) * 200;
        const y = centerY + Math.sin(angle) * 200;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw node with glow effect
        const nodeGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        nodeGradient.addColorStop(0, 'rgba(250, 182, 23, 1)');
        nodeGradient.addColorStop(1, 'rgba(250, 182, 23, 0.3)');
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw center node
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
    centerGradient.addColorStop(0, 'rgba(250, 182, 23, 1)');
    centerGradient.addColorStop(0.5, 'rgba(250, 182, 23, 0.7)');
    centerGradient.addColorStop(1, 'rgba(250, 182, 23, 0.3)');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Add animated particles
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animate particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.size *= 0.98;

        if (particle.size < 0.5) {
          particles.splice(index, 1);
        }

        ctx.fillStyle = `rgba(250, 182, 23, ${particle.size / 3})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add new particles occasionally
      if (Math.random() > 0.95 && particles.length < 20) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1
        });
      }
    };

    // Start subtle animation
    const animationId = setInterval(animate, 50);

    return () => clearInterval(animationId);
  }, [selectedCategory, selectedType, selectedGroup, selectedStyle]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full opacity-50"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
}