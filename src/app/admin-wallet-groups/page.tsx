"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function AdminWalletGroupsPage() {
  const [walletToCheck, setWalletToCheck] = useState("");
  const [auditWallet, setAuditWallet] = useState("");

  const diagnostics = useQuery(
    api.debugWalletGroups.checkWalletGroupStatus,
    walletToCheck ? { walletAddress: walletToCheck } : {}
  );

  const auditLogs = useQuery(
    api.debugWalletGroups.getWalletGroupAuditLogs,
    auditWallet ? { walletAddress: auditWallet, limit: 50 } : { limit: 50 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-500">
          Wallet Group Diagnostics
        </h1>

        {/* Wallet Status Checker */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            Check Wallet Status
          </h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={walletToCheck}
              onChange={(e) => setWalletToCheck(e.target.value)}
              placeholder="Enter stake address (stake1...)"
              className="flex-1 bg-black/50 border border-yellow-500/50 rounded px-4 py-2 text-white"
            />
            <button
              onClick={() => setWalletToCheck("")}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500 px-6 py-2 rounded"
            >
              Clear
            </button>
          </div>

          {diagnostics && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="bg-black/50 border border-yellow-500/30 rounded p-4">
                <h3 className="text-xl font-bold mb-3 text-yellow-300">
                  Database Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Total Groups</div>
                    <div className="text-2xl font-bold">{diagnostics.summary.totalGroups}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Total Memberships</div>
                    <div className="text-2xl font-bold">{diagnostics.summary.totalMemberships}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Single-Wallet Groups</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {diagnostics.summary.singleWalletGroups}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Orphaned Groups</div>
                    <div className="text-2xl font-bold text-red-400">
                      {diagnostics.summary.orphanedGroups}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Orphaned Memberships</div>
                    <div className="text-2xl font-bold text-red-400">
                      {diagnostics.summary.orphanedMemberships}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Duplicate Memberships</div>
                    <div className="text-2xl font-bold text-red-400">
                      {diagnostics.summary.duplicateMemberships}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet-Specific Data */}
              {diagnostics.walletSpecificData && (
                <div className="bg-black/50 border border-yellow-500/30 rounded p-4">
                  <h3 className="text-xl font-bold mb-3 text-yellow-300">
                    Wallet: {diagnostics.walletSpecificData.walletAddress}
                  </h3>
                  {diagnostics.walletSpecificData.hasMembership ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Has Membership:</span>
                        <span className="text-green-400 font-bold">YES</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Group ID:</span>
                        <span className="font-mono text-sm">{diagnostics.walletSpecificData.groupId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Group Primary Wallet:</span>
                        <span className="font-mono text-sm">{diagnostics.walletSpecificData.groupPrimaryWallet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Members in Group:</span>
                        <span className="font-bold">{diagnostics.walletSpecificData.totalMembersInGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nickname:</span>
                        <span>{diagnostics.walletSpecificData.nickname || "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Original Company Name:</span>
                        <span>{diagnostics.walletSpecificData.originalCompanyName || "None"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Group Exists:</span>
                        <span className={diagnostics.walletSpecificData.groupExists ? "text-green-400" : "text-red-400"}>
                          {diagnostics.walletSpecificData.groupExists ? "YES" : "NO (ORPHANED!)"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="text-gray-400 mb-2">All Members in Group:</div>
                        <div className="space-y-2">
                          {diagnostics.walletSpecificData.allMembersInGroup?.map((member: any, idx: number) => (
                            <div key={idx} className="bg-gray-900/50 p-2 rounded text-sm">
                              <div className="font-mono">{member.wallet}</div>
                              {member.nickname && <div className="text-gray-500">Nickname: {member.nickname}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      This wallet has NO group membership
                    </div>
                  )}
                </div>
              )}

              {/* Data Integrity Issues */}
              {(diagnostics.orphanedGroups.length > 0 ||
                diagnostics.orphanedMemberships.length > 0 ||
                diagnostics.duplicateMemberships.length > 0) && (
                <div className="bg-red-900/20 border border-red-500/50 rounded p-4">
                  <h3 className="text-xl font-bold mb-3 text-red-400">
                    ⚠️ Data Integrity Issues Found
                  </h3>

                  {diagnostics.orphanedGroups.length > 0 && (
                    <div className="mb-4">
                      <div className="font-bold text-red-300 mb-2">
                        Orphaned Groups ({diagnostics.orphanedGroups.length}):
                      </div>
                      <div className="space-y-2">
                        {diagnostics.orphanedGroups.map((group: any, idx: number) => (
                          <div key={idx} className="bg-black/50 p-2 rounded text-sm">
                            <div>Group ID: {group.groupId}</div>
                            <div>Primary: {group.primaryWallet}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnostics.orphanedMemberships.length > 0 && (
                    <div className="mb-4">
                      <div className="font-bold text-red-300 mb-2">
                        Orphaned Memberships ({diagnostics.orphanedMemberships.length}):
                      </div>
                      <div className="space-y-2">
                        {diagnostics.orphanedMemberships.map((membership: any, idx: number) => (
                          <div key={idx} className="bg-black/50 p-2 rounded text-sm">
                            <div>Wallet: {membership.walletAddress}</div>
                            <div>Group ID: {membership.groupId} (MISSING)</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnostics.duplicateMemberships.length > 0 && (
                    <div className="mb-4">
                      <div className="font-bold text-red-300 mb-2">
                        Duplicate Memberships ({diagnostics.duplicateMemberships.length}):
                      </div>
                      <div className="space-y-2">
                        {diagnostics.duplicateMemberships.map((dup: any, idx: number) => (
                          <div key={idx} className="bg-black/50 p-2 rounded text-sm">
                            <div>Wallet: {dup.wallet}</div>
                            <div>In {dup.count} groups: {dup.groups.join(", ")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Single-Wallet Groups */}
              {diagnostics.singleWalletGroups.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/50 rounded p-4">
                  <h3 className="text-xl font-bold mb-3 text-blue-400">
                    Single-Wallet Groups ({diagnostics.singleWalletGroups.length})
                  </h3>
                  <div className="text-sm text-gray-400 mb-3">
                    These groups only have one member. This is normal for wallets that haven't been grouped yet.
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {diagnostics.singleWalletGroups.map((group: any, idx: number) => (
                      <div key={idx} className="bg-black/50 p-2 rounded text-sm">
                        <div className="font-mono text-xs">Group: {group.groupId}</div>
                        <div className="font-mono text-xs">Primary: {group.primaryWallet}</div>
                        <div className="font-mono text-xs">Member: {group.memberWallet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            Audit Logs (Last 50)
          </h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={auditWallet}
              onChange={(e) => setAuditWallet(e.target.value)}
              placeholder="Filter by wallet address (optional)"
              className="flex-1 bg-black/50 border border-yellow-500/50 rounded px-4 py-2 text-white"
            />
            <button
              onClick={() => setAuditWallet("")}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500 px-6 py-2 rounded"
            >
              Clear Filter
            </button>
          </div>

          {auditLogs && (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditLogs.logs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded border ${
                    log.success
                      ? "bg-green-900/20 border-green-500/30"
                      : "bg-red-900/20 border-red-500/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-sm">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {log.timestampReadable}
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-gray-300">
                    <div>Group: {log.groupId}</div>
                    <div>Performed By: {log.performedBy}</div>
                    {log.targetWallet && <div>Target Wallet: {log.targetWallet}</div>}
                    {log.errorMessage && (
                      <div className="text-red-400 font-bold">Error: {log.errorMessage}</div>
                    )}
                    {log.signature && <div>Signature: {log.signature}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
