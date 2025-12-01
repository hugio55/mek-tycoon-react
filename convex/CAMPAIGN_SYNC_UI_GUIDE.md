# Campaign Sync System - UI Integration Guide

## Quick Start

The sync system is **fully implemented** on the backend. To integrate into your Campaign Manager UI:

---

## 1. Basic Sync Button

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export function CampaignSyncButton({
  campaignId
}: {
  campaignId: Id<"commemorativeCampaigns">
}) {
  const syncCampaign = useMutation(api.campaignSync.syncCampaignPublic);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const syncResult = await syncCampaign({ campaignId });
      setResult(syncResult);
      console.log("Sync complete:", syncResult);
    } catch (error) {
      console.error("Sync failed:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync with NMKR"}
      </button>

      {result && (
        <div className="mt-4">
          <SyncReportDisplay result={result} />
        </div>
      )}
    </div>
  );
}
```

---

## 2. Sync Report Display Component

```typescript
function SyncReportDisplay({ result }: { result: any }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h3 className="font-bold text-red-800">Sync Failed</h3>
        <p className="text-red-600">{result.error || "Unknown error occurred"}</p>
      </div>
    );
  }

  const {
    nmkrStats,
    dbStats,
    discrepancies,
    updateResults,
    updatedCount,
    recentWebhooks,
    blockchainResults
  } = result;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded p-4">
        <h3 className="font-bold text-green-800">✅ Sync Complete</h3>
        <p className="text-sm text-gray-600">
          Completed in {result.durationMs}ms • Updated {updatedCount} NFTs
        </p>
      </div>

      {/* Stats Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard title="NMKR (Live)" stats={nmkrStats} />
        <StatsCard title="Database" stats={dbStats} />
      </div>

      {/* Discrepancies */}
      {discrepancies && discrepancies.length > 0 && (
        <DiscrepanciesTable discrepancies={discrepancies} />
      )}

      {/* Updates Applied */}
      {updateResults && updateResults.length > 0 && (
        <UpdatesTable updates={updateResults} />
      )}

      {/* Webhook Activity */}
      {recentWebhooks && recentWebhooks.length > 0 && (
        <WebhookActivityLog webhooks={recentWebhooks} />
      )}

      {/* Blockchain Verification (optional) */}
      {blockchainResults && blockchainResults.length > 0 && (
        <BlockchainVerificationTable results={blockchainResults} />
      )}
    </div>
  );
}

function StatsCard({
  title,
  stats
}: {
  title: string;
  stats: { total: number; available: number; reserved: number; sold: number }
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4">
      <h4 className="font-bold mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-bold">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Available:</span>
          <span className="text-green-600">{stats.available}</span>
        </div>
        <div className="flex justify-between">
          <span>Reserved:</span>
          <span className="text-yellow-600">{stats.reserved}</span>
        </div>
        <div className="flex justify-between">
          <span>Sold:</span>
          <span className="text-blue-600">{stats.sold}</span>
        </div>
      </div>
    </div>
  );
}

