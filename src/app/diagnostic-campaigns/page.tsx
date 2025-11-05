"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DiagnosticCampaignsPage() {
  const campaigns = useQuery(api.diagnosticCampaigns.checkCampaignProjectIds);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Campaign Project ID Diagnostics</h1>

      <div className="mb-4 p-4 bg-gray-800 rounded">
        <h2 className="font-semibold mb-2">Environment Variable:</h2>
        <p className="font-mono text-sm">
          NEXT_PUBLIC_NMKR_PROJECT_ID = c68dc8e9b2ca4e0e09c4a57ef85a794d
        </p>
        <p className="text-xs text-gray-400 mt-1">Length: 32 characters</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-xl">Database Campaign Data:</h2>

        {!campaigns && <p>Loading...</p>}

        {campaigns && campaigns.length === 0 && (
          <p className="text-yellow-500">No campaigns found in database</p>
        )}

        {campaigns && campaigns.map((campaign) => (
          <div key={campaign._id} className="p-4 bg-gray-800 rounded border-2 border-gray-700">
            <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-semibold">Campaign ID:</div>
              <div className="font-mono">{campaign._id}</div>

              <div className="font-semibold">Status:</div>
              <div>{campaign.status}</div>

              <div className="font-semibold">nmkrProjectId:</div>
              <div className="font-mono break-all">{campaign.nmkrProjectId}</div>

              <div className="font-semibold">Length:</div>
              <div>{campaign.nmkrProjectIdLength} characters</div>

              <div className="font-semibold">Type:</div>
              <div>{campaign.nmkrProjectIdType}</div>

              <div className="font-semibold col-span-2 mt-2">Match with ENV?</div>
              <div className="col-span-2">
                {campaign.nmkrProjectId === "c68dc8e9b2ca4e0e09c4a57ef85a794d" ? (
                  <span className="text-green-500">✅ MATCHES</span>
                ) : (
                  <span className="text-red-500">❌ DOES NOT MATCH</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
