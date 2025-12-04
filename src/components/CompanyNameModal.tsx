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

      {/* Modal content - Space Age glass style with color accents */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset, 0 0 40px rgba(0, 200, 220, 0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        {/* Decorative top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 220, 220, 0.6) 20%, rgba(250, 182, 23, 0.6) 50%, rgba(0, 220, 220, 0.6) 80%, transparent 100%)',
          }}
        />
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
          {/* Decorative icon */}
          <div className="flex justify-center mb-4">
            <div
              className="relative w-16 h-16 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 220, 220, 0.15), rgba(0, 220, 220, 0.05))',
                borderRadius: '50%',
                border: '1px solid rgba(0, 220, 220, 0.3)',
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 220, 220, 0.2) 0%, transparent 70%)',
                }}
              />
              {/* Corporation building icon */}
              <svg
                className="w-8 h-8 relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(0, 220, 220, 0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
            </div>
          </div>

          {/* Title with glow */}
          <div className="text-center mb-6">
            <h2
              className="text-2xl sm:text-3xl font-light tracking-wide mb-3"
              style={{
                color: '#ffffff',
                textShadow: mode === 'initial'
                  ? '0 0 20px rgba(0, 220, 220, 0.4), 0 0 40px rgba(0, 220, 220, 0.2)'
                  : 'none',
              }}
            >
              {mode === 'initial' ? 'Name Your Corporation' : 'Edit Corporation Name'}
            </h2>
            <p className="text-white/60 text-sm font-light tracking-wide leading-relaxed">
              {mode === 'initial'
                ? 'Choose a name for your mining corporation. This will be displayed on the leaderboard.'
                : 'Update your corporation name.'}
            </p>
          </div>

          {/* Subtle divider with color */}
          <div
            className="h-px mb-6"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 220, 220, 0.3) 50%, transparent 100%)',
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input field */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-light text-cyan-400/80 mb-2 tracking-wide">
                Corporation Name
              </label>
              <div className="relative group">
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter corporation name..."
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    border: '1px solid rgba(0, 220, 220, 0.25)',
                    boxShadow: '0 0 0 0 rgba(0, 220, 220, 0)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(0, 220, 220, 0.5)';
                    e.target.style.boxShadow = '0 0 20px rgba(0, 220, 220, 0.15), 0 0 40px rgba(0, 220, 220, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(0, 220, 220, 0.25)';
                    e.target.style.boxShadow = '0 0 0 0 rgba(0, 220, 220, 0)';
                  }}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="absolute right-3 top-3 text-xs text-cyan-400/50">
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
                className="group relative w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                style={{
                  background: buttonDisabled
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                    : 'linear-gradient(135deg, rgba(0, 220, 220, 0.25), rgba(0, 180, 180, 0.15))',
                  border: buttonDisabled
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 220, 220, 0.5)',
                  color: buttonDisabled ? 'rgba(255, 255, 255, 0.4)' : '#00dcdc',
                  boxShadow: buttonDisabled ? 'none' : '0 0 20px rgba(0, 220, 220, 0.1)',
                }}
              >
                {/* Honeycomb hover effect */}
                {!buttonDisabled && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{
                      backgroundImage: `url('/random-images/honey-png1.webp')`,
                      backgroundSize: '125%',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <span className="relative z-10 transition-all duration-300 group-hover:[text-shadow:0_0_8px_rgba(0,220,220,0.8)]">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      {mode === 'initial' ? 'Creating...' : 'Updating...'}
                    </span>
                  ) : (
                    mode === 'initial' ? 'Create Corporation' : 'Update Name'
                  )}
                </span>
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
