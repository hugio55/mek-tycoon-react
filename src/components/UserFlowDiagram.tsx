'use client';

import { useState } from 'react';

type FlowNode = {
  id: string;
  label: string;
  type: 'start' | 'action' | 'decision' | 'end' | 'special';
  color?: string;
};

type FlowPath = {
  from: string;
  to: string;
  label?: string;
  condition?: 'yes' | 'no' | 'error';
};

function FlowBox({ node }: { node: FlowNode }) {
  const baseClasses = "px-4 py-2 text-center text-sm font-medium rounded-lg border-2 transition-all";

  const styles: Record<string, string> = {
    start: "bg-green-900/70 border-green-500 text-green-300",
    action: "bg-blue-900/60 border-blue-500/70 text-blue-200",
    decision: "bg-yellow-900/60 border-yellow-500/70 text-yellow-200 rotate-0",
    end: "bg-purple-900/70 border-purple-500 text-purple-300",
    special: "bg-cyan-900/70 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20",
  };

  if (node.type === 'decision') {
    return (
      <div className="flex flex-col items-center">
        <div className={`${baseClasses} ${styles.decision} transform rotate-0 px-3 py-1.5`}
             style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
        </div>
        <div className="absolute text-yellow-300 text-xs font-bold whitespace-nowrap mt-6">
          {node.label}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${node.color || styles[node.type]}`}>
      {node.label}
    </div>
  );
}

function Arrow({ direction = 'down', label, condition }: { direction?: 'down' | 'right' | 'left'; label?: string; condition?: 'yes' | 'no' | 'error' }) {
  const arrowChar = direction === 'down' ? '↓' : direction === 'right' ? '→' : '←';
  const conditionColors: Record<string, string> = {
    yes: 'text-green-400 bg-green-900/50',
    no: 'text-red-400 bg-red-900/50',
    error: 'text-orange-400 bg-orange-900/50',
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 text-lg">{arrowChar}</span>
      {label && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${condition ? conditionColors[condition] : 'text-gray-500 bg-gray-800/50'}`}>
          {label}
        </span>
      )}
    </div>
  );
}

function DecisionDiamond({ label }: { label: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="w-28 h-28 bg-yellow-900/60 border-2 border-yellow-500/70 transform rotate-45 rounded-md" />
      <div className="absolute text-yellow-200 text-xs font-bold text-center whitespace-pre-line px-2">
        {label}
      </div>
    </div>
  );
}

