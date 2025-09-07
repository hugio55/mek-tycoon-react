"use client";

import { useCallback, useEffect, useRef } from 'react';

export const useClickSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const response = await fetch('/sounds/main_click.wav');
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    loadSound();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBufferRef.current;
      
      // Random pitch variation between 0.9 and 1.1 (±10%) for more noticeable variation
      // Each click gets a completely new random value
      const pitchVariation = 0.9 + Math.random() * 0.2;
      source.playbackRate.value = pitchVariation;
      
      // Set volume with slight random variation too (0.25 to 0.35)
      gainNode.gain.value = 0.25 + Math.random() * 0.1;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start(0);
    }
  }, []);

  return playSound;
};

export const useGlobalClickSound = () => {
  const playSound = useClickSound();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'BUTTON' || 
          target.closest('button') || 
          target.classList.contains('clickable') ||
          target.closest('.clickable')) {
        playSound();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [playSound]);
};