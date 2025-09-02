'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  glow?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  glow = false,
  type = 'button'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold
      hover:from-yellow-300 hover:to-yellow-400
      ${glow ? 'shadow-[0_0_20px_rgba(250,182,23,0.5)]' : ''}
    `,
    secondary: `
      bg-gray-800/50 text-gray-300 border border-gray-700
      hover:bg-gray-700/50 hover:text-white
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white
      hover:from-red-400 hover:to-red-500
      ${glow ? 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 text-white
      hover:from-green-400 hover:to-green-500
      ${glow ? 'shadow-[0_0_20px_rgba(34,197,94,0.5)]' : ''}
    `,
    ghost: `
      bg-transparent text-yellow-400 border border-yellow-400/30
      hover:bg-yellow-400/10 hover:border-yellow-400/50
    `
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    rounded-lg transition-all duration-200 uppercase tracking-wider
    transform hover:scale-105 active:scale-95
  `;

  return (
    <button
      type={type}
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  size = 'md',
  variant = 'ghost',
  className = '',
  disabled = false,
  title
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={`${sizeClasses[size]} !p-0 flex items-center justify-center ${className}`}
      title={title}
    >
      {icon}
    </Button>
  );
};