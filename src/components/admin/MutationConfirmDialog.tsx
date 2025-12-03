'use client';

/**
 * Mutation Confirm Dialog
 *
 * Reusable confirmation dialog for production mutations.
 * Ensures users understand they're modifying live data.
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface MutationConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when user cancels */
  onCancel: () => void;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Title of the action being confirmed */
  title: string;
  /** Description of what will happen */
  description: string;
  /** Optional: specific items that will be affected */
  affectedItems?: string[];
  /** Danger level: 'low' | 'medium' | 'high' */
  dangerLevel?: 'low' | 'medium' | 'high';
  /** Require typing a confirmation word (for high-danger actions) */
  requireTypedConfirmation?: boolean;
  /** The word/phrase that must be typed (default: "CONFIRM") */
  confirmationWord?: string;
  /** Custom confirm button text */
  confirmButtonText?: string;
  /** Loading state while mutation executes */
  isLoading?: boolean;
}

export default function MutationConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  description,
  affectedItems,
  dangerLevel = 'medium',
  requireTypedConfirmation = false,
  confirmationWord = 'CONFIRM',
  confirmButtonText = 'Confirm',
  isLoading = false,
}: MutationConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const [mounted, setMounted] = useState(false);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const canConfirm = requireTypedConfirmation
    ? typedValue.toUpperCase() === confirmationWord.toUpperCase()
    : true;

  const handleConfirm = () => {
    if (canConfirm && !isLoading) {
      setTypedValue('');
      onConfirm();
    }
  };

  const handleCancel = () => {
    setTypedValue('');
    onCancel();
  };

  const dangerColors = {
    low: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-900/20',
      text: 'text-yellow-400',
      button: 'bg-yellow-500 hover:bg-yellow-400',
    },
    medium: {
      border: 'border-orange-500/50',
      bg: 'bg-orange-900/20',
      text: 'text-orange-400',
      button: 'bg-orange-500 hover:bg-orange-400',
    },
    high: {
      border: 'border-red-500/50',
      bg: 'bg-red-900/20',
      text: 'text-red-400',
      button: 'bg-red-500 hover:bg-red-400',
    },
  };

  const colors = dangerColors[dangerLevel];

  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          handleCancel();
        }
      }}
    >
      <div
        className={`bg-gray-900 border-2 ${colors.border} rounded-lg p-6 max-w-lg mx-4 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">
            {dangerLevel === 'high' ? 'Danger' : dangerLevel === 'medium' ? 'Warning' : 'Notice'}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${colors.text}`}>{title}</h3>
            <p className="text-sm text-gray-400 mt-1">Production Database Action</p>
          </div>
        </div>

        {/* Description */}
        <div className={`${colors.bg} border ${colors.border} rounded p-4 mb-4`}>
          <p className="text-sm text-gray-200">{description}</p>

          {/* Affected items list */}
          {affectedItems && affectedItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Affected items:</p>
              <ul className="text-sm text-gray-300 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                {affectedItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Warning text */}
        <div className="mb-4 p-3 bg-black/50 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            This action will modify <strong className="text-white">PRODUCTION</strong> data.
            Changes will immediately affect the live website and real users.
          </p>
        </div>

        {/* Typed confirmation (for high-danger actions) */}
        {requireTypedConfirmation && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Type <span className="font-mono font-bold text-white">{confirmationWord}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={confirmationWord}
              className={`
                w-full px-3 py-2 bg-black/50 border rounded text-white font-mono
                ${canConfirm ? 'border-green-500' : 'border-gray-600'}
                focus:outline-none focus:border-yellow-500
              `}
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={`
              px-4 py-2 ${colors.button} text-black rounded font-bold transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window !== 'undefined' && mounted) {
    return createPortal(dialogContent, document.body);
  }

  return dialogContent;
}

/**
 * Hook for easy mutation confirmation flow
 */
export function useMutationConfirm() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    affectedItems?: string[];
    dangerLevel: 'low' | 'medium' | 'high';
    requireTypedConfirmation: boolean;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    dangerLevel: 'medium',
    requireTypedConfirmation: false,
    onConfirm: () => {},
    isLoading: false,
  });

  const confirm = useCallback((options: {
    title: string;
    description: string;
    affectedItems?: string[];
    dangerLevel?: 'low' | 'medium' | 'high';
    requireTypedConfirmation?: boolean;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title,
        description: options.description,
        affectedItems: options.affectedItems,
        dangerLevel: options.dangerLevel || 'medium',
        requireTypedConfirmation: options.requireTypedConfirmation || false,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        isLoading: false,
      });
    });
  }, []);

  const cancel = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setDialogState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const DialogComponent = useCallback(() => (
    <MutationConfirmDialog
      isOpen={dialogState.isOpen}
      onCancel={cancel}
      onConfirm={dialogState.onConfirm}
      title={dialogState.title}
      description={dialogState.description}
      affectedItems={dialogState.affectedItems}
      dangerLevel={dialogState.dangerLevel}
      requireTypedConfirmation={dialogState.requireTypedConfirmation}
      isLoading={dialogState.isLoading}
    />
  ), [dialogState, cancel]);

  return {
    confirm,
    cancel,
    setLoading,
    Dialog: DialogComponent,
    isOpen: dialogState.isOpen,
  };
}
