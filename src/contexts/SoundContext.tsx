'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClickSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const savedSoundState = localStorage.getItem('soundEnabled');
    if (savedSoundState !== null) {
      setSoundEnabled(savedSoundState === 'true');
    }
  }, []);

  useEffect(() => {
    const loadSound = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        const response = await fetch(getMediaUrl('/sounds/main_click.wav'));
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    loadSound();

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('soundEnabled', String(newValue));
      return newValue;
    });
  }, []);

  const playClickSound = useCallback(() => {
    if (soundEnabled && audioContextRef.current && audioBufferRef.current) {
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
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playClickSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}