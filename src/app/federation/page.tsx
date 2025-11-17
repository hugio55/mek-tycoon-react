'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from "@/convex/_generated/api";
import FederationVariationGrid from '@/components/FederationVariationGrid';
import PlanetMiningPanel from '@/components/PlanetMiningPanel';

export default function FederationPage() {
  const [createMode, setCreateMode] = useState(false);
  const [federationName, setFederationName] = useState('');
  const [federationDesc, setFederationDesc] = useState('');
  const [inviteWalletAddress, setInviteWalletAddress] = useState('');
  const [showVariationGrid, setShowVariationGrid] = useState(false);
  const [variationFilter, setVariationFilter] = useState<'all' | 'heads' | 'bodies' | 'items'>('all');

  // TODO: Get current user's wallet address from authentication
  // For now, using a placeholder - this should come from user context
  const currentWalletAddress = 'user-wallet-address-placeholder';

  const currentFederation = useQuery(api.federations.getFederationByWallet, { walletAddress: currentWalletAddress });
  const federationDetails = useQuery(
    api.federations.getFederation,
    currentFederation ? { federationId: currentFederation.federationId } : "skip"
  );
  const pendingInvites = useQuery(api.federations.getPendingInvites, { walletAddress: currentWalletAddress });
  const federationVariations = useQuery(
    api.federations.getFederationVariations,
    currentFederation ? { federationId: currentFederation.federationId } : "skip"
  );

  // Get all variations from reference table
  const allVariations = useQuery(api.variations.getAllVariations);

  const createFederation = useMutation(api.federations.createFederation);
  const acceptInvite = useMutation(api.federations.acceptInvite);
  const rejectInvite = useMutation(api.federations.rejectInvite);
  const inviteToFederation = useMutation(api.federations.inviteToFederation);
  const leaveFederation = useMutation(api.federations.leaveFederation);

  const handleCreateFederation = async () => {
    if (!federationName.trim()) {
      alert('Please enter a federation name');
      return;
    }

    try {
      await createFederation({
        name: federationName,
        description: federationDesc,
        leaderWalletAddress: currentWalletAddress,
      });
      setCreateMode(false);
      setFederationName('');
      setFederationDesc('');
    } catch (error) {
      alert(`Failed to create federation: ${error}`);
    }
  };

  const handleAcceptInvite = async (inviteId: any) => {
    try {
      await acceptInvite({ inviteId, walletAddress: currentWalletAddress });
    } catch (error) {
      alert(`Failed to accept invite: ${error}`);
    }
  };

  const handleRejectInvite = async (inviteId: any) => {
    try {
      await rejectInvite({ inviteId, walletAddress: currentWalletAddress });
    } catch (error) {
      alert(`Failed to reject invite: ${error}`);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteWalletAddress.trim() || !currentFederation) return;

    try {
      await inviteToFederation({
        federationId: currentFederation.federationId,
        invitedWalletAddress: inviteWalletAddress,
        invitedByWalletAddress: currentWalletAddress,
      });
      setInviteWalletAddress('');
      alert('Invite sent successfully');
    } catch (error) {
      alert(`Failed to send invite: ${error}`);
    }
  };

  const handleLeaveFederation = async () => {
    if (!currentFederation) return;

    if (!confirm('Are you sure you want to leave this federation?')) return;

    try {
      await leaveFederation({
        federationId: currentFederation.federationId,
        walletAddress: currentWalletAddress,
      });
    } catch (error) {
      alert(`Failed to leave federation: ${error}`);
    }
  };

  // Loading state
  if (currentFederation === undefined || pendingInvites === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading...</div>
      </div>
    );
  }

  // Not in a federation
  if (!currentFederation) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mek-text-industrial text-4xl mb-8 text-center">FEDERATION COMMAND</h1>

          {/* Pending Invites */}
          {pendingInvites && pendingInvites.length > 0 && (
            <div className="mek-card-industrial mek-border-sharp-gold p-6 mb-8">
              <h2 className="mek-text-industrial text-2xl mb-4">PENDING INVITATIONS</h2>
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite._id} className="bg-black/40 border border-yellow-500/30 p-4 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-yellow-500 font-bold text-lg">{invite.federation?.name}</div>
                        <div className="text-gray-400 text-sm mt-1">{invite.federation?.description}</div>
                        {invite.message && (
                          <div className="text-gray-300 text-sm mt-2 italic">&quot;{invite.message}&quot;</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvite(invite._id)}
                          className="mek-button-primary px-4 py-2"
                        >
                          ACCEPT
                        </button>
                        <button
                          onClick={() => handleRejectInvite(invite._id)}
                          className="bg-red-600/20 border-2 border-red-600/50 px-4 py-2 text-red-400 hover:bg-red-600/40 rounded"
                        >
                          REJECT
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Federation */}
          {!createMode ? (
            <div className="mek-card-industrial mek-border-sharp-gold p-8 text-center">
              <h2 className="mek-text-industrial text-2xl mb-4">NOT IN A FEDERATION</h2>
              <p className="text-gray-400 mb-6">
                Create a new federation or wait for an invitation from another corporation.
              </p>
              <button
                onClick={() => setCreateMode(true)}
                className="mek-button-primary px-8 py-3 text-lg"
              >
                CREATE FEDERATION
              </button>
            </div>
          ) : (
            <div className="mek-card-industrial mek-border-sharp-gold p-8">
              <h2 className="mek-text-industrial text-2xl mb-6">CREATE NEW FEDERATION</h2>
              <div className="space-y-4">
                <div>
                  <label className="mek-label-uppercase block mb-2">Federation Name</label>
                  <input
                    type="text"
                    value={federationName}
                    onChange={(e) => setFederationName(e.target.value)}
                    className="w-full bg-black/50 border-2 border-yellow-500/30 px-4 py-2 text-yellow-500 rounded focus:border-yellow-500 focus:outline-none"
                    placeholder="Enter federation name..."
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="mek-label-uppercase block mb-2">Description (Optional)</label>
                  <textarea
                    value={federationDesc}
                    onChange={(e) => setFederationDesc(e.target.value)}
                    className="w-full bg-black/50 border-2 border-yellow-500/30 px-4 py-2 text-gray-300 rounded focus:border-yellow-500 focus:outline-none h-24 resize-none"
                    placeholder="Enter federation description..."
                    maxLength={200}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateFederation}
                    className="mek-button-primary flex-1 py-3"
                  >
                    CREATE
                  </button>
                  <button
                    onClick={() => {
                      setCreateMode(false);
                      setFederationName('');
                      setFederationDesc('');
                    }}
                    className="bg-gray-600/20 border-2 border-gray-600/50 flex-1 py-3 text-gray-400 hover:bg-gray-600/40 rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // In a federation
  const isLeader = federationDetails?.members?.some(
    (m) => m.walletAddress === currentWalletAddress && m.role === 'leader'
  );
  const isOfficer = federationDetails?.members?.some(
    (m) => m.walletAddress === currentWalletAddress && m.role === 'officer'
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Federation Header */}
        <div className="mek-card-industrial mek-border-sharp-gold p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mek-text-industrial text-4xl">{currentFederation.name}</h1>
              {currentFederation.description && (
                <p className="text-gray-400 mt-2">{currentFederation.description}</p>
              )}
            </div>
            {!isLeader && (
              <button
                onClick={handleLeaveFederation}
                className="bg-red-600/20 border-2 border-red-600/50 px-4 py-2 text-red-400 hover:bg-red-600/40 rounded"
              >
                LEAVE FEDERATION
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="mek-value-primary text-3xl">{currentFederation.memberCount}</div>
              <div className="mek-label-uppercase mt-1">Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{currentFederation.totalMekCount || 0}</div>
              <div className="mek-label-uppercase mt-1">Total Meks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{currentFederation.uniqueVariationCount || 0}</div>
              <div className="mek-label-uppercase mt-1">Unique Variations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{currentFederation.totalMiningPower || 0}</div>
              <div className="mek-label-uppercase mt-1">Mining Power</div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="mek-card-industrial mek-border-sharp-gold p-6">
            <h2 className="mek-text-industrial text-2xl mb-4">FEDERATION MEMBERS</h2>
            <div className="space-y-2">
              {federationDetails?.members?.map((member) => (
                <div
                  key={member._id}
                  className="bg-black/40 border border-yellow-500/20 p-3 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="text-yellow-500 font-mono">
                      {member.walletAddress.slice(0, 8)}...{member.walletAddress.slice(-6)}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {member.variationsContributed || 0} unique variations
                    </div>
                  </div>
                  <div className={`
                    mek-label-uppercase px-3 py-1 rounded
                    ${member.role === 'leader' ? 'bg-yellow-500 text-black' :
                      member.role === 'officer' ? 'bg-blue-500 text-white' :
                      'bg-gray-600 text-white'}
                  `}>
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Members (Leader/Officer only) */}
          {(isLeader || isOfficer) && (
            <div className="mek-card-industrial mek-border-sharp-gold p-6">
              <h2 className="mek-text-industrial text-2xl mb-4">INVITE MEMBERS</h2>
              <div className="space-y-4">
                <div>
                  <label className="mek-label-uppercase block mb-2">Corporation Wallet Address</label>
                  <input
                    type="text"
                    value={inviteWalletAddress}
                    onChange={(e) => setInviteWalletAddress(e.target.value)}
                    className="w-full bg-black/50 border-2 border-yellow-500/30 px-4 py-2 text-yellow-500 rounded focus:border-yellow-500 focus:outline-none"
                    placeholder="Enter wallet address..."
                  />
                </div>
                <button
                  onClick={handleInviteMember}
                  className="mek-button-primary w-full py-2"
                >
                  SEND INVITE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Planet Mining System */}
        <div className="mb-8">
          <PlanetMiningPanel
            federationId={currentFederation.federationId}
            currentDiversity={currentFederation.uniqueVariationCount || 0}
            isLeader={isLeader || false}
          />
        </div>

        {/* Variation Grid Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowVariationGrid(!showVariationGrid)}
            className="mek-button-primary px-6 py-3"
          >
            {showVariationGrid ? 'HIDE' : 'SHOW'} VARIATION COLLECTION
          </button>

          {showVariationGrid && (
            <div className="flex gap-2">
              {(['all', 'heads', 'bodies', 'items'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVariationFilter(filter)}
                  className={`
                    px-4 py-2 rounded border-2 uppercase font-bold text-sm
                    ${variationFilter === filter
                      ? 'bg-yellow-500 text-black border-yellow-500'
                      : 'bg-black/40 text-gray-400 border-gray-600/50 hover:border-yellow-500/50'}
                  `}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Variation Grid */}
        {showVariationGrid && federationVariations && allVariations && (
          <div className="mek-card-industrial mek-border-sharp-gold p-6">
            <FederationVariationGrid
              allVariations={allVariations}
              ownedVariations={federationVariations}
              showType={variationFilter}
              onVariationClick={(variation, owned) => {
                console.log('Clicked variation:', variation, owned);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
