"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface NFTInventoryTableProps {
  campaignId: Id<"commemorativeCampaigns">;
  campaignName?: string;
  client: any; // ConvexReactClient or ConvexHttpClient for production queries
}

export default function NFTInventoryTable({ campaignId, campaignName, client }: NFTInventoryTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedNFTs, setSelectedNFTs] = useState<Set<Id<"commemorativeNFTInventory">>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(Date.now());
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Manual state for data from production client
  const [inventory, setInventory] = useState<any[] | null>(null);
  const [currentCompanyNames, setCurrentCompanyNames] = useState<Record<string, string> | null>(null);

  // Update "now" every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch inventory from the provided client (always production now)
  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const fetchInventory = async () => {
      try {
        const data = await client.query(api.commemorativeCampaigns.getCampaignInventory, { campaignId });
        if (!cancelled) {
          setInventory(data || []);
        }
      } catch (error) {
        console.error('[NFTInventoryTable] Error fetching inventory:', error);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, campaignId]);

  // Collect unique wallet addresses from sold/reserved NFTs
  const walletAddresses = useMemo(() => {
    if (!inventory) return [];
    const addresses = new Set<string>();
    for (const nft of inventory) {
      if (nft.soldTo) addresses.add(nft.soldTo);
      if (nft.reservedBy && nft.status === 'reserved') addresses.add(nft.reservedBy);
    }
    return Array.from(addresses);
  }, [inventory]);

  // Fetch company names from the provided client
  useEffect(() => {
    if (!client || walletAddresses.length === 0) {
      setCurrentCompanyNames(null);
      return;
    }

    let cancelled = false;

    const fetchCompanyNames = async () => {
      try {
        const data = await client.query(api.commemorativeCampaigns.getCompanyNamesForWallets, { walletAddresses });
        if (!cancelled) {
          setCurrentCompanyNames(data || {});
        }
      } catch (error) {
        console.error('[NFTInventoryTable] Error fetching company names:', error);
      }
    };

    fetchCompanyNames();

    return () => {
      cancelled = true;
    };
  }, [client, walletAddresses]);

  // Copy wallet address to clipboard
  const copyWallet = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(address);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  // DEBUG: Log when inventory data changes
  useEffect(() => {
    if (inventory) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`[🔄INVENTORY-UI ${timestamp}] Inventory data received:`, {
        total: inventory.length,
        statuses: {
          available: inventory.filter(n => n.status === 'available').length,
          reserved: inventory.filter(n => n.status === 'reserved').length,
          sold: inventory.filter(n => n.status === 'sold').length,
        },
        sample: inventory.slice(0, 3).map(n => ({
          name: n.name,
          status: n.status,
          soldTo: n.soldTo,
          companyNameAtSale: n.companyNameAtSale,
          reservedBy: n.reservedBy,
        }))
      });

      // DEBUG: Log all sold/reserved NFTs with their soldTo/corporation data
      const soldOrReserved = inventory.filter(n => n.status === 'sold' || n.status === 'reserved');
      if (soldOrReserved.length > 0) {
        console.log(`[🔄INVENTORY-UI ${timestamp}] Sold/Reserved NFTs data:`, soldOrReserved.map(n => ({
          name: n.name,
          status: n.status,
          soldTo: n.soldTo,
          reservedBy: n.reservedBy,
          companyNameAtSale: n.companyNameAtSale,
        })));
      }
    }
  }, [inventory]);

  // Manual mutation using the provided client
  const batchUpdateImages = async (args: { nftIds: Id<"commemorativeNFTInventory">[]; imageUrl: string }) => {
    if (!client) throw new Error('Client not available');
    return await client.mutation(api.commemorativeCampaigns.batchUpdateNFTImages, args);
  };

  if (!inventory) {
    return (
      <div className="mb-3 p-3 bg-black/30 rounded border border-gray-700">
        <div className="text-sm text-gray-400">Loading inventory...</div>
      </div>
    );
  }

  if (inventory.length === 0) {
    return null;
  }

  const statusConfig = {
    available: {
      label: "Available",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    reserved: {
      label: "Reserved",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    },
    sold: {
      label: "Sold",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };

  // Format countdown timer for reserved NFTs
  const formatCountdown = (expiresAt: number | undefined): { text: string; isExpired: boolean; isMissing: boolean } => {
    if (!expiresAt) {
      return { text: "No expiry set!", isExpired: true, isMissing: true };
    }

    const remaining = expiresAt - now;

    if (remaining <= 0) {
      return { text: "EXPIRED", isExpired: true, isMissing: false };
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return {
      text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      isExpired: false,
      isMissing: false
    };
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(inventory.map(nft => nft._id));
      setSelectedNFTs(allIds);
    } else {
      setSelectedNFTs(new Set());
    }
  };

  const handleSelectOne = (nftId: Id<"commemorativeNFTInventory">, checked: boolean) => {
    const newSelected = new Set(selectedNFTs);
    if (checked) {
      newSelected.add(nftId);
    } else {
      newSelected.delete(nftId);
    }
    setSelectedNFTs(newSelected);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImage = async () => {
    if (!uploadedImage || selectedNFTs.size === 0) return;

    setIsUploading(true);

    try {
      const nftIds = Array.from(selectedNFTs);
      await batchUpdateImages({
        nftIds,
        imageUrl: uploadedImage,
      });

      setUploadedImage(null);
      setSelectedNFTs(new Set());
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to apply image:', error);
      alert('Failed to apply image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const allSelected = inventory.length > 0 && selectedNFTs.size === inventory.length;
  const someSelected = selectedNFTs.size > 0 && selectedNFTs.size < inventory.length;

  return (
    <div className="mb-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 bg-black/30 rounded border border-gray-700 hover:border-yellow-500/50 transition-colors flex items-center justify-between text-left"
      >
        <div>
          <h4 className="text-sm font-semibold text-white">
            NFT Inventory Details
          </h4>
          <p className="text-xs text-gray-400">
            {inventory.length} NFT{inventory.length !== 1 ? 's' : ''} in campaign
            {selectedNFTs.size > 0 && ` • ${selectedNFTs.size} selected`}
          </p>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>

      {/* Expanded Inventory Table */}
      {isExpanded && (
        <div className="mt-2 space-y-3">
          {/* Image Upload Panel */}
          {selectedNFTs.size > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <h5 className="text-sm font-semibold text-yellow-400 mb-3">
                Bulk Image Assignment ({selectedNFTs.size} NFT{selectedNFTs.size !== 1 ? 's' : ''} selected)
              </h5>

              <div className="flex items-start gap-4">
                {/* Upload Input */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select an image to assign to all selected NFTs
                  </p>
                </div>

                {/* Image Preview */}
                {uploadedImage && (
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="w-16 h-16 rounded border border-yellow-500/50 object-cover"
                    />
                    <button
                      onClick={handleApplyImage}
                      disabled={isUploading}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-semibold rounded transition-colors disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Applying...' : `Apply to ${selectedNFTs.size} NFT${selectedNFTs.size !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Selection */}
              <button
                onClick={() => setSelectedNFTs(new Set())}
                className="mt-3 text-xs text-gray-400 hover:text-white transition-colors underline"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* NFT Table */}
          <div className="border border-gray-700 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/50 border-b border-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = someSelected;
                          }
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-black/50 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      NFT UID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Claimed By
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Corporation
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Sold At
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-black/20 divide-y divide-gray-700">
                  {inventory.map((nft) => {
                    const config = statusConfig[nft.status];
                    const isSelected = selectedNFTs.has(nft._id);

                    return (
                      <tr
                        key={nft._id}
                        className={`hover:bg-black/40 transition-colors ${isSelected ? 'bg-yellow-500/5' : ''}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(nft._id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-black/50 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-white font-mono">
                          {nft.nftNumber}
                        </td>
                        <td className="px-3 py-2 text-white">
                          {nft.name}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}
                            >
                              {config.label}
                            </span>
                            {nft.status === 'reserved' && (() => {
                              const countdown = formatCountdown(nft.expiresAt);
                              return (
                                <span
                                  className={`text-xs font-mono ${
                                    countdown.isExpired
                                      ? 'text-red-400 font-bold animate-pulse'
                                      : 'text-gray-400'
                                  }`}
                                  title={countdown.isMissing ? 'This reservation has no expiry time set - it may be stuck!' : `Expires at ${nft.expiresAt ? new Date(nft.expiresAt).toLocaleTimeString() : 'unknown'}`}
                                >
                                  {countdown.text}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-400 font-mono bg-black/50 px-2 py-1 rounded">
                              {nft.nftUid.substring(0, 8)}...
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(nft.nftUid);
                              }}
                              className="text-gray-500 hover:text-yellow-400 transition-colors"
                              title="Copy full UID"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const walletAddress = nft.soldTo || (nft.status === 'reserved' ? nft.reservedBy : null);
                            if (!walletAddress) {
                              return <span className="text-xs text-gray-500">-</span>;
                            }
                            const truncated = `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}`;
                            return (
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-gray-400 font-mono bg-black/50 px-2 py-1 rounded">
                                  {truncated}
                                </code>
                                <button
                                  onClick={() => copyWallet(walletAddress)}
                                  className="text-gray-500 hover:text-yellow-400 transition-colors"
                                  title="Copy full address"
                                >
                                  {copiedWallet === walletAddress ? (
                                    <span className="text-green-400 text-xs">Copied!</span>
                                  ) : (
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const walletAddress = nft.soldTo || (nft.status === 'reserved' ? nft.reservedBy : null);
                            const historicalName = nft.companyNameAtSale;
                            const currentName = walletAddress && currentCompanyNames ? currentCompanyNames[walletAddress] : null;

                            if (!walletAddress) {
                              return <span className="text-xs text-gray-500">-</span>;
                            }

                            if (!historicalName && !currentName) {
                              return <span className="text-xs text-gray-500 italic">No corporation</span>;
                            }

                            const hasChanged = historicalName && currentName && historicalName !== currentName;
                            const isMissingHistorical = !historicalName && currentName;

                            if (hasChanged) {
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-white">{historicalName}</span>
                                  <span
                                    className="text-xs text-yellow-400 cursor-pointer hover:underline"
                                    title={`Current name: ${currentName}`}
                                  >
                                    (now: {currentName})
                                  </span>
                                </div>
                              );
                            }

                            if (isMissingHistorical) {
                              return (
                                <span
                                  className="text-xs text-gray-400 italic"
                                  title="Historical name not recorded - showing current name"
                                >
                                  {currentName} (current)
                                </span>
                              );
                            }

                            return <span className="text-xs text-white">{historicalName || currentName}</span>;
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          {nft.soldAt ? (
                            <span className="text-xs text-gray-300">
                              {new Date(nft.soldAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              <br />
                              <span className="text-gray-500">
                                {new Date(nft.soldAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {nft.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={nft.imageUrl}
                                alt={nft.name}
                                className="w-8 h-8 rounded border border-gray-600 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/logo-big.png';
                                }}
                              />
                              <span className="text-xs text-green-400">✓</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No image</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
