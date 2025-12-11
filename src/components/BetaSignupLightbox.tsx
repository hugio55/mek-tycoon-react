'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateStakeAddress, isValidStakeAddressFormat } from '@/lib/cardanoValidation';
import { useWalletVerification } from '@/hooks/useWalletVerification';
import CubeSpinner from '@/components/loaders/CubeSpinner';

// Phase I veteran data from backend
interface VeteranInfo {
  isVeteran: boolean;
  originalCorporationName: string;
  reservedCorporationName: string | null;
  nameReservedAt: number | null;
  hasReservedName: boolean;
}

type LightboxStep =
  | 'address_entry'        // Initial step - enter stake address
  | 'checking_veteran'     // Checking if address is Phase I veteran
  | 'veteran_welcome'      // Phase I veteran recognized - show welcome
  | 'wallet_selection'     // Select wallet to verify ownership (before name input)
  | 'wallet_verification'  // Verifying wallet ownership
  | 'name_input'           // Enter corporation name (after wallet verified)
  | 'name_confirmed'       // Name successfully reserved/changed
  | 'normal_signup'        // Non-veteran signup flow
  | 'success';             // Final success state

// Export types for preview mode
export type { LightboxStep as BetaSignupStep, VeteranInfo };

interface BetaSignupLightboxProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (stakeAddress: string) => void;
  // Preview mode props - for admin lightbox preview
  previewMode?: boolean;
  previewStep?: LightboxStep;
  previewVeteranInfo?: VeteranInfo;
  previewIsVeteran?: boolean;
  previewError?: string;
}

// Mock data for preview mode
const MOCK_VETERAN_INFO: VeteranInfo = {
  isVeteran: true,
  originalCorporationName: 'WrenCo Industries',
  reservedCorporationName: null,
  nameReservedAt: null,
  hasReservedName: false,
};

const MOCK_VETERAN_WITH_RESERVED: VeteranInfo = {
  isVeteran: true,
  originalCorporationName: 'WrenCo Industries',
  reservedCorporationName: 'WrenCo Phase II',
  nameReservedAt: Date.now(),
  hasReservedName: true,
};

const MOCK_WALLETS = [
  { name: 'Eternl', icon: '/wallet-icons/eternl.png', api: {} },
  { name: 'Nami', icon: '/wallet-icons/nami.png', api: {} },
  { name: 'Flint', icon: '/wallet-icons/flint.png', api: {} },
  { name: 'Vespr', icon: '/wallet-icons/vespr.png', api: {} },
];

