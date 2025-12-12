'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BetaSignupLightbox, { type BetaSignupStep, type VeteranInfo } from './BetaSignupLightbox';
import NMKRPayLightbox, { type NMKRPayState } from './NMKRPayLightbox';

type NodeType = 'start' | 'screen' | 'decision' | 'action' | 'end' | 'api' | 'error' | 'special';

// Mock veteran info for previews
const MOCK_VETERAN_INFO: VeteranInfo = {
  isVeteran: true,
  originalCorporationName: 'Stellar Depletion Syndicate',
  reservedCorporationName: null,
  nameReservedAt: null,
  hasReservedName: false,
};

const MOCK_VETERAN_WITH_RESERVED: VeteranInfo = {
  isVeteran: true,
  originalCorporationName: 'Stellar Depletion Syndicate',
  reservedCorporationName: 'Stellar Depletion Phase II',
  nameReservedAt: Date.now(),
  hasReservedName: true,
};

// Beta Signup steps to preview
const BETA_SIGNUP_STEPS: { step: BetaSignupStep; label: string; description: string; veteranInfo?: VeteranInfo }[] = [
  { step: 'address_entry', label: 'Address Entry', description: 'Initial screen where user enters stake address' },
  { step: 'checking_veteran', label: 'Checking Veteran', description: 'Loading spinner while checking veteran status' },
  { step: 'veteran_welcome', label: 'Veteran Welcome', description: 'Phase I veteran recognized', veteranInfo: MOCK_VETERAN_INFO },
  { step: 'wallet_selection', label: 'Wallet Selection', description: 'Choose wallet to verify ownership', veteranInfo: MOCK_VETERAN_INFO },
  { step: 'wallet_verification', label: 'Wallet Verification', description: 'Verifying wallet signature', veteranInfo: MOCK_VETERAN_INFO },
  { step: 'name_input', label: 'Name Input', description: 'Enter new corporation name', veteranInfo: MOCK_VETERAN_INFO },
  { step: 'name_confirmed', label: 'Name Confirmed', description: 'Name reservation successful', veteranInfo: MOCK_VETERAN_WITH_RESERVED },
  { step: 'normal_signup', label: 'Normal Signup', description: 'Non-veteran signup processing' },
  { step: 'success', label: 'Success', description: 'Signup complete screen' },
];

// NMKR Pay steps to preview
const NMKR_PAY_STEPS: { step: NMKRPayState; label: string; description: string }[] = [
  { step: 'loading_campaign', label: 'Loading Campaign', description: 'Initial loading spinner' },
  { step: 'no_campaign', label: 'No Campaign', description: 'No active campaigns available' },
  { step: 'address_entry', label: 'Address Entry', description: 'Enter stake address' },
  { step: 'checking_eligibility', label: 'Checking Eligibility', description: 'Verifying participation' },
  { step: 'ineligible', label: 'Ineligible', description: 'Not eligible for campaign' },
  { step: 'already_claimed', label: 'Already Claimed', description: 'User already claimed NFT' },
  { step: 'corporation_verified', label: 'Corporation Verified', description: 'Eligible - corp name shown' },
  { step: 'creating', label: 'Creating Reservation', description: 'Reserving NFT' },
  { step: 'reserved', label: 'Reserved', description: 'NFT reserved, ready to pay' },
  { step: 'wallet_verification', label: 'Wallet Verification', description: 'Desktop wallet selection' },
  { step: 'payment', label: 'Payment', description: 'Complete payment in NMKR' },
  { step: 'payment_window_closed', label: 'Payment Window Closed', description: 'Did you complete payment?' },
  { step: 'processing', label: 'Processing', description: 'Waiting for blockchain confirmation' },
  { step: 'success', label: 'Success', description: 'NFT claimed successfully' },
  { step: 'timeout', label: 'Timeout', description: 'Reservation timed out' },
  { step: 'error', label: 'Error', description: 'Something went wrong' },
  { step: 'cancel_confirmation', label: 'Cancel Confirmation', description: 'Confirm cancel dialog' },
];

interface FlowNodeProps {
  label: string;
  sublabel?: string;
  type: NodeType;
  buttons?: string[];
  className?: string;
  onClick?: () => void;
}

