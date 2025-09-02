"use client";

import React from 'react';
import { useClickSound } from '@/lib/useClickSound';

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const SoundButton: React.FC<SoundButtonProps> = ({ 
  children, 
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
  ...props 
}) => {
  const playSound = useClickSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound();
    onClick?.(e);
  };

  const baseClasses = 'transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-black border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10',
    primary: 'bg-yellow-400 text-black font-bold hover:bg-yellow-500',
    secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-yellow-400 hover:bg-yellow-400/10'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};