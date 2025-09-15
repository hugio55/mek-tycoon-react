"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

export default function AddContractsBuffPage() {
  const addBuff = useMutation(api.addTotalActiveContracts.addTotalActiveContracts);
  const [status, setStatus] = useState<string>("Ready to add");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // Auto-run on page load
    const runAdd = async () => {
      if (!added) {
        setStatus("Adding Total Active Contracts buff...");
        try {
          const result = await addBuff();
          setStatus(result.message);
          setAdded(true);

          // Redirect after 2 seconds
          setTimeout(() => {
            window.location.href = "/admin/buff-categories";
          }, 2000);
        } catch (error) {
          setStatus(`Error: ${error}`);
        }
      }
    };

    runAdd();
  }, [addBuff, added]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-500 mb-4">Adding Total Active Contracts Buff</h1>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <p className="text-lg">{status}</p>
          {added && (
            <p className="text-sm text-gray-400 mt-4">Redirecting to buff categories page...</p>
          )}
        </div>
      </div>
    </div>
  );
}