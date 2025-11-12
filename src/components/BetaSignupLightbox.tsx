'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { validateStakeAddress, isValidStakeAddressFormat } from '@/lib/cardanoValidation';

interface BetaSignupLightboxProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (stakeAddress: string) => void;
}

export default function BetaSignupLightbox({
  isVisible,
  onClose,
  onSubmit
}: BetaSignupLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [stakeAddress, setStakeAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);

  const submitBetaSignup = useMutation(api.betaSignups.submitBetaSignup);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isVisible && mounted) {
      const scrollY = window.scrollY;
      setSavedScrollY(scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, savedScrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible, mounted, savedScrollY]);

  const handleStakeAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStakeAddress(value);

    if (value.trim()) {
      const validation = validateStakeAddress(value);
      setValidationError(validation.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeAddress || isSubmitting) return;

    console.log('[🎮BETA] Validating stake address:', stakeAddress);

    const validation = validateStakeAddress(stakeAddress);
    if (!validation.isValid) {
      console.log('[🎮BETA] Validation failed:', validation.error);
      setValidationError(validation.error || 'Invalid stake address');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      console.log('[🎮BETA] Submitting to Convex...');
      await submitBetaSignup({ stakeAddress });

      console.log('[🎮BETA] Signup successful');
      setIsSuccess(true);
      if (onSubmit) {
        onSubmit(stakeAddress);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[🎮BETA] Signup error:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to submit signup');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStakeAddress('');
    setValidationError(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mounted || !isVisible) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-6 md:px-8"
      onClick={handleBackdropClick}
      style={{
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `
      }} />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Lightbox Card */}
      <div
        className="relative w-full max-w-md"
        style={{
          animation: 'slideUp 400ms cubic-bezier(0.25, 0, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass Card */}
        <div
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
          }}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10 touch-manipulation"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8 md:p-10">
            {!isSuccess ? (
              <>
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3">
                    Join the Beta
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                    In order to join Phase II beta, all you need to do is keep your eyes on our{' '}
                    <a
                      href="#"
                      className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
                    >
                      Discord
                    </a>{' '}
                    channel. If you would like a small perk when Phase II beta launches, please provide your stake address.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Stake Address Input */}
                  <div>
                    <label htmlFor="stake-address" className="sr-only">
                      Stake Address
                    </label>
                    <input
                      id="stake-address"
                      type="text"
                      value={stakeAddress}
                      onChange={handleStakeAddressChange}
                      placeholder="stake1..."
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all touch-manipulation ${
                        validationError
                          ? 'border-red-500/50 focus:border-red-500/70'
                          : 'border-white/10 focus:border-yellow-500/50'
                      }`}
                      style={{
                        minHeight: '48px',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      autoComplete="off"
                    />
                    {validationError && (
                      <p className="mt-2 text-sm text-red-400 font-light">
                        {validationError}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !!validationError || !stakeAddress.trim()}
                    className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 disabled:text-white/50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                    style={{
                      minHeight: '48px',
                      WebkitTapHighlightColor: 'transparent',
                      fontFamily: "'Inter', 'Arial', sans-serif",
                    }}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success Message */
              <div className="text-center py-8 sm:py-12">
                <div className="mb-4 sm:mb-6">
                  <svg
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{
                      animation: 'slideUp 500ms cubic-bezier(0.25, 0, 0.3, 1)',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
                  Welcome Aboard!
                </h3>
                <p className="text-sm sm:text-base text-white/60 font-light">
                  You're on the list. We'll be in touch soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
