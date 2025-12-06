"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export default function InvestigateClaimPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "claims" | "inventory" | "reservations">("overview");
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // Fetch all data
  const data = useQuery(api.investigateFalseClaim.investigateAllData);

  // Cleanup mutations
  const deleteFalseClaim = useMutation(api.investigateFalseClaim.deleteFalseClaim);
  const resetInventoryToAvailable = useMutation(api.investigateFalseClaim.resetInventoryToAvailable);
  const cancelReservation = useMutation(api.investigateFalseClaim.cancelReservation);
  const comprehensiveCleanup = useMutation(api.investigateFalseClaim.comprehensiveCleanup);

  const [actionResult, setActionResult] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center">Loading investigation data...</div>
      </div>
    );
  }

  const handleDeleteClaim = async (claimId: Id<"commemorativeNFTClaims">) => {
    try {
      const result = await deleteFalseClaim({ claimId });
      setActionResult(`✓ Deleted claim: ${result.deletedClaim.nftName} (${result.deletedClaim.walletAddress})`);
    } catch (error) {
      setActionResult(`✗ Error: ${error}`);
    }
  };

  const handleResetInventory = async (nftUid: string) => {
    try {
      const result = await resetInventoryToAvailable({ nftUid });
      setActionResult(`✓ Reset ${result.nftName} from "${result.oldStatus}" to "${result.newStatus}"`);
    } catch (error) {
      setActionResult(`✗ Error: ${error}`);
    }
  };

  const handleCancelReservation = async (reservationId: Id<"commemorativeNFTReservations">) => {
    try {
      const result = await cancelReservation({ reservationId });
      setActionResult(`✓ Deleted reservation for NFT #${result.deletedReservation.nftNumber} (${result.deletedReservation.nftUid})`);
    } catch (error) {
      setActionResult(`✗ Error: ${error}`);
    }
  };

  const handleComprehensiveCleanup = async () => {
    try {
      const result = await comprehensiveCleanup({ confirmationCode: "CONFIRM_DELETE_ALL_CLAIMS" });
      setActionResult(`✓ ${result.message}\n- Deleted ${result.deletedClaimsCount} claims\n- Deleted ${result.deletedReservationsCount} reservations\n- Reset ${result.resetInventoryCount} inventory items`);
      setShowCleanupConfirm(false);
    } catch (error) {
      setActionResult(`✗ Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-yellow-500">False Claim Investigation</h1>
        <p className="text-gray-400 mb-8">
          Issue: 1 claim in database, but NMKR shows all 3 Lab Rats still "Free" (unminted)
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-yellow-500/30 p-4 rounded">
            <div className="text-gray-400 text-sm">Total Claims</div>
            <div className="text-3xl font-bold text-red-500">{data.summary.totalClaims}</div>
          </div>
          <div className="bg-gray-900 border border-yellow-500/30 p-4 rounded">
            <div className="text-gray-400 text-sm">Total Inventory</div>
            <div className="text-3xl font-bold text-yellow-500">{data.summary.totalInventory}</div>
          </div>
          <div className="bg-gray-900 border border-yellow-500/30 p-4 rounded">
            <div className="text-gray-400 text-sm">Total Reservations</div>
            <div className="text-3xl font-bold text-blue-500">{data.summary.totalReservations}</div>
          </div>
          <div className="bg-gray-900 border border-yellow-500/30 p-4 rounded">
            <div className="text-gray-400 text-sm">Total Campaigns</div>
            <div className="text-3xl font-bold text-green-500">{data.summary.totalCampaigns}</div>
          </div>
        </div>

        {/* Action Result */}
        {actionResult && (
          <div className="bg-gray-900 border border-green-500 p-4 rounded mb-4 whitespace-pre-wrap">
            {actionResult}
          </div>
        )}

        {/* Comprehensive Cleanup Button */}
        <div className="mb-8 bg-red-900/20 border border-red-500 p-6 rounded">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Comprehensive Cleanup</h2>
          <p className="text-gray-300 mb-4">
            This will delete ALL claims, ALL reservations, and reset ALL inventory to "available" to match NMKR reality.
          </p>
          {!showCleanupConfirm ? (
            <button
              onClick={() => setShowCleanupConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold"
            >
              RESET DATABASE TO MATCH NMKR
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-yellow-500 font-bold">⚠️ Are you ABSOLUTELY SURE?</p>
              <div className="flex gap-4">
                <button
                  onClick={handleComprehensiveCleanup}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold"
                >
                  YES, DELETE EVERYTHING
                </button>
                <button
                  onClick={() => setShowCleanupConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 ${activeTab === "overview" ? "border-b-2 border-yellow-500 text-yellow-500" : "text-gray-400"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2 ${activeTab === "claims" ? "border-b-2 border-yellow-500 text-yellow-500" : "text-gray-400"}`}
          >
            Claims ({data.summary.totalClaims})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 ${activeTab === "inventory" ? "border-b-2 border-yellow-500 text-yellow-500" : "text-gray-400"}`}
          >
            Inventory ({data.summary.totalInventory})
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 ${activeTab === "reservations" ? "border-b-2 border-yellow-500 text-yellow-500" : "text-gray-400"}`}
          >
            Reservations ({data.summary.totalReservations})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900 border border-gray-700 p-6 rounded">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Investigation Summary</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-yellow-500 mb-2">Problem:</h3>
                  <p className="text-gray-300">
                    Database shows {data.summary.totalClaims} claim(s), but NMKR Studio shows all 3 Lab Rats are still "Free" (unminted).
                    User never completed payment.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-500 mb-2">Expected State:</h3>
                  <ul className="list-disc list-inside text-gray-300">
                    <li>0 claims</li>
                    <li>0 reservations</li>
                    <li>3 inventory items with status "available"</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-500 mb-2">Actual State:</h3>
                  <ul className="list-disc list-inside text-gray-300">
                    <li>{data.summary.totalClaims} claim(s)</li>
                    <li>{data.summary.totalReservations} reservation(s)</li>
                    <li>{data.inventory.filter((inv: any) => inv.status === "available").length} available, {data.inventory.filter((inv: any) => inv.status === "reserved").length} reserved, {data.inventory.filter((inv: any) => inv.status === "sold").length} sold</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "claims" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Claims ({data.claims.length})</h2>
              {data.claims.length === 0 ? (
                <p className="text-gray-400">No claims found.</p>
              ) : (
                <div className="space-y-4">
                  {data.claims.map((claim) => (
                    <div key={claim._id} className="bg-black border border-red-500 p-4 rounded">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-gray-400 text-sm">Wallet Address</div>
                          <div className="font-mono text-sm">{claim.walletAddress}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">NFT Name</div>
                          <div className="font-bold">{claim.nftName}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Transaction Hash</div>
                          <div className="font-mono text-sm break-all">{claim.transactionHash}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Asset ID</div>
                          <div className="font-mono text-sm break-all">{claim.nftAssetId}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Claimed At</div>
                          <div className="text-sm">{claim.claimedAtDate}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Database ID</div>
                          <div className="font-mono text-xs">{claim._id}</div>
                        </div>
                      </div>
                      {claim.metadata && (
                        <div className="mb-4">
                          <div className="text-gray-400 text-sm">Metadata</div>
                          <pre className="text-xs bg-gray-950 p-2 rounded overflow-x-auto">
                            {JSON.stringify(claim.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteClaim(claim._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Delete This Claim
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "inventory" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Inventory ({data.inventory.length})</h2>
              <div className="space-y-4">
                {data.inventory.map((inv) => (
                  <div key={inv._id} className="bg-black border border-yellow-500/30 p-4 rounded">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-gray-400 text-sm">NFT Name</div>
                        <div className="font-bold">{inv.name}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Number</div>
                        <div className="font-bold">#{inv.nftNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Status</div>
                        <div className={`font-bold ${
                          inv.status === "available" ? "text-green-500" :
                          inv.status === "reserved" ? "text-yellow-500" :
                          "text-red-500"
                        }`}>
                          {inv.status.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">NFT UID</div>
                        <div className="font-mono text-sm">{inv.nftUid}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Project ID</div>
                        <div className="font-mono text-sm">{inv.projectId}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Created At</div>
                        <div className="text-sm">{inv.createdAtDate}</div>
                      </div>
                    </div>
                    {inv.status !== "available" && (
                      <button
                        onClick={() => handleResetInventory(inv.nftUid)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Reset to Available
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Reservations ({data.reservations.length})</h2>
              {data.reservations.length === 0 ? (
                <p className="text-gray-400">No reservations found.</p>
              ) : (
                <div className="space-y-4">
                  {data.reservations.map((res) => (
                    <div key={res._id} className="bg-black border border-blue-500 p-4 rounded">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-gray-400 text-sm">NFT Number</div>
                          <div className="font-bold">#{res.nftNumber}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">NFT UID</div>
                          <div className="font-mono text-sm">{res.nftUid}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Status</div>
                          <div className={`font-bold ${
                            res.status === "active" ? "text-green-500" :
                            res.status === "completed" ? "text-blue-500" :
                            res.status === "expired" ? "text-red-500" :
                            "text-gray-500"
                          }`}>
                            {res.status.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Reserved By</div>
                          <div className="font-mono text-sm">{res.reservedBy}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Reserved At</div>
                          <div className="text-sm">{res.reservedAtDate}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Expires At</div>
                          <div className="text-sm">{res.expiresAtDate}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(res._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Delete This Reservation
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
