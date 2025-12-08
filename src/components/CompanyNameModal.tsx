'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import HolographicButton from './ui/IndustrialButtons/HolographicButton';
import GlowingBorderInput from './controls/GlowingBorderInput';

interface CompanyNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess?: (companyName: string) => void;
  mode?: 'initial' | 'edit';
  onCancel?: () => void;
}

export const CompanyNameModal: React.FC<CompanyNameModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
  mode = 'initial',
  onCancel
}) => {
  const [mounted, setMounted] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [debouncedCompanyName, setDebouncedCompanyName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase II: Use corporationAuth instead of goldMining for company name management
  const setCompanyNameMutation = useMutation(api.corporationAuth.setCompanyName);

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
  // Phase II: Use corporationAuth instead of goldMining
  const isDemoMode = walletAddress.includes('demo');
  const checkAvailability = useQuery(
    api.corporationAuth.checkCompanyNameAvailability,
    !isDemoMode && debouncedCompanyName.trim().length >= 2 ? {
      companyName: debouncedCompanyName.trim(),
      currentWalletAddress: walletAddress
    } : 'skip'
  );

  const currentCompanyName = useQuery(
    api.corporationAuth.getCompanyName,
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
        onClick={mode === 'edit' ? handleClose : onCancel}
      />

      {/* Modal content - Space Age glass style with color accents */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/20"
        style={{
          background: 'rgba(255,255,255,0.04)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset, 0 0 40px rgba(0, 200, 220, 0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-cyan-500/60"
        />

        <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
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
            {mode === 'initial' && (
              <p className="text-white/60 text-sm font-light tracking-wide leading-relaxed">
                Choose a name for your mining corporation. This will be displayed on the leaderboard.
              </p>
            )}
          </div>

          {/* Subtle divider */}
          <div className="h-px bg-cyan-500/20 mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input field - Glowing Border Style (Cyan) */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-cyan-400 mb-2 tracking-wide">
                Corporation Name
              </label>
              <div className="flex justify-center">
                <GlowingBorderInput
                  id="companyName"
                  value={companyName}
                  onChange={(value) => setCompanyName(value)}
                  placeholder="Enter corporation name..."
                  maxLength={30}
                  showCharacterCount={true}
                  showSearchIcon={false}
                  showFilterButton={false}
                  accentColor="cyan"
                  width={360}
                  disabled={isSubmitting}
                  autoFocus
                  animated={false}
                />
              </div>

              {/* Availability status */}
              {showAvailabilityStatus && (
                <div className="mt-3 text-sm font-semibold">
                  {isChecking ? (
                    <div className="text-white/60 flex items-center gap-2">
                      <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin"></div>
                      Checking availability...
                    </div>
                  ) : isAvailable ? (
                    <div className="text-green-400" style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.5)' }}>
                      ✓ Available
                    </div>
                  ) : (
                    <div className="text-red-400" style={{ textShadow: '0 0 10px rgba(248, 113, 113, 0.5)' }}>
                      ✗ Not available
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
              {/* Fancy HolographicButton for initial creation only */}
              {mode === 'initial' && (
                <div className="w-full">
                  <HolographicButton
                    text={isSubmitting ? 'CREATING...' : 'CREATE CORPORATION'}
                    onClick={() => {
                      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(syntheticEvent);
                    }}
                    isActive={!buttonDisabled}
                    variant="blue"
                    alwaysOn={!buttonDisabled}
                    disabled={buttonDisabled}
                    hideIcon={true}
                    className="w-full"
                    particleSpeed={0.15}
                    textSize="lg"
                    rounded={true}
                  />
                </div>
              )}

              {/* Simple button for edit mode */}
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleSubmit(syntheticEvent);
                  }}
                  disabled={buttonDisabled}
                  className="w-full py-3 px-6 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: buttonDisabled
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(34,211,238,0.2) 100%)',
                    border: `1px solid ${buttonDisabled ? 'rgba(255,255,255,0.1)' : 'rgba(34,211,238,0.5)'}`,
                    color: buttonDisabled ? 'rgba(255,255,255,0.4)' : '#22d3ee',
                    boxShadow: buttonDisabled ? 'none' : '0 0 20px rgba(34,211,238,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    if (!buttonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.5) 0%, rgba(34,211,238,0.35) 100%)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.4)';
                      e.currentTarget.style.borderColor = 'rgba(34,211,238,0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!buttonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(34,211,238,0.2) 100%)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)';
                    }
                  }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Name'}
                </button>
              )}

              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-center text-white/40 hover:text-white/70 text-sm font-light tracking-wide transition-colors disabled:opacity-50 pt-3"
                >
                  Cancel
                </button>
              )}
              {mode === 'initial' && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-center text-white/40 hover:text-white/70 text-sm font-light tracking-wide transition-colors disabled:opacity-50 pt-3"
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
