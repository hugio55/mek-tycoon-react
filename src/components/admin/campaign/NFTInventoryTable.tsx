"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface NFTInventoryTableProps {
  campaignId: Id<"commemorativeCampaigns">;
}

export default function NFTInventoryTable({ campaignId }: NFTInventoryTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const inventory = useQuery(
    api.commemorativeCampaigns.getCampaignInventory,
    { campaignId }
  );

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
          </p>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>

      {/* Expanded Inventory Table */}
      {isExpanded && (
        <div className="mt-2 border border-gray-700 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/50 border-b border-gray-700">
                <tr>
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
                    Image
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black/20 divide-y divide-gray-700">
                {inventory.map((nft) => {
                  const config = statusConfig[nft.status];
                  return (
                    <tr key={nft._id} className="hover:bg-black/40 transition-colors">
                      <td className="px-3 py-2 text-white font-mono">
                        {nft.nftNumber}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {nft.name}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}
                        >
                          {config.label}
                        </span>
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
                      <td className="px-3 py-2">
                        <a
                          href={nft.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                          View Payment
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