export default function UserFlowDiagram() {
  const [activeFlow, setActiveFlow] = useState<'join-beta' | 'claim-nft'>('join-beta');

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
      </div>

      {/* Join Beta Flow */}
      {activeFlow === 'join-beta' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔑</span>
            <div>
              <h3 className="text-xl font-bold text-blue-400 uppercase tracking-wider">Join Beta Button Flow</h3>
              <p className="text-gray-400 text-sm">User clicks "Join Beta" on landing page</p>
            </div>
          </div>

          {/* Two paths side by side */}
          <div className="grid grid-cols-2 gap-8">
            {/* New User Path */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-300 mb-6 pb-2 border-b border-gray-700">
                Path A: New User (Not a Veteran)
              </h4>

              <div className="flex flex-col items-center gap-3">
                <FlowBox node={{ id: 'start', label: 'Click "Join Beta"', type: 'start' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'modal', label: 'BetaSignupLightbox Opens', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'input', label: 'Enter Stake Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'check', label: 'API: /api/phase1-veteran', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <DecisionDiamond label="Is Phase I\nVeteran?" />
                <Arrow direction="down" label="NO" condition="no" />
                <FlowBox node={{ id: 'standard', label: 'Standard Signup Flow', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'submit', label: 'Submit Email + Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'success', label: 'Success: Added to Whitelist', type: 'end' }} />
              </div>
            </div>

            {/* Veteran Path */}
            <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-6">
              <h4 className="text-lg font-bold text-cyan-300 mb-6 pb-2 border-b border-cyan-700/50">
                Path B: Phase I Veteran
              </h4>

              <div className="flex flex-col items-center gap-3">
                <FlowBox node={{ id: 'start', label: 'Click "Join Beta"', type: 'start' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'modal', label: 'BetaSignupLightbox Opens', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'input', label: 'Enter Stake Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'check', label: 'API: /api/phase1-veteran', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <DecisionDiamond label="Is Phase I\nVeteran?" />
                <Arrow direction="down" label="YES" condition="yes" />
                <FlowBox node={{ id: 'welcome', label: 'Welcome Back, [Corp]!', type: 'special' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'choice', label: 'Choose Corp Name?', type: 'action' }} />

                <div className="flex gap-8 mt-2">
                  {/* Skip path */}
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-xs bg-gray-800/50 px-2 py-0.5 rounded">Skip</span>
                    <span className="text-lg">↓</span>
                    <div className="text-xs text-center">Auto-enrolled</div>
                  </div>

                  {/* Choose name path */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">Choose</span>
                    <span className="text-lg text-gray-400">↓</span>
                  </div>
                </div>

                <FlowBox node={{ id: 'wallet', label: 'Select Wallet', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'verify', label: 'CIP-30 Signature Verification', type: 'action', color: 'bg-orange-900/50 border-orange-500/70 text-orange-200' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'name', label: 'Enter New Corp Name', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'reserve', label: 'API: /api/phase1-veteran/reserve-name', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'confirm', label: 'Name Reserved!', type: 'end' }} />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
            <h5 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Legend</h5>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-900/70 border border-green-500 rounded" />
                <span className="text-gray-300">Entry Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-900/60 border border-blue-500/70 rounded" />
                <span className="text-gray-300">Action</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-900/60 border border-yellow-500/70 rounded transform rotate-45" />
                <span className="text-gray-300">Decision</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-900/70 border border-cyan-400 rounded shadow shadow-cyan-500/30" />
                <span className="text-gray-300">Special (Veteran)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-900/70 border border-purple-500 rounded" />
                <span className="text-gray-300">End Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 border border-gray-500 rounded" />
                <span className="text-gray-300">API Call</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim NFT Flow */}
      {activeFlow === 'claim-nft' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎁</span>
            <div>
              <h3 className="text-xl font-bold text-purple-400 uppercase tracking-wider">Claim NFT Button Flow</h3>
              <p className="text-gray-400 text-sm">User clicks "Claim NFT" on landing page (commemorative tokens)</p>
            </div>
          </div>

          {/* Three paths */}
          <div className="grid grid-cols-3 gap-6">
            {/* New User Path */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-5">
              <h4 className="text-base font-bold text-gray-300 mb-4 pb-2 border-b border-gray-700">
                Path A: New User
              </h4>

              <div className="flex flex-col items-center gap-2.5">
                <FlowBox node={{ id: 'start', label: 'Click "Claim NFT"', type: 'start' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'modal', label: 'NFT Claim Lightbox', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'connect', label: 'Connect Wallet', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'extract', label: 'Extract Stake Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'check-elig', label: 'Check Eligibility', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <DecisionDiamond label="Eligible?" />
                <Arrow direction="down" label="YES" condition="yes" />
                <FlowBox node={{ id: 'claim', label: 'Process Claim', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'mint', label: 'NMKR Mint Request', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'success', label: 'NFT Delivered!', type: 'end' }} />
              </div>
            </div>

            {/* Veteran Path */}
            <div className="bg-cyan-950/30 border border-cyan-700/50 rounded-lg p-5">
              <h4 className="text-base font-bold text-cyan-300 mb-4 pb-2 border-b border-cyan-700/50">
                Path B: Phase I Veteran
              </h4>

              <div className="flex flex-col items-center gap-2.5">
                <FlowBox node={{ id: 'start', label: 'Click "Claim NFT"', type: 'start' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'modal', label: 'NFT Claim Lightbox', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'connect', label: 'Connect Wallet', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'extract', label: 'Extract Stake Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'check-vet', label: 'Check Veteran Status', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <DecisionDiamond label="Veteran?" />
                <Arrow direction="down" label="YES" condition="yes" />
                <FlowBox node={{ id: 'special', label: 'Veteran Recognition', type: 'special' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'bonus', label: 'Apply Veteran Bonus', type: 'action', color: 'bg-cyan-900/50 border-cyan-500/70 text-cyan-200' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'mint', label: 'NMKR Mint Request', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'success', label: 'Premium NFT Delivered!', type: 'end' }} />
              </div>
            </div>

            {/* Already Claimed Path */}
            <div className="bg-red-950/20 border border-red-700/40 rounded-lg p-5">
              <h4 className="text-base font-bold text-red-300 mb-4 pb-2 border-b border-red-700/40">
                Path C: Already Claimed
              </h4>

              <div className="flex flex-col items-center gap-2.5">
                <FlowBox node={{ id: 'start', label: 'Click "Claim NFT"', type: 'start' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'modal', label: 'NFT Claim Lightbox', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'connect', label: 'Connect Wallet', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'extract', label: 'Extract Stake Address', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'check-claim', label: 'Check Claim Status', type: 'action', color: 'bg-gray-800 border-gray-500 text-gray-300' }} />
                <Arrow direction="down" />
                <DecisionDiamond label="Already\nClaimed?" />
                <Arrow direction="down" label="YES" condition="error" />
                <FlowBox node={{ id: 'error', label: 'Already Claimed Error', type: 'action', color: 'bg-red-900/50 border-red-500/70 text-red-200' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'show', label: 'Show Existing NFT', type: 'action' }} />
                <Arrow direction="down" />
                <FlowBox node={{ id: 'end', label: 'View Collection', type: 'end' }} />
              </div>
            </div>
          </div>

          {/* Not Eligible Path */}
          <div className="bg-orange-950/20 border border-orange-700/40 rounded-lg p-5 max-w-md mx-auto">
            <h4 className="text-base font-bold text-orange-300 mb-4 pb-2 border-b border-orange-700/40 text-center">
              Path D: Not Eligible
            </h4>

            <div className="flex flex-col items-center gap-2.5">
              <FlowBox node={{ id: 'decision', label: 'From Eligibility Check...', type: 'action', color: 'bg-gray-800 border-gray-600 text-gray-400' }} />
              <Arrow direction="down" />
              <DecisionDiamond label="Eligible?" />
              <Arrow direction="down" label="NO" condition="no" />
              <FlowBox node={{ id: 'reason', label: 'Show Ineligibility Reason', type: 'action', color: 'bg-orange-900/50 border-orange-500/70 text-orange-200' }} />
              <Arrow direction="down" />
              <div className="flex gap-4">
                <FlowBox node={{ id: 'join', label: 'Prompt: Join Beta', type: 'action', color: 'bg-blue-900/40 border-blue-500/50 text-blue-300' }} />
                <FlowBox node={{ id: 'close', label: 'Close', type: 'end' }} />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-gray-700">
            <h5 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Legend</h5>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-900/70 border border-green-500 rounded" />
                <span className="text-gray-300">Entry Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-900/60 border border-blue-500/70 rounded" />
                <span className="text-gray-300">Action</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-900/60 border border-yellow-500/70 rounded transform rotate-45" />
                <span className="text-gray-300">Decision</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-900/70 border border-cyan-400 rounded shadow shadow-cyan-500/30" />
                <span className="text-gray-300">Veteran Special</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-900/50 border border-red-500/70 rounded" />
                <span className="text-gray-300">Error State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-900/70 border border-purple-500 rounded" />
                <span className="text-gray-300">End Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 border border-gray-500 rounded" />
                <span className="text-gray-300">API Call</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