export default function BetaSignupLightbox({
  isVisible,
  onClose,
  onSubmit,
  previewMode = false,
  previewStep,
  previewVeteranInfo,
  previewIsVeteran = true,
  previewError,
}: BetaSignupLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [stakeAddress, setStakeAddress] = useState(previewMode ? 'stake1u8z4d32ythwc...' : '');
  const [validationError, setValidationError] = useState<string | null>(previewError || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);
  const [shouldShake, setShouldShake] = useState(false);

  // Phase I veteran state - use preview values if in preview mode
  const [step, setStep] = useState<LightboxStep>(previewStep || 'address_entry');
  const [veteranInfo, setVeteranInfo] = useState<VeteranInfo | null>(
    previewMode ? (previewVeteranInfo || MOCK_VETERAN_INFO) : null
  );
  const [newCorporationName, setNewCorporationName] = useState(
    previewMode && previewVeteranInfo ?
      (previewVeteranInfo.reservedCorporationName || previewVeteranInfo.originalCorporationName) :
      ''
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [isReservingName, setIsReservingName] = useState(false);

  // Wallet verification hook
  const {
    availableWallets,
    isMobileBrowser,
    walletsDetected,
    verifyWallet,
    reset: resetWalletVerification,
    status: walletStatus,
    error: walletError,
    isConnecting,
    isRequestingSignature,
    isVerifying,
    isSuccess: walletVerified,
    statusMessage: walletStatusMessage,
  } = useWalletVerification({
    onVerificationSuccess: async () => {
      console.log('[🎮BETA-VETERAN] Wallet verified, proceeding to name input');
      // Go to name input step after wallet verification succeeds
      setStep('name_input');
    },
    onVerificationError: (error) => {
      console.error('[🎮BETA-VETERAN] Wallet verification failed:', error);
    }
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync step when previewStep changes in preview mode
  useEffect(() => {
    if (previewMode && previewStep) {
      setStep(previewStep);
    }
  }, [previewMode, previewStep]);

  // Sync veteranInfo when previewVeteranInfo changes in preview mode
  useEffect(() => {
    if (previewMode && previewVeteranInfo) {
      setVeteranInfo(previewVeteranInfo);
      setNewCorporationName(previewVeteranInfo.reservedCorporationName || previewVeteranInfo.originalCorporationName);
    }
  }, [previewMode, previewVeteranInfo]);

  useEffect(() => {
    // Skip scroll locking in preview mode
    if (previewMode) return;

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
  }, [isVisible, mounted, savedScrollY, previewMode]);

  const handleStakeAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStakeAddress(value);
    setValidationError(null);
  };

  // Check if stake address is a Phase I veteran
  const checkPhase1Veteran = async (address: string): Promise<VeteranInfo | null> => {
    try {
      console.log('[🎮BETA-VETERAN] Checking Phase I veteran status for:', address);
      const response = await fetch(`/api/phase1-veteran?stakeAddress=${encodeURIComponent(address)}`);
      if (!response.ok) {
        console.log('[🎮BETA-VETERAN] Not a Phase I veteran');
        return null;
      }
      const data = await response.json();
      console.log('[🎮BETA-VETERAN] Veteran check result:', data);
      return data;
    } catch (error) {
      console.error('[🎮BETA-VETERAN] Error checking veteran status:', error);
      return null;
    }
  };

  // Reserve corporation name (called after wallet verification)
  const reserveCorporationName = async () => {
    if (!newCorporationName.trim()) {
      setNameError('Please enter a corporation name');
      return;
    }

    setIsReservingName(true);
    setNameError(null);

    try {
      console.log('[🎮BETA-VETERAN] Reserving corporation name:', newCorporationName);
      const response = await fetch('/api/phase1-veteran/reserve-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeAddress,
          newCorporationName: newCorporationName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reserve name');
      }

      console.log('[🎮BETA-VETERAN] Name reserved successfully');

      // Update veteran info with new reserved name
      setVeteranInfo(prev => prev ? {
        ...prev,
        reservedCorporationName: newCorporationName.trim(),
        hasReservedName: true,
        nameReservedAt: Date.now(),
      } : null);

      setStep('name_confirmed');
    } catch (error) {
      console.error('[🎮BETA-VETERAN] Name reservation failed:', error);
      setNameError(error instanceof Error ? error.message : 'Failed to reserve name');
    } finally {
      setIsReservingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stakeAddress.trim()) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    if (isSubmitting) return;

    console.log('[🎮BETA] Validating stake address:', stakeAddress);

    const validation = validateStakeAddress(stakeAddress);
    if (!validation.isValid) {
      console.log('[🎮BETA] Validation failed:', validation.error);
      setValidationError('Sorry, this is not a valid stake address.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    setStep('checking_veteran');

    // Check if this is a Phase I veteran
    const veteran = await checkPhase1Veteran(stakeAddress);

    if (veteran && veteran.isVeteran) {
      // Phase I veteran found!
      setVeteranInfo(veteran);
      setNewCorporationName(veteran.reservedCorporationName || veteran.originalCorporationName);
      setStep('veteran_welcome');
      setIsSubmitting(false);
    } else {
      // Not a veteran, proceed with normal signup
      setStep('normal_signup');
      await submitNormalSignup();
    }
  };

  const submitNormalSignup = async () => {
    try {
      console.log('[🎮BETA] Submitting via API route...');

      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stakeAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signup');
      }

      console.log('[🎮BETA] Signup successful');
      setStep('success');
      if (onSubmit) {
        onSubmit(stakeAddress);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[🎮BETA] Signup error:', error);
      let errorMessage = error instanceof Error ? error.message : 'Failed to submit signup';
      errorMessage = errorMessage.replace(/^Uncaught Error:\s*/i, '');
      errorMessage = errorMessage.split(' at ')[0].trim();
      setValidationError(errorMessage);
      setStep('address_entry');
      setIsSubmitting(false);
    }
  };

  const handleStartNameReservation = () => {
    // Go to wallet selection first (verify ownership before name input)
    setStep('wallet_selection');
  };

  const handleSkipNameReservation = () => {
    // Veteran doesn't want to change name, just show success
    // Don't auto-close - let them read and dismiss manually
    setStep('success');
  };

  const handleVerifyWallet = async (wallet: { name: string; icon: string; api: any }) => {
    setStep('wallet_verification');
    await verifyWallet(wallet, stakeAddress);
  };

  const handleBackToWalletSelection = () => {
    resetWalletVerification();
    setStep('wallet_selection');
  };

  const handleClose = () => {
    setStakeAddress('');
    setValidationError(null);
    setIsSubmitting(false);
    setStep('address_entry');
    setVeteranInfo(null);
    setNewCorporationName('');
    setNameError(null);
    resetWalletVerification();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!mounted || !isVisible) return null;

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 'address_entry':
        return renderAddressEntry();
      case 'checking_veteran':
        return renderLoading('Checking your status...');
      case 'veteran_welcome':
        return renderVeteranWelcome();
      case 'wallet_selection':
        return renderWalletSelection();
      case 'wallet_verification':
        return renderWalletVerification();
      case 'name_input':
        return renderNameInput();
      case 'name_confirmed':
        return renderNameConfirmed();
      case 'normal_signup':
        return renderLoading('Submitting signup...');
      case 'success':
        return renderSuccess();
      default:
        return renderAddressEntry();
    }
  };

  const renderLoading = (message: string) => (
    <div className="text-center py-8">
      <div className="mb-10 flex justify-center">
        <CubeSpinner color="cyan" size={44} />
      </div>
      <p className="text-white/60">{message}</p>
    </div>
  );

  const renderAddressEntry = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide mb-3">
          Join the Beta
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
          In order to join Phase II beta, all you need to do is keep your eyes on our{' '}
          <a
            href="https://discord.gg/KnqMF6Ayyc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
          >
            Discord
          </a>{' '}
          channel. If you would like a small perk when Phase II beta launches and a guaranteed position, please provide your stake address.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              animation: shouldShake ? 'shakeRed 0.5s ease-in-out' : 'none',
            }}
            autoComplete="off"
          />
          {validationError && (
            <p className="mt-3 text-sm sm:text-base text-red-400 font-semibold tracking-wide leading-relaxed">
              {validationError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
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
              Checking...
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </form>
    </>
  );

  const renderVeteranWelcome = () => (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-4">
          Welcome Back, {veteranInfo?.originalCorporationName}!
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
          We recognize you from the original Phase I Beta. Since you are already in our system,{' '}
          <span className="font-semibold text-white/60">you are automatically entered into Phase II</span>.
        </p>
      </div>

      {/* Name Reservation Option */}
      <div
        className="p-4 rounded-xl border border-blue-500/30 mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <p className="text-sm sm:text-base text-white/70 mb-3">
          {veteranInfo?.hasReservedName ? (
            <>
              Your reserved corporation name for Phase II:{' '}
              <span className="text-yellow-400 font-semibold">{veteranInfo.reservedCorporationName}</span>
            </>
          ) : (
            <>
              Your Phase I corporation name:{' '}
              <span className="text-white font-semibold">{veteranInfo?.originalCorporationName}</span>
            </>
          )}
        </p>
        <p className="text-sm sm:text-base text-white/60">
          As a Phase I veteran, you can reserve or change your corporation name before anyone else.
        </p>
      </div>

      <div>
        <button
          onClick={handleStartNameReservation}
          className="w-full py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
          style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent' }}
        >
          {veteranInfo?.hasReservedName ? 'Change Corporation Name' : 'Choose Corporation Name'}
        </button>

        <button
          onClick={handleSkipNameReservation}
          className="w-full pt-3 pb-0 text-sm font-medium tracking-wide text-white/60 hover:text-white/80 transition-colors touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Skip for now
        </button>
      </div>
    </>
  );

  const renderWalletSelection = () => {
    // Use mock wallets in preview mode
    const walletsToShow = previewMode ? MOCK_WALLETS : availableWallets;
    const showMobileBrowser = previewMode ? false : isMobileBrowser;
    const showNoWallets = previewMode ? false : (!isMobileBrowser && walletsDetected && availableWallets.length === 0);

    return (
      <>
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
            Verify Wallet Ownership
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
            To reserve your corporation name, please verify that you own this wallet by signing a message.
          </p>
        </div>

        <div className="space-y-4">
          {/* Wallet Selection */}
          {!showMobileBrowser && walletsToShow.length > 0 && (
            <div>
              <p className="text-sm sm:text-base text-white/60 mb-3">Select your wallet:</p>
              <div className="grid grid-cols-2 gap-3">
                {walletsToShow.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => !previewMode && handleVerifyWallet(wallet)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all text-center"
                  >
                    <span className="text-base text-white/80">{wallet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile browser notice */}
          {showMobileBrowser && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm sm:text-base text-blue-300">
                Mobile wallet connection requires opening this page in your wallet's built-in browser.
                Copy your stake address and open this site from within your wallet app.
              </p>
            </div>
          )}

          {/* No wallets found */}
          {showNoWallets && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm sm:text-base text-yellow-300">
                No Cardano wallets detected. Please install a wallet extension (Nami, Eternl, Flint, etc.)
                and refresh this page.
              </p>
            </div>
          )}

          <button
            onClick={() => setStep('veteran_welcome')}
            className="w-full pt-3 pb-0 text-sm font-medium tracking-wide text-white/60 hover:text-white/80 transition-colors touch-manipulation"
          >
            ← Back
          </button>
        </div>
      </>
    );
  };

  const renderNameInput = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
          Reserve Your Corporation Name
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
          Wallet verified! Enter the name you want for Phase II.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="corp-name" className="block text-sm sm:text-base text-white/60 mb-2">
            Corporation Name
          </label>
          <input
            id="corp-name"
            type="text"
            value={newCorporationName}
            onChange={(e) => {
              setNewCorporationName(e.target.value);
              setNameError(null);
            }}
            placeholder="Enter corporation name"
            maxLength={30}
            disabled={isReservingName}
            className={`w-full px-4 py-3 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all ${
              nameError ? 'border-red-500/50' : 'border-white/10 focus:border-yellow-500/50'
            }`}
            style={{ minHeight: '48px' }}
          />
          <div className="flex justify-between mt-1">
            {nameError ? (
              <p className="text-sm text-red-400">{nameError}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-white/40">{newCorporationName.length}/30</span>
          </div>
        </div>

        <button
          onClick={reserveCorporationName}
          disabled={!newCorporationName.trim() || isReservingName}
          className="w-full py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 disabled:text-white/50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
          style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent' }}
        >
          {isReservingName ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Reserving...
            </span>
          ) : (
            'Reserve Name'
          )}
        </button>

        <button
          onClick={() => setStep('veteran_welcome')}
          disabled={isReservingName}
          className="w-full pt-3 pb-0 text-sm font-medium tracking-wide text-white/60 hover:text-white/80 disabled:opacity-50 transition-colors touch-manipulation"
        >
          ← Back
        </button>
      </div>
    </>
  );

  const renderWalletVerification = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
          {walletError ? 'Verification Failed' : 'Verifying Wallet'}
        </h2>
        {!walletError && (
          <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
            {walletStatusMessage}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        {(isConnecting || isVerifying || isRequestingSignature) && !walletError && (
          <svg className="animate-spin h-12 w-12 text-yellow-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}

        {/* Signature request hint */}
        {isRequestingSignature && !walletError && (
          <p className="text-sm text-yellow-400 animate-pulse">
            Check your wallet for signature request...
          </p>
        )}

        {/* Error state */}
        {walletError && (
          <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm sm:text-base text-red-400 text-center">{walletError}</p>
          </div>
        )}

        {/* Back button (always visible) */}
        <button
          onClick={handleBackToWalletSelection}
          className="w-full pt-3 pb-0 text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
        >
          ← Try different wallet
        </button>
      </div>
    </>
  );

  const renderNameConfirmed = () => (
    <div className="text-center py-4">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ animation: 'slideUp 500ms cubic-bezier(0.25, 0, 0.3, 1)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
        Name Reserved!
      </h3>
      <p className="text-base text-white/70 mb-4">
        Your corporation name for Phase II:{' '}
        <span className="text-yellow-400 font-semibold">{newCorporationName}</span>
      </p>
      <p className="text-sm text-white/50">
        You can come back and change this anytime by verifying your wallet again.
      </p>

      <button
        onClick={handleClose}
        className="mt-6 w-full py-3 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20"
        style={{ minHeight: '48px' }}
      >
        Done
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-4">
      <div className="mb-4">
        <svg
          className="w-16 h-16 mx-auto text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ animation: 'slideUp 500ms cubic-bezier(0.25, 0, 0.3, 1)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
        {veteranInfo ? "You're All Set!" : "Welcome Aboard!"}
      </h3>
      <p className="text-sm sm:text-base text-white/60 font-light mb-4">
        Keep an eye on the Announcements channel in our{' '}
        <a
          href="https://discord.gg/KnqMF6Ayyc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
        >
          Discord
        </a>
        .
      </p>

      <button
        onClick={handleClose}
        className="mt-2 w-full py-3 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20"
        style={{ minHeight: '48px' }}
      >
        Done
      </button>
    </div>
  );

  // In preview mode, render inline (no portal) with a container wrapper
  if (previewMode) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        {/* Glass Card - no backdrop in preview mode */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
        >
          <div className="p-6 sm:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-6 md:px-8"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 300ms ease-out' }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInBlur {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
              -webkit-backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
            }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate3d(0, 30px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes shakeRed {
            0%, 100% { transform: translateX(0); border-color: rgba(239, 68, 68, 0.5); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
        `
      }} />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'fadeInBlur 600ms ease-out',
        }}
        onClick={handleBackdropClick}
      />

      {/* Lightbox Card */}
      <div
        className="relative w-full max-w-md"
        style={{
          animation: 'slideUp 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass Card */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
          }}
        >
          {/* Content */}
          <div className="p-6 sm:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
