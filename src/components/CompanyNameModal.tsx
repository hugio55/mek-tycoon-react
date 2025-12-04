'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  const [mounted, setMounted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [debouncedCompanyName, setDebouncedCompanyName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCompanyNameMutation = useMutation(api.goldMining.setCompanyName);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounce the corporation name check
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

    // DEMO MODE: Skip database
    if (isDemoMode) {
      onSuccess?.(trimmedName);
      onClose();
      setCompanyName('');
      return;
    }

    // Check availability
    if (checkAvailability && !checkAvailability.available) {
      setError(checkAvailability.error || 'Corporation name is not available');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await setCompanyNameMutation({
        walletAddress,
        companyName: trimmedName
      });

      if (result.success) {
        onSuccess?.(result.companyName!);
        onClose();
        setCompanyName('');
      } else {
        setError(result.error || 'Failed to set corporation name');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('[CompanyNameModal] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (mode === 'edit') {
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

  const isAvailable = isDemoMode ? true : checkAvailability?.available;
  const isChecking = isDemoMode ? false : (companyName.trim().length >= 2 && checkAvailability === undefined);
  const showAvailabilityStatus = isDemoMode ? false : (companyName.trim().length >= 2 && !error && !isTyping);

  const buttonDisabled = isSubmitting ||
    !companyName.trim() ||
    companyName.trim().length < 2 ||
    (!isDemoMode && checkAvailability && !checkAvailability.available) ||
    isChecking;

  if (!mounted || !isOpen) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Space Age backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={mode === 'edit' ? handleClose : undefined}
      />

      {/* Modal content - Space Age glass style */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        {/* Close button - only in edit mode */}
        {mode === 'edit' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10"
            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-3">
              {mode === 'initial' ? 'Name Your Corporation' : 'Edit Corporation Name'}
            </h2>
            <p className="text-white/50 text-sm font-light tracking-wide leading-relaxed">
              {mode === 'initial'
                ? 'Choose a name for your mining corporation. This will be displayed on the leaderboard.'
                : 'Update your corporation name.'}
            </p>
          </div>

          {/* Subtle divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input field */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-light text-white/70 mb-2 tracking-wide">
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
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="absolute right-3 top-3 text-xs text-white/40">
                  {companyName.length}/30
                </div>
              </div>

              {/* Availability status */}
              {showAvailabilityStatus && (
                <div className="mt-2 text-sm font-light">
                  {isChecking ? (
                    <div className="text-white/60 flex items-center gap-2">
                      <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin"></div>
                      Checking availability...
                    </div>
                  ) : isAvailable ? (
                    <div className="text-green-400">
                      Available
                    </div>
                  ) : (
                    <div className="text-red-400">
                      Not available
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-2 text-sm text-red-400 font-light">
                  {error}
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="text-xs text-white/40 space-y-1 font-light tracking-wide">
              <p>Letters, numbers, and spaces allowed</p>
              <p>2-30 characters required</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={buttonDisabled}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: buttonDisabled
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                    : 'linear-gradient(135deg, rgba(250, 182, 23, 0.3), rgba(250, 182, 23, 0.15))',
                  border: buttonDisabled
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(250, 182, 23, 0.5)',
                  color: buttonDisabled ? 'rgba(255, 255, 255, 0.4)' : '#fab617',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                    {mode === 'initial' ? 'Creating...' : 'Updating...'}
                  </span>
                ) : (
                  mode === 'initial' ? 'Create Corporation' : 'Update Name'
                )}
              </button>

              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
