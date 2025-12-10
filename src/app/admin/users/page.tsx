'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import DemoTable from './DemoTable';

interface EditingField {
  userId: Id<'users'>;
  field: string;
  value: any;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'demo'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | null>(null);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<Id<'users'> | null>(null);

  // Queries
  const allUsers = useQuery(api.adminUsers.getAllUsers, {});
  const searchResults = useQuery(
    api.adminUsers.searchUsers,
    searchTerm ? { searchTerm } : 'skip'
  );
  const userDetails = useQuery(
    api.adminUsers.getUserDetails,
    selectedUserId ? { userId: selectedUserId } : 'skip'
  );

  // Mutations
  const updateUserField = useMutation(api.adminUsers.updateUserField);
  const updateEssence = useMutation(api.adminUsers.updateEssence);
  const updateGold = useMutation(api.adminUsers.updateGold);
  const updateUserRole = useMutation(api.adminUsers.updateUserRole);
  const toggleBan = useMutation(api.adminUsers.toggleBan);
  const resetUserProgress = useMutation(api.adminUsers.resetUserProgress);

  // Display users based on search or all
  const displayUsers = searchTerm && searchResults ? searchResults : allUsers;

  const handleFieldEdit = async () => {
    if (!editingField) return;

    try {
      if (editingField.field === 'gold') {
        await updateGold({
          userId: editingField.userId,
          gold: Number(editingField.value),
        });
      } else if (editingField.field.startsWith('essence.')) {
        const essenceType = editingField.field.split('.')[1];
        await updateEssence({
          userId: editingField.userId,
          essenceType,
          amount: Number(editingField.value),
        });
      } else {
        await updateUserField({
          userId: editingField.userId,
          field: editingField.field,
          value: editingField.value,
        });
      }
      setEditingField(null);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleRoleChange = async (userId: Id<'users'>, role: 'user' | 'moderator' | 'admin') => {
    try {
      await updateUserRole({ userId, role });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleBanToggle = async (userId: Id<'users'>, currentBanStatus: boolean) => {
    try {
      await toggleBan({ userId, banned: !currentBanStatus });
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  };

  const handleReset = async (userId: Id<'users'>, type: 'all' | 'gold' | 'essence' | 'level') => {
    try {
      await resetUserProgress({
        userId,
        resetEssence: type === 'all' || type === 'essence',
        resetGold: type === 'all' || type === 'gold',
        resetLevel: type === 'all' || type === 'level',
      });
      setShowResetConfirm(null);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getInventoryTabCost = (tabNumber: number) => {
    const costs = [0, 100, 500, 2000, 10000]; // Tab 1 is free, then increasing costs
    return costs[tabNumber - 1] || 0;
  };

  // Get only non-zero essences
  const getNonZeroEssences = (essence: any) => {
    return Object.entries(essence).filter(([_, value]) => (value as number) > 0);
  };

  // Count employee Meks
  const getEmployeeCount = (meks: any[]) => {
    return meks.filter((mek: any) => mek.isEmployee).length;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-8 font-orbitron uppercase tracking-wider">
          Admin User Management
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 font-orbitron uppercase transition-all ${
              activeTab === 'users'
                ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500'
                : 'bg-black/50 border-2 border-gray-700 text-gray-400 hover:border-yellow-500/50'
            }`}
          >
            Users List
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-6 py-2 font-orbitron uppercase transition-all ${
              activeTab === 'demo'
                ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500'
                : 'bg-black/50 border-2 border-gray-700 text-gray-400 hover:border-yellow-500/50'
            }`}
          >
            Data Reference Table
          </button>
        </div>

        {activeTab === 'demo' ? (
          <DemoTable />
        ) : (
          <>
        {/* Search Bar */}
        <div className="mb-6 mek-card-industrial mek-border-sharp-gold p-4">
          <input
            type="text"
            placeholder="Search by wallet address, username, or display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-yellow-500/30 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Users Table */}
        <div className="mek-card-industrial mek-border-sharp-gold p-6">
          <h2 className="text-2xl font-bold text-yellow-500 mb-4 font-orbitron uppercase">
            Users Database
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-yellow-500/30">
                <tr>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Wallet</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Username</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Gold</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Level</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Meks</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Employees</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Contracts</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Total Essence</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Role</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Status</th>
                  <th className="py-3 px-4 text-yellow-500 font-orbitron uppercase text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers?.map((user: any) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-yellow-500/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedUserId(user._id)}
                  >
                    <td className="py-3 px-4 font-mono text-sm">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </td>
                    <td className="py-3 px-4">
                      {user.displayName || user.username || '-'}
                    </td>
                    <td className="py-3 px-4 text-yellow-500 font-bold">
                      {user.gold.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {user.level || 1}
                    </td>
                    <td className="py-3 px-4">
                      {user.mekCount || 0}
                    </td>
                    <td className="py-3 px-4 text-green-400">
                      {user.employeeCount || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-blue-400">{user.baseContractSlots || 2}</span>
                      {user.totalContractSlots && user.totalContractSlots !== (user.baseContractSlots || 2) && (
                        <>
                          <span className="text-gray-500">/</span>
                          <span className="text-green-400">{user.totalContractSlots}</span>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.totalEssenceValue || 0}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {user.isBanned ? (
                        <span className="text-red-500 font-bold">BANNED</span>
                      ) : user.isOnline ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        <span className="text-gray-500">Offline</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBanToggle(user._id, user.isBanned || false);
                        }}
                        className="text-sm px-3 py-1 rounded border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </div>

      {/* User Details Modal/Lightbox */}
      {selectedUserId && userDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black/95 border-2 border-yellow-500/50 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-transparent p-6 border-b border-yellow-500/30 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-yellow-500 font-orbitron uppercase">
                User Details - {userDetails.user.displayName || userDetails.user.username || 'Anonymous'}
              </h2>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-red-500 hover:text-red-400 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Basic Info & Stats */}
                <div className="space-y-4">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Account</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Wallet:</span>
                        <span className="font-mono text-xs">{userDetails.user.walletAddress.slice(0, 10)}...</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Username:</span>
                        <span>{userDetails.user.username || '-'}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Display:</span>
                        <span>{userDetails.user.displayName || '-'}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Frame:</span>
                        <span className="text-blue-400">{userDetails.user.profileFrame || 'default'}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Role:</span>
                        <span className="font-bold text-yellow-500">{userDetails.user.role || 'user'}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Status:</span>
                        <span className={userDetails.user.isBanned ? 'text-red-500 font-bold' : userDetails.user.isOnline ? 'text-green-500' : 'text-gray-500'}>
                          {userDetails.user.isBanned ? 'BANNED' : userDetails.user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Resources</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-400">Gold:</span>
                        <div className="flex items-center gap-2">
                          {editingField?.field === 'gold' && editingField.userId === selectedUserId ? (
                            <>
                              <input
                                type="number"
                                value={editingField.value}
                                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                className="bg-black/50 border border-yellow-500/30 rounded px-2 py-1 w-20 text-xs"
                              />
                              <button onClick={handleFieldEdit} className="text-green-500 hover:text-green-400">✓</button>
                              <button onClick={() => setEditingField(null)} className="text-red-500 hover:text-red-400">✗</button>
                            </>
                          ) : (
                            <>
                              <span className="text-yellow-500 font-bold">{userDetails.user.gold.toLocaleString()}</span>
                              <button
                                onClick={() => setEditingField({ userId: selectedUserId, field: 'gold', value: userDetails.user.gold })}
                                className="text-blue-500 hover:text-blue-400 text-xs"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Phase II: goldPerHour/pendingGold removed - income from Job Slots */}
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Stats</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Level:</span>
                        <span>{userDetails.user.level || 1}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">XP:</span>
                        <span>{userDetails.user.experience || 0}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Battles:</span>
                        <span>{userDetails.user.totalBattles || 0}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Wins:</span>
                        <span>{userDetails.user.totalWins || 0}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Win Rate:</span>
                        <span>{userDetails.user.winRate ? `${(userDetails.user.winRate * 100).toFixed(1)}%` : '0%'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Slots</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Contracts:</span>
                        <span className="text-blue-400">
                          {userDetails.user.baseContractSlots || 2}
                          {userDetails.user.totalContractSlots && userDetails.user.totalContractSlots !== (userDetails.user.baseContractSlots || 2) ? (
                            <>
                              <span className="text-gray-500 mx-1">→</span>
                              <span className="text-green-400">{userDetails.user.totalContractSlots}</span>
                            </>
                          ) : (
                            userDetails.user.totalContractSlots && (
                              <span className="text-gray-500 ml-1">(no buffs)</span>
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Crafting:</span>
                        <span>{userDetails.user.craftingSlots || 1}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Chips/Mek:</span>
                        <span>{userDetails.user.baseChipSlots || 3}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Inv Tabs:</span>
                        <span className="text-blue-400">
                          {userDetails.user.inventoryTabsUnlocked || 1}/5
                          <span className="text-gray-500 ml-1">({(userDetails.user.inventoryTabsUnlocked || 1) * 20})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Banking</h3>
                    {userDetails.bankAccount ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">Balance:</span>
                          <span className="text-yellow-500 font-bold">{userDetails.bankAccount.balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">Interest:</span>
                          <span>{userDetails.bankAccount.interestRate}%</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-gray-400">Earned:</span>
                          <span className="text-green-500">{userDetails.bankAccount.totalInterestEarned.toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No bank account</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">Timestamps</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Created:</span>
                        <span>{formatDate(userDetails.user.createdAt || userDetails.user.lastLogin)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-400">Last Login:</span>
                        <span>{formatDate(userDetails.user.lastLogin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Essence (Only non-zero) & Inventory */}
                <div className="space-y-4">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Essence ({getNonZeroEssences(userDetails.user.totalEssence).length} types)
                    </h3>
                    <div className="space-y-1 text-sm max-h-[250px] overflow-y-auto">
                      {getNonZeroEssences(userDetails.user.totalEssence).length > 0 ? (
                        getNonZeroEssences(userDetails.user.totalEssence).map(([type, amount]) => (
                          <div key={type} className="flex justify-between items-center py-0.5">
                            <span className="text-gray-400 capitalize text-xs">{type}:</span>
                            <div className="flex items-center gap-1">
                              {editingField?.field === `essence.${type}` && editingField.userId === selectedUserId ? (
                                <>
                                  <input
                                    type="number"
                                    value={editingField.value}
                                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                    className="bg-black/50 border border-yellow-500/30 rounded px-1 py-0.5 w-16 text-xs"
                                  />
                                  <button onClick={handleFieldEdit} className="text-green-500 hover:text-green-400 text-xs">✓</button>
                                  <button onClick={() => setEditingField(null)} className="text-red-500 hover:text-red-400 text-xs">✗</button>
                                </>
                              ) : (
                                <>
                                  <span className="text-blue-400 font-bold">{amount}</span>
                                  <button
                                    onClick={() => setEditingField({ userId: selectedUserId, field: `essence.${type}`, value: amount })}
                                    className="text-blue-500 hover:text-blue-400 text-xs ml-1"
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No essence collected</p>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Inventory ({userDetails.inventory.length} items)
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {userDetails.inventory.length > 0 ? (
                        userDetails.inventory.map((item: any) => (
                          <div key={item._id} className="text-xs text-gray-400 py-0.5 flex justify-between">
                            <span className="capitalize">{item.itemType}: {item.itemVariation}</span>
                            <span className="text-blue-400">x{item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No items in inventory</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Active Buffs ({userDetails.activeBuffs.length})
                    </h3>
                    <div className="max-h-[150px] overflow-y-auto space-y-1">
                      {userDetails.activeBuffs.length > 0 ? (
                        userDetails.activeBuffs.map((buff: any) => (
                          <div key={buff._id} className="text-xs text-gray-400 py-0.5 flex justify-between">
                            <span>{buff.source}:</span>
                            <span className="text-green-400">+{buff.value} {buff.stacks > 1 && `x${buff.stacks}`}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No active buffs</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Meks & Contracts */}
                <div className="space-y-4">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Meks Total: {userDetails.meks.length} | Employees: {getEmployeeCount(userDetails.meks)}
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {userDetails.meks.length > 0 ? (
                        userDetails.meks.map((mek: any) => (
                          <Link
                            key={mek._id}
                            href={`/mek/${mek._id}`}
                            target="_blank"
                            className="block text-xs py-1 px-2 rounded hover:bg-yellow-500/10 transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">
                                {mek.assetName}
                                {mek.isEmployee && <span className="text-green-400 ml-1">💼</span>}
                              </span>
                              <span className="text-yellow-500">Lvl {mek.level || 1}</span>
                            </div>
                            {/* Phase II: goldRate display removed */}
                          </Link>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No Meks owned</p>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Active Contracts ({userDetails.contracts.filter((c: any) => c.status === 'active').length})
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {userDetails.contracts.filter((c: any) => c.status === 'active').length > 0 ? (
                        userDetails.contracts
                          .filter((c: any) => c.status === 'active')
                          .map((contract: any) => (
                            <div key={contract._id} className="text-xs text-gray-400 py-1">
                              <div className="flex justify-between">
                                <span>{contract.location}</span>
                                <span className="text-yellow-500">{contract.missionType}</span>
                              </div>
                              <div className="flex justify-between mt-0.5">
                                <span>Meks: {contract.mekIds.length}</span>
                                <span className="text-blue-400">
                                  {Math.max(0, Math.floor((contract.endTime - Date.now()) / 60000))}m left
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 text-sm">No active contracts</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-yellow-500/60 uppercase mb-2">
                      Recent Transactions ({userDetails.recentTransactions.length})
                    </h3>
                    <div className="max-h-[150px] overflow-y-auto space-y-1">
                      {userDetails.recentTransactions.slice(0, 10).map((tx: any) => (
                        <div key={tx._id} className="text-xs text-gray-400 py-0.5 flex justify-between">
                          <span className="capitalize">{tx.type}</span>
                          <span className={tx.amount && tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                            {tx.amount ? (tx.amount > 0 ? '+' : '') + tx.amount : tx.itemVariation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Options */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
                {showResetConfirm === selectedUserId ? (
                  <div className="flex gap-3 items-center">
                    <span className="text-yellow-500">Are you sure? Reset:</span>
                    <button
                      onClick={() => handleReset(selectedUserId, 'gold')}
                      className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-400 hover:bg-red-900/70 text-sm"
                    >
                      Gold Only
                    </button>
                    <button
                      onClick={() => handleReset(selectedUserId, 'essence')}
                      className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-400 hover:bg-red-900/70 text-sm"
                    >
                      Essence Only
                    </button>
                    <button
                      onClick={() => handleReset(selectedUserId, 'level')}
                      className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-400 hover:bg-red-900/70 text-sm"
                    >
                      Level Only
                    </button>
                    <button
                      onClick={() => handleReset(selectedUserId, 'all')}
                      className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-400 hover:bg-red-900/70 text-sm"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(null)}
                      className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-gray-400 hover:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(selectedUserId)}
                    className="px-4 py-2 bg-red-900/30 border border-red-500/50 rounded text-red-500 hover:bg-red-900/50 transition-colors"
                  >
                    Reset User Progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}