function DiscrepanciesTable({
  discrepancies
}: {
  discrepancies: Array<{
    nftUid: string;
    nftName: string;
    issue: string;
    dbStatus: string;
    nmkrStatus: string;
  }>
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
      <h4 className="font-bold mb-2">⚠️ Discrepancies Found</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">NFT</th>
            <th className="text-left py-2">Issue</th>
            <th className="text-left py-2">Database</th>
            <th className="text-left py-2">NMKR</th>
          </tr>
        </thead>
        <tbody>
          {discrepancies.map((d, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{d.nftName}</td>
              <td className="py-2">{d.issue}</td>
              <td className="py-2">
                <StatusBadge status={d.dbStatus} />
              </td>
              <td className="py-2">
                <StatusBadge status={d.nmkrStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdatesTable({
  updates
}: {
  updates: Array<{
    success: boolean;
    nftName: string;
    oldStatus?: string;
    newStatus?: string;
    error?: string;
  }>
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4">
      <h4 className="font-bold mb-2">📝 Updates Applied</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">NFT</th>
            <th className="text-left py-2">Change</th>
            <th className="text-left py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {updates.map((u, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{u.nftName}</td>
              <td className="py-2">
                {u.success ? (
                  <span>
                    <StatusBadge status={u.oldStatus || ""} />
                    {" → "}
                    <StatusBadge status={u.newStatus || ""} />
                  </span>
                ) : (
                  <span className="text-red-600">Failed</span>
                )}
              </td>
              <td className="py-2">
                {u.success ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600" title={u.error}>✗</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WebhookActivityLog({
  webhooks
}: {
  webhooks: Array<{
    timestamp: number;
    status: string;
    recordsSynced: number;
    errors?: string[];
  }>
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4">
      <h4 className="font-bold mb-2">📡 Recent Webhook Activity</h4>
      <div className="space-y-2 text-sm">
        {webhooks.map((webhook, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b">
            <span className="text-gray-600">
              {new Date(webhook.timestamp).toLocaleString()}
            </span>
            <span>
              {webhook.recordsSynced} records
            </span>
            <StatusBadge status={webhook.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockchainVerificationTable({
  results
}: {
  results: Array<{
    nftName: string;
    nftUid: string;
    status: string;
    message: string;
    assetId?: string;
  }>
}) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded p-4">
      <h4 className="font-bold mb-2">🔗 Blockchain Verification</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">NFT</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{r.nftName}</td>
              <td className="py-2">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2 text-xs text-gray-600">{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    sold: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    error: "bg-red-100 text-red-800",
    delivered: "bg-green-100 text-green-800",
    pending_delivery: "bg-yellow-100 text-yellow-800",
  };

  const color = colors[status] || "bg-gray-100 text-gray-800";

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
```

---

## 3. Advanced: Real-Time Webhook Activity Display

Query webhook logs separately for real-time updates:

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function WebhookActivityMonitor({
  nmkrProjectId
}: {
  nmkrProjectId: string
}) {
  const webhookLogs = useQuery(
    api.campaignSync.getWebhookActivityForProject,
    { nmkrProjectId, limit: 20 }
  );

  if (!webhookLogs) {
    return <div>Loading webhook activity...</div>;
  }

  return (
    <div className="bg-white border rounded p-4">
      <h3 className="font-bold mb-4">Webhook Activity Log</h3>
      <div className="space-y-2">
        {webhookLogs.map((log, i) => (
          <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
            <span className="text-gray-600">
              {new Date(log.timestamp).toLocaleString()}
            </span>
            <span className="text-gray-700">
              {log.syncType} • {log.recordsSynced} records
            </span>
            <StatusBadge status={log.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Sync History Query

Get full sync history for a campaign:

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function CampaignSyncHistory({
  campaignId
}: {
  campaignId: Id<"commemorativeCampaigns">
}) {
  const syncHistory = useQuery(
    api.campaignSync.getCampaignSyncHistory,
    { campaignId, limit: 50 }
  );

  if (!syncHistory) {
    return <div>Loading sync history...</div>;
  }

  return (
    <div className="bg-white border rounded p-4">
      <h3 className="font-bold mb-4">Sync History</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Date</th>
            <th className="text-left py-2">Type</th>
            <th className="text-left py-2">Records</th>
            <th className="text-left py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {syncHistory.map((event, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">
                {new Date(event.timestamp).toLocaleString()}
              </td>
              <td className="py-2">{event.syncType}</td>
              <td className="py-2">{event.recordsSynced}</td>
              <td className="py-2">
                <StatusBadge status={event.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 5. Full Campaign Manager Integration

Putting it all together:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CampaignSyncButton } from "@/components/CampaignSyncButton";
import { WebhookActivityMonitor } from "@/components/WebhookActivityMonitor";
import { CampaignSyncHistory } from "@/components/CampaignSyncHistory";

export default function CampaignManagerPage({
  campaignId
}: {
  campaignId: Id<"commemorativeCampaigns">
}) {
  const campaign = useQuery(api.commemorativeCampaigns.getCampaignById, {
    campaignId
  });

  if (!campaign) {
    return <div>Loading campaign...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Campaign Header */}
      <div className="bg-white border rounded p-6">
        <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
        <p className="text-gray-600">{campaign.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <span className="text-sm text-gray-500">Available:</span>
            <span className="ml-2 font-bold text-green-600">
              {campaign.availableNFTs}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Reserved:</span>
            <span className="ml-2 font-bold text-yellow-600">
              {campaign.reservedNFTs}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Sold:</span>
            <span className="ml-2 font-bold text-blue-600">
              {campaign.soldNFTs}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Section */}
      <div className="bg-white border rounded p-6">
        <h2 className="text-xl font-bold mb-4">Campaign Sync</h2>
        <CampaignSyncButton campaignId={campaignId} />
      </div>

      {/* Webhook Activity */}
      <WebhookActivityMonitor nmkrProjectId={campaign.nmkrProjectId} />

      {/* Sync History */}
      <CampaignSyncHistory campaignId={campaignId} />
    </div>
  );
}
```

---

## Error Handling

The sync system handles errors gracefully:

1. **NMKR API Down**: Returns partial report with error message
2. **NFT Not Found**: Adds to discrepancies, doesn't update database
3. **Update Fails**: Continues with other NFTs, marks sync as "partial"
4. **Network Issues**: Throws error, caught by try-catch in UI

Always wrap sync calls in try-catch:

```typescript
try {
  const result = await syncCampaign({ campaignId });
  // Handle success
} catch (error) {
  // Handle error
  console.error("Sync failed:", error);
  alert("Sync failed. Please try again.");
}
```

---

## Performance Considerations

- **Sync Duration**: Typically 2-5 seconds for small campaigns (<50 NFTs)
- **Rate Limiting**: NMKR API has rate limits - avoid rapid sync clicks
- **Debouncing**: Disable sync button while syncing

Recommended debounce:

```typescript
const [syncing, setSyncing] = useState(false);
const [lastSync, setLastSync] = useState<number>(0);

const handleSync = async () => {
  const now = Date.now();
  if (now - lastSync < 5000) {
    alert("Please wait 5 seconds between syncs");
    return;
  }

  setSyncing(true);
  setLastSync(now);

  try {
    const result = await syncCampaign({ campaignId });
    // ...
  } finally {
    setSyncing(false);
  }
};
```

---

## Environment Variables Required

Make sure these are set:

```bash
# .env.local
NMKR_API_KEY=your_nmkr_api_key_here
NEXT_PUBLIC_NMKR_NETWORK=mainnet  # or "preprod"

# Optional (for blockchain verification)
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
BLOCKFROST_NETWORK=mainnet
```

---

## Testing Checklist

Before deploying to production:

1. ✅ Test sync button with active campaign
2. ✅ Verify stats comparison displays correctly
3. ✅ Check discrepancies table shows mismatches
4. ✅ Confirm updates are applied to database
5. ✅ Verify webhook activity log displays
6. ✅ Test error handling (disconnect internet, try sync)
7. ✅ Verify sync history persists across page reloads
8. ✅ Check performance with large campaigns (50+ NFTs)
9. ✅ Test concurrent webhook + manual sync
10. ✅ Verify blockchain verification (if enabled)

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify environment variables are set
3. Check Convex dashboard for function logs
4. Review `nmkrSyncLog` table for sync history
5. Verify NMKR API key has correct permissions

**Sync System Status**: ✅ Ready for production
