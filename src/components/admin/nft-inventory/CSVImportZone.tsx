"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { CSVImportResult } from "@/types/campaign";

interface CSVImportZoneProps {
  campaignId?: string;
  onImportComplete?: (result: CSVImportResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function CSVImportZone({
  campaignId,
  onImportComplete,
  onError,
  disabled = false,
}: CSVImportZoneProps) {
  const [csvContent, setCsvContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const initFromCSV = useAction(api.commemorativeNFTInventorySetup.initializeFromCSV);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find((file) => file.name.endsWith(".csv"));

    if (!csvFile) {
      const errorMsg = "Please drop a CSV file";
      setUploadStatus(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploadStatus(`Reading file: ${csvFile.name}`);

    try {
      const text = await csvFile.text();
      setCsvContent(text);
      setUploadStatus(`Loaded ${csvFile.name} (${text.length} characters)`);
    } catch (error) {
      const errorMsg = `Failed to read file: ${error}`;
      setUploadStatus(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      const errorMsg = "Please provide CSV content first";
      setUploadStatus(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (disabled) {
      const errorMsg = "Import is currently disabled";
      setUploadStatus(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setUploadStatus("Parsing CSV and uploading to database...");

    try {
      const result = await initFromCSV({ csvContent });

      const successMsg = `Successfully imported ${result.created} NFTs${
        result.skipped > 0 ? `, skipped ${result.skipped}` : ""
      }`;
      setUploadStatus(successMsg);

      onImportComplete?.({
        success: true,
        created: result.created,
        skipped: result.skipped,
      });

      // Clear the content after successful import
      setCsvContent("");
    } catch (error) {
      const errorMsg = `Import failed: ${error}`;
      setUploadStatus(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCsvContent("");
    setUploadStatus("");
  };

  return (
    <div className="mek-card-industrial">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">CSV Import</h2>
        <p className="text-sm text-gray-400">
          Import NFT inventory from NMKR Studio CSV export
        </p>
        {disabled && (
          <p className="text-sm text-red-400 mt-2">
            Import disabled - select a campaign first
          </p>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
          disabled
            ? "border-gray-700 bg-black/10 cursor-not-allowed"
            : isDragging
            ? "border-yellow-500 bg-yellow-500/10"
            : "border-gray-600 bg-black/30"
        }`}
      >
        {isDragging && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/20 rounded-lg pointer-events-none z-10">
            <p className="text-2xl font-bold text-yellow-500">
              Drop CSV file here
            </p>
          </div>
        )}

        <label className="block text-sm text-gray-400 mb-2">
          Drag & drop CSV file or paste content:
        </label>

        <textarea
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          disabled={disabled}
          className={`w-full h-40 bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
          placeholder={
            disabled
              ? "Select a campaign to enable CSV import..."
              : "Drag CSV file here, or paste CSV content..."
          }
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleImport}
          disabled={isLoading || !csvContent.trim() || disabled}
          className="mek-button-primary flex-1"
        >
          {isLoading ? "Importing..." : "Import from CSV"}
        </button>
        <button
          onClick={handleClear}
          disabled={!csvContent || disabled}
          className="mek-button-secondary px-6"
        >
          Clear
        </button>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 p-3 rounded border ${
            uploadStatus.includes("Success") || uploadStatus.includes("Loaded")
              ? "border-green-500 bg-green-500/10 text-green-400"
              : uploadStatus.includes("failed") || uploadStatus.includes("Failed")
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
          }`}
        >
          <p className="text-sm font-mono">{uploadStatus}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-black/30 rounded border border-gray-700">
        <p className="text-xs text-gray-400 mb-2">
          <strong>How to get CSV:</strong>
        </p>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Go to NMKR Studio → Your Project</li>
          <li>Click NFTs tab</li>
          <li>Click Export Token Info as CSV</li>
          <li>Drag the CSV file here or paste its contents</li>
        </ol>
      </div>
    </div>
  );
}
