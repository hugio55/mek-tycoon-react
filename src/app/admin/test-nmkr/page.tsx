"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function TestNMKRPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Actions and mutations
  const testProjectInfo = useAction(api.nmkr.getProjectInfo);
  const testFetchNFTs = useAction(api.nmkr.fetchNFTsFromNMKR);
  const initFromCSV = useAction(api.commemorativeNFTInventorySetup.initializeFromCSV);
  const initFromAPI = useAction(api.commemorativeNFTInventorySetup.initializeInventoryFromNMKR);
  const addKnownNFTs = useAction(api.commemorativeNFTInventorySetup.addKnownNFTs);
  const clearInventory = useMutation(api.commemorativeNFTInventorySetup.clearInventory);

  // Queries
  const inventory = useQuery(api.commemorativeNFTInventorySetup.getAllInventory);
  const availableCount = useQuery(api.commemorativeNFTInventorySetup.getAvailableCount);

  const addLog = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const handleTestProjectInfo = async () => {
    setIsLoading(true);
    addLog("Testing project info API...");
    try {
      const result = await testProjectInfo({
        projectId: "c68dc0e9b2ca4e0eb9c4a57ef85a794d",
      });
      if (result) {
        addLog(`✅ Success! Project: ${result.projectName}, NFTs: ${result.nftCount}`);
      } else {
        addLog("❌ Failed - Project not found or API error");
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleTestFetchNFTs = async () => {
    setIsLoading(true);
    addLog("Testing fetch NFTs API...");
    try {
      const result = await testFetchNFTs({
        projectId: "c68dc0e9b2ca4e0eb9c4a57ef85a794d",
        state: "free",
        count: 10,
        page: 1,
      });
      addLog(`✅ Success! Fetched ${result.length} NFTs`);
      if (result.length > 0) {
        addLog(`First NFT: ${result[0].name} (UID: ${result[0].uid})`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleInitFromCSV = async () => {
    if (!csvContent.trim()) {
      addLog("❌ Please paste CSV content first");
      return;
    }

    setIsLoading(true);
    addLog("Initializing from CSV...");
    try {
      const result = await initFromCSV({ csvContent });
      addLog(`✅ Success! Created: ${result.created}, Skipped: ${result.skipped}`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleInitFromAPI = async () => {
    setIsLoading(true);
    addLog("Initializing from API...");
    try {
      const result = await initFromAPI({});
      addLog(`✅ Success! Created: ${result.created}, Skipped: ${result.skipped}`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleAddKnownNFTs = async () => {
    setIsLoading(true);
    addLog("Adding known test NFTs...");
    try {
      const result = await addKnownNFTs({});
      addLog(`✅ Success! Added ${result.created} NFTs`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleClearInventory = async () => {
    if (!confirm("Clear all inventory entries?")) return;

    setIsLoading(true);
    addLog("Clearing inventory...");
    try {
      const result = await clearInventory({});
      addLog(`✅ Deleted ${result.deleted} entries`);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mek-card-industrial">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">NMKR API Test Console</h1>
          <p className="text-gray-400">Test NMKR Studio API integration and inventory setup</p>
        </div>

        {/* Current Inventory Status */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Current Inventory Status</h2>
          <div className="space-y-2">
            <p>Total Entries: {inventory?.length || 0}</p>
            <p>Available: {availableCount || 0}</p>
            {inventory && inventory.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Inventory Items:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {inventory.map((item) => (
                    <div key={item._id} className="bg-black/50 p-2 rounded border border-gray-700">
                      <p className="font-mono text-sm">
                        {item.name} (#{item.nftNumber})
                      </p>
                      <p className="text-xs text-gray-500">UID: {item.nftUid}</p>
                      <p className="text-xs text-gray-500">
                        {item.isAvailable ? "✅ Available" : "🔴 Sold"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Testing */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">API Testing</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestProjectInfo}
              disabled={isLoading}
              className="mek-button-primary w-full"
            >
              Test 1: Get Project Info
            </button>
            <button
              onClick={handleTestFetchNFTs}
              disabled={isLoading}
              className="mek-button-primary w-full"
            >
              Test 2: Fetch NFTs List
            </button>
            <p className="text-sm text-gray-400">
              These test if the NMKR API is accessible with current credentials
            </p>
          </div>
        </div>

        {/* CSV Upload Method */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Method 1: CSV Import (RECOMMENDED)
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Paste CSV content from NMKR Studio export:
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full h-40 bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm"
                placeholder="uid,name,nftnumber,state&#10;10aec295-d9e247e39c04e56e2df92ad5,Lab Rat #1,1,free&#10;..."
              />
            </div>
            <button
              onClick={handleInitFromCSV}
              disabled={isLoading || !csvContent.trim()}
              className="mek-button-primary w-full"
            >
              Initialize from CSV
            </button>
            <p className="text-sm text-gray-400">
              1. Go to NMKR Studio → Your Project → NFTs tab<br />
              2. Click Export/Download CSV<br />
              3. Paste content here and click Initialize
            </p>
          </div>
        </div>

        {/* API Method */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Method 2: API Import (Has Issues Currently)
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleInitFromAPI}
              disabled={isLoading}
              className="mek-button-secondary w-full"
            >
              Initialize from NMKR API
            </button>
            <p className="text-sm text-gray-400">
              This may fail with 406 error due to Project UID mismatch.<br />
              Use CSV method if this doesn't work.
            </p>
          </div>
        </div>

        {/* Manual Method */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Method 3: Add Known NFTs (For Testing)
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleAddKnownNFTs}
              disabled={isLoading}
              className="mek-button-secondary w-full"
            >
              Add Lab Rat #1 (Known UID)
            </button>
            <p className="text-sm text-gray-400">
              Manually adds NFTs with known UIDs (currently only Lab Rat #1)
            </p>
          </div>
        </div>

        {/* Utilities */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Utilities</h2>
          <button
            onClick={handleClearInventory}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded w-full"
          >
            Clear All Inventory
          </button>
        </div>

        {/* Test Results Log */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">Test Results</h2>
          <div className="bg-black/50 rounded p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Run tests to see results...</p>
            ) : (
              testResults.map((result, i) => (
                <div key={i} className="text-gray-300">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
