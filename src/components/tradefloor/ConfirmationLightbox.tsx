"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmationLightboxProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationLightbox({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "danger",
  onConfirm,
  onCancel,
}: ConfirmationLightboxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!mounted) return null;

  const confirmButtonStyles = confirmStyle === "danger"
    ? {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
      }
    : {
        background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
        color: 'black',
        boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
      };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={onCancel}
      />

      {/* Content */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p
            className="text-white/80"
            style={{ fontFamily: 'Play, sans-serif', lineHeight: 1.6 }}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: 'Inter, sans-serif',
              ...confirmButtonStyles,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
