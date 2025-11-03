"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmationLightboxProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationLightbox({
  isOpen,
  onConfirm,
  onCancel,
  title = "CONFIRM ACTION",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmationLightboxProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
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

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mek-card-industrial mek-border-sharp-gold overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-yellow-500/30 bg-black/40">
            <h2 className="mek-text-industrial text-xl text-yellow-400">
              {title}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Message */}
            <p className="text-gray-300 text-base leading-relaxed">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 mek-button-secondary"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 mek-button-primary"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}