function FlowNode({ label, sublabel, type, buttons, className = '', onClick }: FlowNodeProps) {
  const baseClasses = "px-3 py-2 text-center text-sm rounded-lg border-2 transition-all min-w-[180px]";

  const styles: Record<NodeType, string> = {
    start: "bg-green-900/70 border-green-500 text-green-300",
    screen: "bg-blue-900/60 border-blue-500/70 text-blue-200",
    decision: "bg-yellow-900/60 border-yellow-500/70 text-yellow-200",
    action: "bg-purple-900/50 border-purple-500/60 text-purple-200",
    end: "bg-green-900/70 border-green-500 text-green-300",
    api: "bg-gray-800 border-gray-500 text-gray-300",
    error: "bg-red-900/50 border-red-500/70 text-red-200",
    special: "bg-cyan-900/70 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20",
  };

  const clickableStyles = onClick ? "cursor-pointer hover:scale-105 hover:brightness-110 active:scale-100" : "";

  return (
    <div
      className={`${baseClasses} ${styles[type]} ${clickableStyles} ${className}`}
      onClick={onClick}
      title={onClick ? "Click to preview this screen" : undefined}
    >
      <div className="font-medium">{label}</div>
      {sublabel && <div className="text-xs opacity-70 mt-0.5">{sublabel}</div>}
      {buttons && buttons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current/20 text-xs space-y-1">
          {buttons.map((btn, i) => (
            <div key={i} className="px-2 py-0.5 bg-black/20 rounded text-[10px]">{btn}</div>
          ))}
        </div>
      )}
      {onClick && (
        <div className="mt-2 text-[9px] opacity-50 uppercase tracking-wider">Click to preview</div>
      )}
    </div>
  );
}

function Arrow({ label, condition }: { label?: string; condition?: 'yes' | 'no' | 'action' | 'auto' }) {
  const conditionColors: Record<string, string> = {
    yes: 'text-green-400 bg-green-900/50 border-green-500/30',
    no: 'text-red-400 bg-red-900/50 border-red-500/30',
    action: 'text-blue-400 bg-blue-900/50 border-blue-500/30',
    auto: 'text-gray-400 bg-gray-800/50 border-gray-500/30',
  };

  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className="text-gray-500 text-lg">↓</span>
      {label && (
        <span className={`text-[10px] px-2 py-0.5 rounded border ${condition ? conditionColors[condition] : 'text-gray-500 bg-gray-800/50 border-gray-600/30'}`}>
          {label}
        </span>
      )}
    </div>
  );
}

function DecisionDiamond({ label, options }: { label: string; options?: { yes: string; no: string } }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-32 h-32 bg-yellow-900/60 border-2 border-yellow-500/70 transform rotate-45 rounded-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-yellow-200 text-xs font-bold text-center whitespace-pre-line transform -rotate-0 px-2">
            {label}
          </span>
        </div>
      </div>
      {options && (
        <div className="flex gap-4 mt-2 text-[10px]">
          <span className="text-green-400">YES: {options.yes}</span>
          <span className="text-red-400">NO: {options.no}</span>
        </div>
      )}
    </div>
  );
}

