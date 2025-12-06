"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { NFTInventoryItem, NFTStatus } from "@/types/campaign";

interface NFTInventoryTableProps {
  campaignId?: string;
  onRefresh?: () => void;
  onError?: (error: string) => void;
}

export default function NFTInventoryTable({
  campaignId,
  onRefresh,
  onError,
}: NFTInventoryTableProps) {
  const [filterStatus, setFilterStatus] = useState<NFTStatus | "all">("all");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const inventory = useQuery(api.commemorativeNFTInventorySetup.getAllInventory);
  const clearInventory = useMutation(
    api.commemorativeNFTInventorySetup.clearInventory
  );

  // Log when inventory data changes
  useEffect(() => {
    if (inventory) {
      console.log('[🎨UI] === NFTInventoryTable received new data ===');
      console.log('[🎨UI] Total items:', inventory.length);

      const statusCounts = {
        available: inventory.filter((item: any) => item.isAvailable).length,
        reserved: inventory.filter((item: any) => item.status === "reserved").length,
        sold: inventory.filter((item: any) => item.status === "sold").length,
      };
      console.log('[🎨UI] Status breakdown from useQuery data:', statusCounts);

      // Log first few items
      const sample = inventory.slice(0, 3);
      console.log('[🎨UI] Sample items:', sample.map((nft: any) => ({
        name: nft.name,
        nftUid: nft.nftUid,
        status: nft.status,
        isAvailable: nft.isAvailable,
      })));

      console.log('[🎨UI] === Component will re-render with this data ===');
    }
  }, [inventory]);

  const handleClearInventory = async () => {
    try {
      const result = await clearInventory({});
      setShowConfirmClear(false);
      onRefresh?.();
      console.log(`Cleared ${result.deleted} inventory items`);
    } catch (error) {
      const errorMsg = `Failed to clear inventory: ${error}`;
      onError?.(errorMsg);
      setShowConfirmClear(false);
    }
  };

  if (!inventory) {
    console.log('[🎨UI] Inventory is undefined/null - showing loading state');
    return (
      <div className="mek-card-industrial">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-400">Loading inventory...</div>
        </div>
      </div>
    );
  }

  const filteredInventory =
    filterStatus === "all"
      ? inventory
      : inventory.filter((item: any) => item.status === filterStatus);

  const stats = {
    total: inventory.length,
    available: inventory.filter((item: any) => item.isAvailable).length,
    reserved: inventory.filter((item: any) => item.status === "reserved").length,
    sold: inventory.filter((item: any) => item.status === "sold").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-400";
      case "reserved":
        return "text-yellow-400";
      case "sold":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 border-green-500 text-green-400";
      case "reserved":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      case "sold":
        return "bg-red-500/20 border-red-500 text-red-400";
      default:
        return "bg-gray-500/20 border-gray-500 text-gray-400";
    }
  };

  return (
    <div className="mek-card-industrial">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">
          NFT Inventory
        </h2>
        {!campaignId && (
          <p className="text-sm text-gray-400">
            Select a campaign to view its inventory
          </p>
        )}
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-lg font-semibold mb-1">No NFTs in Inventory</p>
            <p className="text-sm">
              Use CSV Import or Manual Entry to add NFTs
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-black/30 p-3 rounded border border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Total
              </p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-black/30 p-3 rounded border border-green-500/30">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Available
              </p>
              <p className="text-2xl font-bold text-green-400">
                {stats.available}
              </p>
            </div>
            <div className="bg-black/30 p-3 rounded border border-yellow-500/30">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Reserved
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.reserved}
              </p>
            </div>
            <div className="bg-black/30 p-3 rounded border border-red-500/30">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Sold
              </p>
              <p className="text-2xl font-bold text-red-400">{stats.sold}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === "all"
                    ? "bg-yellow-500 text-black font-semibold"
                    : "bg-black/50 text-gray-400 border border-gray-700"
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus("available")}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === "available"
                    ? "bg-green-500 text-black font-semibold"
                    : "bg-black/50 text-gray-400 border border-gray-700"
                }`}
              >
                Available ({stats.available})
              </button>
              <button
                onClick={() => setFilterStatus("reserved")}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === "reserved"
                    ? "bg-yellow-500 text-black font-semibold"
                    : "bg-black/50 text-gray-400 border border-gray-700"
                }`}
              >
                Reserved ({stats.reserved})
              </button>
              <button
                onClick={() => setFilterStatus("sold")}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === "sold"
                    ? "bg-red-500 text-black font-semibold"
                    : "bg-black/50 text-gray-400 border border-gray-700"
                }`}
              >
                Sold ({stats.sold})
              </button>
            </div>

            <button
              onClick={() => setShowConfirmClear(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
            <table className="w-full">
              <thead className="bg-black/50 sticky top-0">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-sm font-semibold text-gray-400">
                    #
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-400">
                    Name
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-400">
                    UID
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item: any) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-800 hover:bg-yellow-500/5"
                  >
                    <td className="p-3 font-mono text-sm">{item.nftNumber}</td>
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">
                      {item.nftUid}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="mek-card-industrial max-w-md">
            <h3 className="text-xl font-bold text-yellow-500 mb-3">
              Confirm Clear Inventory
            </h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete all {stats.total} NFT inventory
              items? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearInventory}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded flex-1"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="mek-button-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
