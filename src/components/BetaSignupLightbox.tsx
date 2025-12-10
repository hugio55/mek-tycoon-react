'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateStakeAddress, isValidStakeAddressFormat } from '@/lib/cardanoValidation';
import { useWalletVerification } from '@/hooks/useWalletVerification';

interface BetaSignupLightboxProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (stakeAddress: string) => void;
}

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
  | 'name_reservation'     // Veteran wants to reserve/change name
  | 'wallet_verification'  // Verifying wallet ownership for name reservation
  | 'name_confirmed'       // Name successfully reserved/changed
  | 'normal_signup'        // Non-veteran signup flow
  | 'success';             // Final success state

export default function BetaSignupLightbox({
  isVisible,
  onClose,
  onSubmit
}: BetaSignupLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [stakeAddress, setStakeAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);
  const [shouldShake, setShouldShake] = useState(false);

  // Phase I veteran state
  const [step, setStep] = useState<LightboxStep>('address_entry');
  const [veteranInfo, setVeteranInfo] = useState<VeteranInfo | null>(null);
  const [newCorporationName, setNewCorporationName] = useState('');
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
      console.log('[🎮BETA-VETERAN] Wallet verified, proceeding with name reservation');
      await reserveCorporationName();
    },
    onVerificationError: (error) => {
      console.error('[🎮BETA-VETERAN] Wallet verification failed:', error);
    }
  });

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
    setStep('name_reservation');
  };

  const handleSkipNameReservation = () => {
    // Veteran doesn't want to change name, just show success
    setStep('success');
    setTimeout(() => handleClose(), 2000);
  };

  const handleVerifyWallet = async (wallet: { name: string; icon: string; api: any }) => {
    setStep('wallet_verification');
    await verifyWallet(wallet, stakeAddress);
  };

  const handleBackToNameEntry = () => {
    resetWalletVerification();
    setStep('name_reservation');
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
      case 'name_reservation':
        return renderNameReservation();
      case 'wallet_verification':
        return renderWalletVerification();
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
      <div className="mb-4">
        <svg className="animate-spin h-10 w-10 mx-auto text-yellow-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
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
        {/* Gold badge icon */}
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-2">
          Welcome Back, {veteranInfo?.originalCorporationName}!
        </h2>
        <p className="text-sm sm:text-base text-yellow-400/80 font-medium tracking-wide mb-4">
          Phase I Veteran Recognized
        </p>
        <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
          We recognize you from the original Phase I Beta. Since you are already in our system,{' '}
          <span className="text-yellow-400 font-medium">you are automatically entered into Phase II</span>.
        </p>
      </div>

      {/* Name Reservation Option */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
        <p className="text-sm text-white/70 mb-3">
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
        <p className="text-xs text-white/50">
          As a Phase I veteran, you can reserve or change your corporation name before anyone else.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleStartNameReservation}
          className="w-full py-3 sm:py-4 text-base font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 touch-manipulation shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
          style={{ minHeight: '48px', WebkitTapHighlightColor: 'transparent' }}
        >
          {veteranInfo?.hasReservedName ? 'Change Reserved Name' : 'Reserve Corporation Name'}
        </button>

        <button
          onClick={handleSkipNameReservation}
          className="w-full py-3 text-sm font-medium tracking-wide text-white/60 hover:text-white/80 transition-colors touch-manipulation"
          style={{ minHeight: '44px', WebkitTapHighlightColor: 'transparent' }}
        >
          Skip for now
        </button>
      </div>
    </>
  );

  const renderNameReservation = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
          Reserve Your Corporation Name
        </h2>
        <p className="text-sm text-white/60 font-light leading-relaxed">
          Enter the name you want for Phase II. To verify ownership, you'll need to sign a message with your wallet.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="corp-name" className="block text-sm text-white/60 mb-2">
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
            className={`w-full px-4 py-3 text-base bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all ${
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

        {/* Wallet Selection */}
        {!isMobileBrowser && availableWallets.length > 0 && (
          <div>
            <p className="text-sm text-white/60 mb-3">Select wallet to verify ownership:</p>
            <div className="grid grid-cols-2 gap-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleVerifyWallet(wallet)}
                  disabled={!newCorporationName.trim()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded" />
                  <span className="text-sm text-white/80">{wallet.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile browser notice */}
        {isMobileBrowser && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300">
              Mobile wallet connection requires opening this page in your wallet's built-in browser.
              Copy your stake address and open this site from within your wallet app.
            </p>
          </div>
        )}

        {/* No wallets found */}
        {!isMobileBrowser && walletsDetected && availableWallets.length === 0 && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-300">
              No Cardano wallets detected. Please install a wallet extension (Nami, Eternl, Flint, etc.)
              and refresh this page.
            </p>
          </div>
        )}

        <button
          onClick={() => setStep('veteran_welcome')}
          className="w-full py-3 text-sm font-medium tracking-wide text-white/60 hover:text-white/80 transition-colors touch-manipulation"
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
          Verifying Wallet
        </h2>
        <p className="text-sm text-white/60 font-light leading-relaxed">
          {walletStatusMessage}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        {(isConnecting || isVerifying || isRequestingSignature) && (
          <svg className="animate-spin h-12 w-12 text-yellow-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}

        {/* Signature request hint */}
        {isRequestingSignature && (
          <p className="text-sm text-yellow-400 animate-pulse">
            Check your wallet for signature request...
          </p>
        )}

        {/* Error state */}
        {walletError && (
          <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{walletError}</p>
          </div>
        )}

        {/* Back button (always visible) */}
        <button
          onClick={handleBackToNameEntry}
          className="py-2 px-4 text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
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
    <div className="text-center py-8 sm:py-12">
      <div className="mb-4 sm:mb-6">
        <svg
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ animation: 'slideUp 500ms cubic-bezier(0.25, 0, 0.3, 1)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
        {veteranInfo ? "You're All Set!" : "Welcome Aboard!"}
      </h3>
      <p className="text-sm sm:text-base text-white/60 font-light">
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
    </div>
  );

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
          {/* Close Button */}
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
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