function SplitPaths({ children, labels }: { children: React.ReactNode[]; labels?: string[] }) {
  return (
    <div className="flex gap-6 items-start">
      {children.map((child, i) => (
        <div key={i} className="flex flex-col items-center">
          {labels && labels[i] && (
            <div className={`text-xs mb-2 px-2 py-0.5 rounded ${i === 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {labels[i]}
            </div>
          )}
          {child}
        </div>
      ))}
    </div>
  );
}

// Modal for previewing lightboxes from flowchart
// Uses createPortal to render at document.body for proper viewport centering
function PreviewModal({
  isOpen,
  onClose,
  lightboxType,
  betaStep,
  nmkrStep,
  veteranInfo,
}: {
  isOpen: boolean;
  onClose: () => void;
  lightboxType: 'beta' | 'nmkr';
  betaStep?: BetaSignupStep;
  nmkrStep?: NMKRPayState;
  veteranInfo?: VeteranInfo;
}) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      {/* Outer container */}
      <div
        className="relative max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner scrollable content */}
        <div className="max-h-[90vh] overflow-auto">
          {/* Step indicator */}
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-500 bg-gray-900 px-3 py-1 rounded-full">
              {lightboxType === 'beta' ? `Beta Signup: ${betaStep}` : `NFT Claim: ${nmkrStep}`}
            </span>
          </div>

          {/* Lightbox preview */}
          {lightboxType === 'beta' && betaStep && (
            <BetaSignupLightbox
              isVisible={true}
              onClose={() => {}}
              previewMode={true}
              previewStep={betaStep}
              previewVeteranInfo={veteranInfo}
            />
          )}
          {lightboxType === 'nmkr' && nmkrStep && (
            <NMKRPayLightbox
              walletAddress={null}
              onClose={() => {}}
              previewMode={true}
              previewState={nmkrStep}
              previewCorporationName="Stellar Depletion Syndicate"
            />
          )}

          {/* Dismiss hint */}
          <div className="text-center mt-4 text-xs text-gray-600">
            Click outside or press ✕ to close
          </div>
        </div>
      </div>
    </div>
  );

  // Render at document.body to escape any parent stacking contexts
  return createPortal(modalContent, document.body);
}

export default function UserFlowDiagram() {
  const [activeFlow, setActiveFlow] = useState<'join-beta' | 'claim-nft' | 'lightbox-preview'>('join-beta');
  const [selectedBetaStep, setSelectedBetaStep] = useState<BetaSignupStep>('address_entry');
  const [selectedNMKRStep, setSelectedNMKRStep] = useState<NMKRPayState>('address_entry');
  const [previewLightbox, setPreviewLightbox] = useState<'beta' | 'nmkr'>('beta');

  // Modal state for flowchart card previews
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLightboxType, setModalLightboxType] = useState<'beta' | 'nmkr'>('beta');
  const [modalBetaStep, setModalBetaStep] = useState<BetaSignupStep>('address_entry');
  const [modalNMKRStep, setModalNMKRStep] = useState<NMKRPayState>('address_entry');
  const [modalVeteranInfo, setModalVeteranInfo] = useState<VeteranInfo | undefined>(undefined);

  // Helper to open modal with specific lightbox step
  const openBetaPreview = (step: BetaSignupStep, veteranInfo?: VeteranInfo) => {
    setModalLightboxType('beta');
    setModalBetaStep(step);
    setModalVeteranInfo(veteranInfo);
    setModalOpen(true);
  };

  const openNMKRPreview = (step: NMKRPayState) => {
    setModalLightboxType('nmkr');
    setModalNMKRStep(step);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Flow Selector Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-4">
        <button
          onClick={() => setActiveFlow('join-beta')}
          className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase tracking-wider transition-all ${
            activeFlow === 'join-beta'
              ? 'bg-blue-900/50 border-2 border-blue-500 border-b-0 text-blue-300'
              : 'bg-gray-800/30 border border-gray-600 text-gray-400 hover:text-gray-200'
          }`}
        >
          Join Beta Button
        </button>
        <button
          onClick={() => setActiveFlow('claim-nft')}
          className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase tracking-wider transition-all ${
            activeFlow === 'claim-nft'
              ? 'bg-purple-900/50 border-2 border-purple-500 border-b-0 text-purple-300'
              : 'bg-gray-800/30 border border-gray-600 text-gray-400 hover:text-gray-200'
          }`}
        >
          Claim NFT Button
        </button>
        <button
          onClick={() => setActiveFlow('lightbox-preview')}
          className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase tracking-wider transition-all ${
            activeFlow === 'lightbox-preview'
              ? 'bg-yellow-900/50 border-2 border-yellow-500 border-b-0 text-yellow-300'
              : 'bg-gray-800/30 border border-gray-600 text-gray-400 hover:text-gray-200'
          }`}
        >
          Lightbox Preview
        </button>
      </div>

      {/* JOIN BETA FLOW */}
      {activeFlow === 'join-beta' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔑</span>
            <div>
              <h3 className="text-xl font-bold text-blue-400 uppercase tracking-wider">Join Beta Button Flow</h3>
              <p className="text-gray-400 text-sm">BetaSignupLightbox.tsx - User clicks "Join Beta" on landing page</p>
            </div>
          </div>

          {/* Shared Entry Point */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-300 mb-4 pb-2 border-b border-gray-700">
              Entry Point (All Users)
            </h4>
            <div className="flex flex-col items-center gap-2">
              <FlowNode label="User clicks 'Join Beta'" type="start" />
              <Arrow label="opens" condition="auto" />
              <FlowNode
                label="BetaSignupLightbox"
                sublabel="address_entry step"
                type="screen"
                buttons={[
                  "Title: 'Join the Beta'",
                  "Description with Discord link",
                  "Input: stake address",
                  "[Continue] button",
                  "Click backdrop → closes"
                ]}
                onClick={() => openBetaPreview('address_entry')}
              />
              <Arrow label="clicks Continue" condition="action" />
              <FlowNode label="Validate stake address" type="action" sublabel="validateStakeAddress()" />

              <div className="flex gap-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">INVALID</div>
                  <Arrow />
                  <FlowNode label="Show error message" type="error" sublabel="'Not a valid stake address'" />
                  <Arrow label="stays on screen" condition="auto" />
                  <div className="text-xs text-gray-500">User can retry</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">VALID</div>
                  <Arrow />
                  <FlowNode
                    label="Checking your status..."
                    sublabel="checking_veteran step"
                    type="screen"
                    buttons={["Spinner animation"]}
                    onClick={() => openBetaPreview('checking_veteran')}
                  />
                  <Arrow label="API call" condition="auto" />
                  <FlowNode label="/api/phase1-veteran" type="api" sublabel="GET ?stakeAddress=..." />
                </div>
              </div>
            </div>
          </div>

          {/* Two Paths Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Non-Veteran Path */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-300 mb-4 pb-2 border-b border-gray-700">
                Path A: Not a Phase I Veteran
              </h4>
              <p className="text-xs text-gray-500 mb-4">API returns 404 (not found in phase1Veterans table)</p>

              <div className="flex flex-col items-center gap-2">
                <FlowNode
                  label="Submitting signup..."
                  sublabel="normal_signup step"
                  type="screen"
                  buttons={["Spinner animation"]}
                  onClick={() => openBetaPreview('normal_signup')}
                />
                <Arrow label="API call" condition="auto" />
                <FlowNode label="/api/beta-signup" type="api" sublabel="POST { stakeAddress }" />

                <div className="flex gap-6 mt-4">
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">ERROR</div>
                    <Arrow />
                    <FlowNode label="Show error" type="error" sublabel="Back to address_entry" />
                    <div className="text-xs text-gray-500 mt-2">User can retry</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">SUCCESS</div>
                    <Arrow />
                    <FlowNode
                      label="Welcome Aboard!"
                      sublabel="success step"
                      type="end"
                      buttons={[
                        "Yellow checkmark",
                        "Discord link",
                        "Click backdrop → closes"
                      ]}
                      onClick={() => openBetaPreview('success')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Veteran Path */}
            <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-6">
              <h4 className="text-lg font-bold text-cyan-300 mb-4 pb-2 border-b border-cyan-700/50">
                Path B: Phase I Veteran Recognized
              </h4>
              <p className="text-xs text-cyan-500/70 mb-4">API returns 200 with veteran info</p>

              <div className="flex flex-col items-center gap-2">
                <FlowNode
                  label="Welcome Back, [CorpName]!"
                  sublabel="veteran_welcome step"
                  type="special"
                  buttons={[
                    "'automatically entered into Phase II'",
                    "Blue card: current/reserved name",
                    "[Choose Corporation Name] button",
                    "'Skip for now' link",
                    "Click backdrop → closes"
                  ]}
                  onClick={() => openBetaPreview('veteran_welcome', MOCK_VETERAN_INFO)}
                />

                <div className="flex gap-8 mt-4">
                  {/* Skip Path */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2 px-2 py-0.5 rounded bg-gray-700 text-gray-300">clicks "Skip for now"</div>
                    <Arrow />
                    <FlowNode
                      label="You're All Set!"
                      sublabel="success step"
                      type="end"
                      buttons={[
                        "Yellow checkmark",
                        "Discord link",
                        "Click backdrop → closes",
                        "NO auto-close"
                      ]}
                      onClick={() => openBetaPreview('success', MOCK_VETERAN_INFO)}
                    />
                  </div>

                  {/* Choose Name Path */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2 px-2 py-0.5 rounded bg-yellow-700/50 text-yellow-300">clicks "Choose Corporation Name"</div>
                    <Arrow />
                    <FlowNode
                      label="Verify Wallet Ownership"
                      sublabel="wallet_selection step"
                      type="screen"
                      buttons={[
                        "Description about signing",
                        "Wallet buttons grid",
                        "OR 'Mobile browser' notice",
                        "OR 'No wallets detected' notice",
                        "'← Back' link → veteran_welcome",
                        "Click backdrop → closes"
                      ]}
                      onClick={() => openBetaPreview('wallet_selection', MOCK_VETERAN_INFO)}
                    />
                    <Arrow label="clicks wallet" condition="action" />
                    <FlowNode
                      label="Verifying Wallet"
                      sublabel="wallet_verification step"
                      type="screen"
                      buttons={[
                        "Spinner animation",
                        "Status message",
                        "'← Try different wallet' link"
                      ]}
                      onClick={() => openBetaPreview('wallet_verification', MOCK_VETERAN_INFO)}
                    />

                    <div className="flex gap-6 mt-4">
                      <div className="flex flex-col items-center">
                        <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">FAILED</div>
                        <Arrow />
                        <FlowNode label="Error message" type="error" sublabel="'wallet mismatch' etc" />
                        <div className="text-xs text-gray-500 mt-2">Can try different wallet</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">SUCCESS</div>
                        <Arrow />
                        <FlowNode
                          label="Reserve Your Corporation Name"
                          sublabel="name_input step"
                          type="screen"
                          buttons={[
                            "'Wallet verified!' message",
                            "Input: corp name (30 char)",
                            "[Reserve Name] button",
                            "'← Back' link → veteran_welcome"
                          ]}
                          onClick={() => openBetaPreview('name_input', MOCK_VETERAN_INFO)}
                        />
                        <Arrow label="clicks Reserve" condition="action" />
                        <FlowNode label="/api/phase1-veteran/reserve-name" type="api" sublabel="POST { stakeAddress, newCorporationName }" />
                        <Arrow label="success" condition="yes" />
                        <FlowNode
                          label="Name Reserved!"
                          sublabel="name_confirmed step"
                          type="end"
                          buttons={[
                            "Green checkmark",
                            "Shows reserved name",
                            "[Done] button → closes"
                          ]}
                          onClick={() => openBetaPreview('name_confirmed', MOCK_VETERAN_WITH_RESERVED)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
            <h5 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Legend</h5>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-900/70 border-2 border-green-500 rounded" />
                <span className="text-gray-300">Start/End Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-900/60 border-2 border-blue-500/70 rounded" />
                <span className="text-gray-300">Screen/Step</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-900/70 border-2 border-cyan-400 rounded shadow shadow-cyan-500/30" />
                <span className="text-gray-300">Veteran Special</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 border-2 border-gray-500 rounded" />
                <span className="text-gray-300">API Call</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-900/50 border-2 border-purple-500/60 rounded" />
                <span className="text-gray-300">Action/Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-900/50 border-2 border-red-500/70 rounded" />
                <span className="text-gray-300">Error State</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLAIM NFT FLOW */}
      {activeFlow === 'claim-nft' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎁</span>
            <div>
              <h3 className="text-xl font-bold text-purple-400 uppercase tracking-wider">Claim NFT Button Flow</h3>
              <p className="text-gray-400 text-sm">NMKRPayLightbox.tsx - User clicks "Claim NFT" on landing page</p>
            </div>
          </div>

          {/* Entry and Campaign Loading */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-300 mb-4 pb-2 border-b border-gray-700">
              Entry Point & Campaign Check
            </h4>
            <div className="flex flex-col items-center gap-2">
              <FlowNode label="User clicks 'Claim NFT'" type="start" />
              <Arrow label="opens" condition="auto" />
              <FlowNode
                label="Loading Campaign..."
                sublabel="loading_campaign step"
                type="screen"
                buttons={["Spinner animation"]}
                onClick={() => openNMKRPreview('loading_campaign')}
              />
              <Arrow label="fetches active campaigns" condition="auto" />

              <div className="flex gap-8 mt-4">
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">NO CAMPAIGNS</div>
                  <Arrow />
                  <FlowNode
                    label="No Active Campaigns"
                    sublabel="no_campaign step"
                    type="error"
                    buttons={[
                      "'Check back later'",
                      "Click backdrop → closes"
                    ]}
                    onClick={() => openNMKRPreview('no_campaign')}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-yellow-700/50 text-yellow-300">ALL SOLD OUT</div>
                  <Arrow />
                  <FlowNode
                    label="Error"
                    sublabel="error step"
                    type="error"
                    buttons={[
                      "'All NFTs have been claimed'",
                      "[Close] button"
                    ]}
                    onClick={() => openNMKRPreview('error')}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">CAMPAIGN FOUND</div>
                  <Arrow />
                  <FlowNode
                    label="Commemorative NFT"
                    sublabel="address_entry step"
                    type="screen"
                    buttons={[
                      "'Enter stake address of wallet'",
                      "Input: stake address",
                      "[Continue] button",
                      "[X] close button",
                      "Click backdrop → shows cancel confirm"
                    ]}
                    onClick={() => openNMKRPreview('address_entry')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Check */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-300 mb-4 pb-2 border-b border-gray-700">
              Eligibility Check (after address entry)
            </h4>
            <div className="flex flex-col items-center gap-2">
              <FlowNode
                label="Checking Eligibility..."
                sublabel="checking_eligibility step"
                type="screen"
                buttons={["Spinner", "'Verifying your participation'"]}
                onClick={() => openNMKRPreview('checking_eligibility')}
              />
              <Arrow label="API checks" condition="auto" />

              {/* Four outcome paths */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                {/* Already Claimed */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-yellow-700/50 text-yellow-300">ALREADY CLAIMED</div>
                  <Arrow />
                  <FlowNode
                    label="Already Claimed"
                    sublabel="already_claimed step"
                    type="screen"
                    buttons={[
                      "Yellow checkmark",
                      "Shows NFT image",
                      "Shows NFT name & mint date",
                      "'Thank you for being part...'",
                      "[Close] button"
                    ]}
                    onClick={() => openNMKRPreview('already_claimed')}
                  />
                </div>

                {/* Has Active Reservation */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-orange-700/50 text-orange-300">RESERVATION EXISTS</div>
                  <Arrow />
                  <FlowNode
                    label="Reservation In Progress"
                    sublabel="ineligible step"
                    type="screen"
                    buttons={[
                      "Clock icon",
                      "'You already have a reservation'",
                      "'Please complete payment in NMKR'",
                      "[Close] button"
                    ]}
                    onClick={() => openNMKRPreview('ineligible')}
                  />
                </div>

                {/* Not Eligible */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">NOT ELIGIBLE</div>
                  <Arrow />
                  <FlowNode
                    label="Not Eligible"
                    sublabel="ineligible step"
                    type="error"
                    buttons={[
                      "Warning icon",
                      "Shows reason from campaign",
                      "Discord ticket link",
                      "[Join Beta] button → opens BetaSignupLightbox"
                    ]}
                    onClick={() => openNMKRPreview('ineligible')}
                  />
                </div>

                {/* Eligible */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">ELIGIBLE</div>
                  <Arrow />
                  <FlowNode
                    label="Corporation Verified"
                    sublabel="corporation_verified step"
                    type="special"
                    buttons={[
                      "Cyan checkmark",
                      "Big glowing corp name",
                      "[Continue to Claim] button",
                      "'Cancel' link"
                    ]}
                    onClick={() => openNMKRPreview('corporation_verified')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Verification & Claiming */}
          <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-cyan-300 mb-4 pb-2 border-b border-cyan-700/50">
              Wallet Verification & Claiming (from Corporation Verified)
            </h4>
            <div className="flex flex-col items-center gap-2">
              <FlowNode
                label="Verify Wallet Ownership"
                sublabel="wallet_verification step - Desktop"
                type="screen"
                buttons={[
                  "Shield icon",
                  "'Connect the wallet for [CorpName]'",
                  "Wallet buttons with icons",
                  "OR 'No Cardano wallets detected'",
                  "'Go Back' link → corporation_verified"
                ]}
                onClick={() => openNMKRPreview('wallet_verification')}
              />

              <div className="flex gap-8 mt-4">
                {/* Mobile Path */}
                <div className="flex flex-col items-center border border-gray-600/50 rounded-lg p-4 bg-gray-900/30">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-blue-700/50 text-blue-300">MOBILE BROWSER</div>
                  <FlowNode
                    label="Mobile Instructions"
                    sublabel="wallet_verification step"
                    type="screen"
                    buttons={[
                      "Phone icon",
                      "'Copy link to wallet browser'",
                      "[Copy Link] button",
                      "'Go Back' link"
                    ]}
                    onClick={() => openNMKRPreview('wallet_verification')}
                  />
                  <div className="text-xs text-gray-500 mt-2">User opens in wallet app</div>
                </div>

                {/* Desktop Path */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-purple-700/50 text-purple-300">clicks wallet button</div>
                  <Arrow />
                  <FlowNode
                    label="Connecting Wallet..."
                    type="action"
                    buttons={["Spinner"]}
                  />
                  <Arrow />
                  <FlowNode
                    label="Generating Challenge..."
                    type="action"
                    buttons={["Spinner", "'Preparing secure verification'"]}
                  />
                  <Arrow />
                  <FlowNode
                    label="Sign to Verify"
                    type="screen"
                    buttons={["Spinner", "'Check your wallet extension'"]}
                  />
                  <Arrow />
                  <FlowNode
                    label="Verifying Signature..."
                    type="action"
                    buttons={["Green spinner"]}
                  />

                  <div className="flex gap-6 mt-4">
                    <div className="flex flex-col items-center">
                      <div className="text-xs mb-2 px-2 py-0.5 rounded bg-red-900/50 text-red-400">FAILED</div>
                      <Arrow />
                      <FlowNode label="Error message" type="error" />
                      <div className="text-xs text-gray-500 mt-2">Shows error, can retry</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">SUCCESS</div>
                      <Arrow />
                      <FlowNode
                        label="Reserving NFT..."
                        sublabel="creating step"
                        type="action"
                        buttons={["Spinner", "'Finding next available NFT'"]}
                        onClick={() => openNMKRPreview('creating')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation & Payment */}
          <div className="bg-purple-950/30 border border-purple-700/50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-purple-300 mb-4 pb-2 border-b border-purple-700/50">
              Reservation & Payment Flow
            </h4>
            <div className="flex flex-col items-center gap-2">
              <FlowNode
                label="Your NFT Reserved"
                sublabel="reserved step"
                type="special"
                buttons={[
                  "Shows NFT image",
                  "Shows edition number",
                  "'10 ADA' price",
                  "'20 minutes to complete'",
                  "[Open Payment Window] button",
                  "'Cancel' link → shows cancel confirm"
                ]}
                onClick={() => openNMKRPreview('reserved')}
              />
              <Arrow label="clicks Open Payment" condition="action" />
              <FlowNode label="Opens NMKR payment window" type="action" sublabel="External popup" />
              <Arrow />
              <FlowNode
                label="Complete Your Purchase"
                sublabel="payment step"
                type="screen"
                buttons={[
                  "'Complete payment in NMKR window'",
                  "'Close NMKR when done'",
                  "[Cancel Transaction] button"
                ]}
                onClick={() => openNMKRPreview('payment')}
              />

              <div className="flex gap-8 mt-4">
                {/* Window Closed */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-yellow-700/50 text-yellow-300">USER CLOSES NMKR</div>
                  <Arrow />
                  <FlowNode
                    label="Did you complete payment?"
                    sublabel="payment_window_closed step"
                    type="screen"
                    buttons={[
                      "Checkmark icon",
                      "[Refresh] button → checks blockchain",
                      "'Re-open Payment Window' link",
                      "'Cancel Reservation' link"
                    ]}
                    onClick={() => openNMKRPreview('payment_window_closed')}
                  />
                </div>

                {/* Payment Detected */}
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-2 px-2 py-0.5 rounded bg-green-900/50 text-green-400">PAYMENT DETECTED</div>
                  <Arrow />
                  <FlowNode
                    label="Checking Payment..."
                    sublabel="processing step"
                    type="action"
                    buttons={[
                      "Pulsing indicator",
                      "'Waiting for blockchain confirmation'",
                      "'1-2 minutes' message",
                      "[Cancel Transaction] button"
                    ]}
                    onClick={() => openNMKRPreview('processing')}
                  />
                  <Arrow label="confirmed" condition="yes" />
                  <FlowNode
                    label="NFT Claimed!"
                    sublabel="success step"
                    type="end"
                    buttons={[
                      "Green checkmark",
                      "'Successfully minted'",
                      "[Close] button"
                    ]}
                    onClick={() => openNMKRPreview('success')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error & Timeout States */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-red-950/20 border border-red-700/40 rounded-lg p-5">
              <h4 className="text-base font-bold text-red-300 mb-4 pb-2 border-b border-red-700/40">
                Timeout State
              </h4>
              <div className="flex flex-col items-center gap-2">
                <FlowNode
                  label="Reservation Timed Out"
                  sublabel="timeout step"
                  type="error"
                  buttons={[
                    "Clock icon",
                    "'Reservation has timed out'",
                    "[Close] button"
                  ]}
                  onClick={() => openNMKRPreview('timeout')}
                />
                <div className="text-xs text-gray-500 mt-2">Occurs after 20 minutes</div>
              </div>
            </div>

            <div className="bg-orange-950/20 border border-orange-700/40 rounded-lg p-5">
              <h4 className="text-base font-bold text-orange-300 mb-4 pb-2 border-b border-orange-700/40">
                Cancel Confirmation Dialog
              </h4>
              <div className="flex flex-col items-center gap-2">
                <FlowNode
                  label="Cancel Reservation?"
                  sublabel="showCancelConfirmation modal"
                  type="screen"
                  buttons={[
                    "Question icon",
                    "'This will not guarantee same edition'",
                    "[Go Back] button → returns to flow",
                    "[Confirm Cancel] button → closes lightbox"
                  ]}
                  onClick={() => openNMKRPreview('cancel_confirmation')}
                />
                <div className="text-xs text-gray-500 mt-2">Appears on cancel/backdrop click</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
            <h5 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Legend</h5>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-900/70 border-2 border-green-500 rounded" />
                <span className="text-gray-300">Start/End Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-900/60 border-2 border-blue-500/70 rounded" />
                <span className="text-gray-300">Screen/Step</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-900/70 border-2 border-cyan-400 rounded shadow shadow-cyan-500/30" />
                <span className="text-gray-300">Special/Verified State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 border-2 border-gray-500 rounded" />
                <span className="text-gray-300">API Call</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-900/50 border-2 border-purple-500/60 rounded" />
                <span className="text-gray-300">Processing/Action</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-900/50 border-2 border-red-500/70 rounded" />
                <span className="text-gray-300">Error State</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-500">
              <strong>Note:</strong> Each screen shows buttons and links available to the user. "Click backdrop" means clicking outside the lightbox area.
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW */}
      {activeFlow === 'lightbox-preview' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👁️</span>
            <div>
              <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Lightbox Preview</h3>
              <p className="text-gray-400 text-sm">View actual lightboxes with mock data - use for styling and copy review</p>
            </div>
          </div>

          {/* Lightbox Type Selector */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setPreviewLightbox('beta')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                previewLightbox === 'beta'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Beta Signup Lightbox
            </button>
            <button
              onClick={() => setPreviewLightbox('nmkr')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                previewLightbox === 'nmkr'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              NFT Claim Lightbox
            </button>
          </div>

          {/* Step Selector and Preview */}
          {previewLightbox === 'beta' && (
            <div className="grid grid-cols-[300px_1fr] gap-6">
              {/* Step buttons */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Step</h4>
                {BETA_SIGNUP_STEPS.map((item) => (
                  <button
                    key={item.step}
                    onClick={() => setSelectedBetaStep(item.step)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedBetaStep === item.step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </button>
                ))}
              </div>

              {/* Preview area */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                  Preview: {selectedBetaStep}
                </div>
                <div className="flex justify-center items-center min-h-[400px] bg-black/30 rounded-lg p-4">
                  <BetaSignupLightbox
                    isVisible={true}
                    onClose={() => {}}
                    previewMode={true}
                    previewStep={selectedBetaStep}
                    previewVeteranInfo={BETA_SIGNUP_STEPS.find(s => s.step === selectedBetaStep)?.veteranInfo}
                  />
                </div>
              </div>
            </div>
          )}

          {previewLightbox === 'nmkr' && (
            <div className="grid grid-cols-[300px_1fr] gap-6">
              {/* Step buttons */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Step</h4>
                {NMKR_PAY_STEPS.map((item) => (
                  <button
                    key={item.step}
                    onClick={() => setSelectedNMKRStep(item.step)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedNMKRStep === item.step
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </button>
                ))}
              </div>

              {/* Preview area */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                  Preview: {selectedNMKRStep}
                </div>
                <div className="flex justify-center items-center min-h-[400px] bg-black/30 rounded-lg p-4">
                  <NMKRPayLightbox
                    walletAddress={null}
                    onClose={() => {}}
                    previewMode={true}
                    previewState={selectedNMKRStep}
                    previewCorporationName="Stellar Depletion Syndicate"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/40">
            <h5 className="text-sm font-bold text-yellow-400 mb-2">About Preview Mode</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• All data shown is mock data (e.g., "Stellar Depletion Syndicate" corporation name)</li>
              <li>• Buttons are non-functional in preview mode</li>
              <li>• Use this to review styling, copy text, and layout</li>
              <li>• The lightbox renders inline (no backdrop) for easy comparison</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preview Modal - renders when clicking flowchart cards */}
      <PreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lightboxType={modalLightboxType}
        betaStep={modalBetaStep}
        nmkrStep={modalNMKRStep}
        veteranInfo={modalVeteranInfo}
      />
    </div>
  );
}
