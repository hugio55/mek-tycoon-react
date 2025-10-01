'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface CompanyNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess?: (companyName: string) => void;
  mode?: 'initial' | 'edit';
}

export const CompanyNameModal: React.FC<CompanyNameModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
  mode = 'initial'
}) => {
  const [companyName, setCompanyName] = useState('');
  const [debouncedCompanyName, setDebouncedCompanyName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticName, setOptimisticName] = useState<string | null>(null);

  const setCompanyNameMutation = useMutation(api.goldMining.setCompanyName);

  // Debounce the corporation name check - only check after 625ms pause in typing (500ms + 25%)
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setDebouncedCompanyName(companyName);
      setIsTyping(false);
    }, 625);

    return () => clearTimeout(timer);
  }, [companyName]);

  // Skip availability check in demo mode
  const isDemoMode = walletAddress.includes('demo');
  const checkAvailability = useQuery(
    api.goldMining.checkCompanyNameAvailability,
    !isDemoMode && debouncedCompanyName.trim().length >= 2 ? {
      companyName: debouncedCompanyName.trim(),
      currentWalletAddress: walletAddress
    } : 'skip'
  );

  const currentCompanyName = useQuery(
    api.goldMining.getCompanyName,
    !isDemoMode && walletAddress ? { walletAddress } : 'skip'
  );

  // Set current corporation name when editing
  useEffect(() => {
    if (mode === 'edit' && currentCompanyName?.companyName) {
      setCompanyName(currentCompanyName.companyName);
      setDebouncedCompanyName(currentCompanyName.companyName);
    }
  }, [mode, currentCompanyName]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCompanyName('');
      setDebouncedCompanyName('');
      setError('');
      setIsTyping(false);
    } else if (isOpen && mode === 'edit' && currentCompanyName?.companyName) {
      // Pre-fill when opening in edit mode
      setCompanyName(currentCompanyName.companyName);
      setDebouncedCompanyName(currentCompanyName.companyName);
    }
  }, [isOpen, mode, currentCompanyName]);

  // Clear error when corporation name changes
  useEffect(() => {
    if (error && companyName.trim().length >= 2) {
      setError('');
    }
  }, [companyName, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = companyName.trim();

    if (!trimmedName) {
      setError('Corporation name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Corporation name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Corporation name must be 30 characters or less');
      return;
    }

    // DEMO MODE: Skip database and just accept the name
    const isDemoMode = walletAddress.includes('demo');
    if (isDemoMode) {
      console.log('[DEMO MODE] Accepting corporation name without database save:', trimmedName);
      onSuccess?.(trimmedName);
      onClose();
      setCompanyName('');
      return;
    }

    // Check availability one more time before submitting
    if (checkAvailability && !checkAvailability.available) {
      setError(checkAvailability.error || 'Corporation name is not available');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // OPTIMISTIC UPDATE: Show success immediately
    setOptimisticName(trimmedName);

    try {
      const result = await setCompanyNameMutation({
        walletAddress,
        companyName: trimmedName
      });

      if (result.success) {
        // SUCCESS: Clear optimistic state and close
        setOptimisticName(null);
        onSuccess?.(result.companyName!);
        onClose();
        setCompanyName('');
      } else {
        // ROLLBACK: Clear optimistic state and show error
        setOptimisticName(null);
        setError(result.error || 'Failed to set corporation name');
      }
    } catch (err) {
      // ROLLBACK: Clear optimistic state and show error
      setOptimisticName(null);
      setError('Network error. Please try again.');
      console.error('Corporation name submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (mode === 'edit') {
      // For edit mode, allow closing without setting a name
      onClose();
      setCompanyName('');
      setError('');
    } else {
      // For initial mode, only close if they already have a corporation name
      if (currentCompanyName?.hasCompanyName) {
        onClose();
        setCompanyName('');
        setError('');
      }
    }
  };

  // In demo mode, all names are available
  const isAvailable = isDemoMode ? true : checkAvailability?.available;
  const isChecking = isDemoMode ? false : (companyName.trim().length >= 2 && checkAvailability === undefined);
  const showAvailabilityStatus = isDemoMode ? false : (companyName.trim().length >= 2 && !error && !isTyping);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'initial' ? 'Name Your Corporation' : 'Edit Corporation Name'}
      size="sm"
      showCloseButton={mode === 'edit'}
      closeOnBackdrop={mode === 'edit'}
      className="mek-card-industrial"
    >
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-300 text-sm leading-relaxed">
            {mode === 'initial'
              ? 'Please choose a name for your mining corporation. This will be displayed on the leaderboard and throughout the game.'
              : 'Update your corporation name. This will be displayed on the leaderboard and throughout the game.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-yellow-400 mb-2">
              Corporation Name
            </label>
            <div className="relative">
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter corporation name..."
                maxLength={30}
                className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-500/30 rounded-lg
                         text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none
                         focus:ring-2 focus:ring-yellow-400/20 transition-all"
                disabled={isSubmitting}
                autoFocus
              />
              <div className="absolute right-3 top-3 text-xs text-gray-500">
                {companyName.length}/30
              </div>
            </div>

            {showAvailabilityStatus && (
              <div className="mt-2 text-sm">
                {isChecking ? (
                  <div className="text-yellow-400 flex items-center gap-2">
                    <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    Checking availability...
                  </div>
                ) : isAvailable ? (
                  <div className="text-green-400">
                    ✓ "{companyName.trim()}" is available
                  </div>
                ) : (
                  <div className="text-red-400">
                    ✗ "{companyName.trim()}" is not available
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-2 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Only letters, numbers, and spaces allowed</p>
            <p>• 2-30 characters required</p>
            <p>• Corporation names are case-sensitive</p>
          </div>

          <div className="flex gap-3 pt-2">
            {mode === 'edit' && (
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 mek-button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 mek-button-primary"
              disabled={
                isSubmitting ||
                !companyName.trim() ||
                companyName.trim().length < 2 ||
                (!isDemoMode && checkAvailability && !checkAvailability.available) ||
                isChecking
              }
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  {optimisticName ? 'Confirming...' : (mode === 'initial' ? 'Creating...' : 'Updating...')}
                </div>
              ) : (
                mode === 'initial' ? 'Create Corporation' : 'Update Name'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};