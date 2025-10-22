"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Zone = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  metadata?: any;
};

type DragState = {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentZone: Zone | null;
};

export default function OverlayEditor() {
  const [imageKey, setImageKey] = useState("mechanism-slots");
  const [imagePath, setImagePath] = useState("/images/mechanism-slots.png");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zones, setZones] = useState<Zone[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentZone: null,
  });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneType, setZoneType] = useState("mechanism-slot");
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const saveOverlay = useMutation(api.overlays.saveOverlay);
  const overlayData = useQuery(api.overlays.getOverlay, { imageKey });
  const allOverlays = useQuery(api.overlays.listOverlays);

  // Load overlay data when it arrives from Convex
  useEffect(() => {
    if (overlayData && overlayData.zones) {
      setZones(overlayData.zones);
      setImagePath(overlayData.imagePath);
      setImageDimensions({
        width: overlayData.imageWidth,
        height: overlayData.imageHeight,
      });
    }
  }, [overlayData]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);

    // Calculate scale to fit on screen
    const maxWidth = 1000;
    if (img.naturalWidth > maxWidth) {
      setScale(maxWidth / img.naturalWidth);
    }
  };

  // Mouse down - start drawing a zone
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDragState({
      isDrawing: true,
      startX: x,
      startY: y,
      currentZone: null,
    });
  };

  // Mouse move - update zone being drawn
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    const width = Math.abs(currentX - dragState.startX);
    const height = Math.abs(currentY - dragState.startY);
    const x = Math.min(dragState.startX, currentX);
    const y = Math.min(dragState.startY, currentY);

    setDragState({
      ...dragState,
      currentZone: {
        id: `temp-${Date.now()}`,
        type: zoneType,
        x,
        y,
        width,
        height,
      },
    });
  };

  // Mouse up - finalize zone
  const handleMouseUp = () => {
    if (dragState.currentZone && dragState.currentZone.width > 10 && dragState.currentZone.height > 10) {
      const newZone: Zone = {
        ...dragState.currentZone,
        id: `zone-${Date.now()}`,
      };
      setZones([...zones, newZone]);
      setSelectedZoneId(newZone.id);
    }

    setDragState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentZone: null,
    });
  };

  // Save to Convex
  const handleSave = async () => {
    if (!imageLoaded) {
      alert("Please load an image first");
      return;
    }

    try {
      await saveOverlay({
        imageKey,
        imagePath,
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
        zones,
      });
      alert("Overlay saved successfully!");
    } catch (error) {
      console.error("Error saving overlay:", error);
      alert("Failed to save overlay");
    }
  };

  // Delete selected zone
  const handleDeleteZone = () => {
    if (selectedZoneId) {
      setZones(zones.filter((z) => z.id !== selectedZoneId));
      setSelectedZoneId(null);
    }
  };

  // Update zone label
  const handleUpdateLabel = (label: string) => {
    if (selectedZoneId) {
      setZones(
        zones.map((z) =>
          z.id === selectedZoneId ? { ...z, label } : z
        )
      );
    }
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const allZones = [...zones, dragState.currentZone].filter((z): z is Zone => z !== null);

  return (
    <div className="mek-card-industrial p-6 space-y-6">
      <div className="flex gap-6">
        {/* Left Panel - Editor */}
        <div className="flex-1">
          <h2 className="mek-text-industrial text-2xl mb-4">Overlay Editor</h2>

          {/* Image Selection */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="mek-label-uppercase block mb-2">Image Key</label>
              <input
                type="text"
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
                placeholder="mechanism-slots"
              />
            </div>
            <div>
              <label className="mek-label-uppercase block mb-2">Image Path</label>
              <input
                type="text"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
                placeholder="/images/mechanism-slots.png"
              />
            </div>
            <div>
              <label className="mek-label-uppercase block mb-2">Zone Type</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
              >
                <option value="mechanism-slot">Mechanism Slot</option>
                <option value="button">Button</option>
                <option value="clickable">Clickable Area</option>
                <option value="display">Display Zone</option>
              </select>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative border-2 border-yellow-500/50 bg-black/80 overflow-hidden">
            {imagePath && (
              <>
                <img
                  ref={imageRef}
                  src={imagePath}
                  alt="Overlay Base"
                  onLoad={handleImageLoad}
                  style={{
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                  }}
                  className="block"
                />
                <div
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                    cursor: "crosshair",
                  }}
                >
                  {allZones.map((zone) => (
                    <div
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZoneId(zone.id);
                      }}
                      style={{
                        position: "absolute",
                        left: zone.x * scale,
                        top: zone.y * scale,
                        width: zone.width * scale,
                        height: zone.height * scale,
                        border: selectedZoneId === zone.id ? "3px solid #fab617" : "2px solid rgba(250, 182, 23, 0.5)",
                        backgroundColor: "rgba(250, 182, 23, 0.2)",
                        pointerEvents: dragState.isDrawing ? "none" : "auto",
                      }}
                      className="hover:bg-yellow-500/30 transition-colors"
                    >
                      <div className="text-xs text-yellow-400 font-bold p-1">
                        {zone.label || zone.type}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-400">
            <p>• Click and drag to create zones</p>
            <p>• Click a zone to select it</p>
            <p>• Use the right panel to edit zone properties</p>
            <p>• Save to persist to database</p>
          </div>
        </div>

        {/* Right Panel - Zone Editor */}
        <div className="w-80 space-y-4">
          <h3 className="mek-text-industrial text-xl">Zones</h3>

          {/* Zone List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedZoneId === zone.id
                    ? "border-yellow-500 bg-yellow-500/20"
                    : "border-yellow-500/30 bg-black/50"
                }`}
              >
                <div className="text-sm font-bold text-yellow-400">
                  {zone.label || `${zone.type} #${zone.id.slice(-4)}`}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(zone.x)}, {Math.round(zone.y)} • {Math.round(zone.width)}×{Math.round(zone.height)}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Zone Editor */}
          {selectedZone && (
            <div className="border border-yellow-500/50 p-4 rounded space-y-3">
              <h4 className="mek-label-uppercase">Edit Zone</h4>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Label</label>
                <input
                  type="text"
                  value={selectedZone.label || ""}
                  onChange={(e) => handleUpdateLabel(e.target.value)}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                  placeholder="Enter label..."
                />
              </div>
              <div className="text-xs text-gray-400">
                <div>Type: {selectedZone.type}</div>
                <div>Position: {Math.round(selectedZone.x)}, {Math.round(selectedZone.y)}</div>
                <div>Size: {Math.round(selectedZone.width)}×{Math.round(selectedZone.height)}</div>
              </div>
              <button
                onClick={handleDeleteZone}
                className="w-full px-3 py-2 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30 transition-colors text-sm"
              >
                Delete Zone
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              className="mek-button-primary w-full"
            >
              Save Overlay
            </button>
            <button
              onClick={() => setZones([])}
              className="w-full px-4 py-2 bg-black/50 border border-yellow-500/50 rounded text-white hover:bg-yellow-500/20 transition-colors"
            >
              Clear All Zones
            </button>
          </div>

          {/* Saved Overlays */}
          {allOverlays && allOverlays.length > 0 && (
            <div className="border-t border-yellow-500/30 pt-4">
              <h4 className="mek-label-uppercase mb-2">Saved Overlays</h4>
              <div className="space-y-1 text-sm">
                {allOverlays.map((overlay) => (
                  <div
                    key={overlay._id}
                    onClick={() => {
                      setImageKey(overlay.imageKey);
                      setImagePath(overlay.imagePath);
                      setZones(overlay.zones);
                      setImageDimensions({
                        width: overlay.imageWidth,
                        height: overlay.imageHeight,
                      });
                    }}
                    className="p-2 bg-black/50 border border-yellow-500/30 rounded cursor-pointer hover:border-yellow-500/50"
                  >
                    <div className="text-yellow-400">{overlay.imageKey}</div>
                    <div className="text-xs text-gray-400">{overlay.zones.length} zones</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
