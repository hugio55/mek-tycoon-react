'use client';

import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div className={`
        relative w-full ${sizeClasses[size]}
        bg-gradient-to-b from-gray-900 to-black
        border-2 border-yellow-400/30 rounded-xl
        shadow-[0_0_40px_rgba(250,182,23,0.2)]
        scale-75 sm:scale-90
        my-auto sm:my-0
        ${className}
      `}>
        {title && (
          <div className="border-b border-yellow-400/30 px-6 py-4">
            <h2 className="text-2xl font-bold text-yellow-400 font-orbitron uppercase tracking-wider">
              {title}
            </h2>
          </div>
        )}
        
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors text-2xl"
          >
            ×
          </button>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface IndustrialModalProps extends ModalProps {
  showWarningStripes?: boolean;
}

export const IndustrialModal: React.FC<IndustrialModalProps> = ({
  showWarningStripes = false,
  children,
  ...props
}) => {
  return (
    <Modal {...props}>
      {showWarningStripes && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-repeating-linear-gradient(
          45deg,
          #fab617,
          #fab617 10px,
          #000 10px,
          #000 20px
        )" />
      )}
      {children}
    </Modal>
  );
};