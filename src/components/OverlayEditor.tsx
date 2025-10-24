"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

type EditorMode = "zone" | "sprite";

type Zone = {
  id: string;
  mode: "zone" | "sprite";
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  overlayImage?: string;
  metadata?: any;
};

type DragState = {
  isDrawing: boolean;
  isDraggingSprite: boolean;
  startX: number;
  startY: number;
  currentZone: Zone | null;
  spriteX: number;
  spriteY: number;
};

type OverlayPaletteItem = {
  id: string;
  name: string;
  path: string;
  color?: string;
};

export default function OverlayEditor() {
  // Project settings
  const [imageKey, setImageKey] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [recentBasePaths, setRecentBasePaths] = useState<string[]>([]);

  // Editor mode
  const [editorMode, setEditorMode] = useState<EditorMode>("sprite");

  // Zones and sprites
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Zone drawing
  const [zoneType, setZoneType] = useState("mechanism-slot");
  const [dragState, setDragState] = useState<DragState>({
    isDrawing: false,
    isDraggingSprite: false,
    startX: 0,
    startY: 0,
    currentZone: null,
    spriteX: 0,
    spriteY: 0,
  });

  // Dragging existing committed sprites
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [draggingOffset, setDraggingOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);

  // Sprite positioning
  const [overlayImagePath, setOverlayImagePath] = useState("");
  const [overlayImageLoaded, setOverlayImageLoaded] = useState(false);
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 });
  const [variationSearch, setVariationSearch] = useState("");
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [spriteScale, setSpriteScale] = useState(1);
  const [usedVariations, setUsedVariations] = useState<Set<string>>(new Set());
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  const [checklistTypeExpanded, setChecklistTypeExpanded] = useState({
    head: false,
    body: false,
    trait: false,
  });
  const [checklistSearch, setChecklistSearch] = useState({
    head: "",
    body: "",
    trait: "",
  });

  // Middle mouse button panning
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Overlay palette
  const [overlayPalette, setOverlayPalette] = useState<OverlayPaletteItem[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [newOverlayName, setNewOverlayName] = useState("");
  const [newOverlayPath, setNewOverlayPath] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  // Autosave history
  const [showAutosaveHistory, setShowAutosaveHistory] = useState(false);

  // Canvas controls
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayImageRef = useRef<HTMLImageElement>(null);

  const saveOverlay = useMutation(api.overlays.saveOverlay);
  const saveAutosave = useMutation(api.overlays.saveAutosave);
  const overlayData = useQuery(api.overlays.getOverlay, { imageKey });
  const allOverlays = useQuery(api.overlays.listOverlays);
  const autosaveHistoryFromDb = useQuery(api.overlays.getAutosaveHistory, { imageKey });

  // Load overlay data when it arrives from Convex
  useEffect(() => {
    if (overlayData && overlayData.zones) {
      setZones(overlayData.zones);
      setImagePath(overlayData.imagePath);
      setImageDimensions({
        width: overlayData.imageWidth,
        height: overlayData.imageHeight,
      });

      // Extract used variations from existing sprites
      const used = new Set<string>();
      overlayData.zones.forEach((zone: any) => {
        if (zone.mode === "sprite" && zone.metadata) {
          // Use variationName + variationType for new format (name-based uniqueness)
          if (zone.metadata.variationName && zone.metadata.variationType) {
            const uniqueId = `${zone.metadata.variationType}-${zone.metadata.variationName}`;
            used.add(uniqueId);
          }
          // Fallback to old variationId format for backwards compatibility
          else if (zone.metadata.variationId) {
            used.add(zone.metadata.variationId);
          }
        }
      });
      console.log('[Overlay Editor] Loaded used variations:', Array.from(used));
      console.log('[Overlay Editor] Total sprites loaded:', overlayData.zones.filter((z: any) => z.mode === "sprite").length);
      setUsedVariations(used);
    }
  }, [overlayData]);

  // Load recent paths from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("overlay-editor-recent-paths");
    if (stored) {
      const paths = JSON.parse(stored);
      setRecentBasePaths(paths);
    }
    const storedPalette = localStorage.getItem("overlay-editor-palette");
    if (storedPalette) {
      setOverlayPalette(JSON.parse(storedPalette));
    }
  }, []);

  // Smart path converter - detect if external file or web path
  const extractWebPath = (input: string): string => {
    if (!input) return input;

    // Remove leading and trailing quotes (from Windows "Copy as path")
    let cleanInput = input.trim();
    if ((cleanInput.startsWith('"') && cleanInput.endsWith('"')) ||
        (cleanInput.startsWith("'") && cleanInput.endsWith("'"))) {
      cleanInput = cleanInput.slice(1, -1);
    }

    // If it already looks like a web path (starts with /), return as-is
    if (cleanInput.startsWith('/')) return cleanInput;

    // Check if this is a full Windows path (contains drive letter like C:\)
    const isWindowsPath = /^[A-Za-z]:\\/.test(cleanInput);

    if (isWindowsPath) {
      // Check if it's in the public directory
      const publicIndex = cleanInput.lastIndexOf('public\\');
      const publicIndexForward = cleanInput.lastIndexOf('public/');

      if (publicIndex !== -1 || publicIndexForward !== -1) {
        // It's in public, convert to web path
        let startIndex = publicIndex !== -1 ? publicIndex + 7 : publicIndexForward + 7;
        let webPath = cleanInput.substring(startIndex);
        webPath = webPath.replace(/\\/g, '/');
        if (!webPath.startsWith('/')) webPath = '/' + webPath;
        return webPath;
      } else {
        // It's external (like TYCOON UNIVERSALS), use API endpoint
        return `/api/serve-image?path=${encodeURIComponent(cleanInput)}`;
      }
    }

    // If no drive letter found, try to extract relative path
    const imagesIndex = cleanInput.lastIndexOf('images\\');
    const imagesIndexForward = cleanInput.lastIndexOf('images/');

    if (imagesIndex !== -1) {
      let webPath = cleanInput.substring(imagesIndex);
      webPath = webPath.replace(/\\/g, '/');
      if (!webPath.startsWith('/')) webPath = '/' + webPath;
      return webPath;
    } else if (imagesIndexForward !== -1) {
      let webPath = cleanInput.substring(imagesIndexForward);
      webPath = webPath.replace(/\\/g, '/');
      if (!webPath.startsWith('/')) webPath = '/' + webPath;
      return webPath;
    }

    // Return as-is if nothing matches
    return cleanInput;
  };

  // Delete a recent base path
  const deleteRecentBasePath = (pathToDelete: string) => {
    const updated = recentBasePaths.filter(p => p !== pathToDelete);
    setRecentBasePaths(updated);
    localStorage.setItem("overlay-editor-recent-paths", JSON.stringify(updated));
  };

  // Save recent path when base image path changes
  const addRecentBasePath = (path: string) => {
    if (!path) return;
    const webPath = extractWebPath(path);
    const updated = [webPath, ...recentBasePaths.filter(p => p !== webPath)].slice(0, 10);
    setRecentBasePaths(updated);
    localStorage.setItem("overlay-editor-recent-paths", JSON.stringify(updated));
  };

  // Add overlay to palette
  const addOverlayToPalette = () => {
    if (!newOverlayPath || !newOverlayName) {
      alert("Please enter both name and path");
      return;
    }
    const webPath = extractWebPath(newOverlayPath);
    const newItem: OverlayPaletteItem = {
      id: `overlay-${Date.now()}`,
      name: newOverlayName,
      path: webPath,
    };
    const updated = [...overlayPalette, newItem];
    setOverlayPalette(updated);
    localStorage.setItem("overlay-editor-palette", JSON.stringify(updated));
    setNewOverlayName("");
    setNewOverlayPath("");
  };

  // Select overlay from palette
  const selectPaletteOverlay = (item: OverlayPaletteItem) => {
    setOverlayImagePath(item.path);
    setActiveOverlayId(item.id);
  };

  // Remove from palette
  const removeFromPalette = (id: string) => {
    const updated = overlayPalette.filter(item => item.id !== id);
    setOverlayPalette(updated);
    localStorage.setItem("overlay-editor-palette", JSON.stringify(updated));
    if (activeOverlayId === id) {
      setActiveOverlayId(null);
    }
  };

  // Load all images from a folder
  const loadImagesFromFolder = async () => {
    if (!folderPath) {
      alert("Please enter a folder path");
      return;
    }

    setIsLoadingFolder(true);
    try {
      // Remove quotes if present
      let cleanPath = folderPath.trim();
      if ((cleanPath.startsWith('"') && cleanPath.endsWith('"')) ||
          (cleanPath.startsWith("'") && cleanPath.endsWith("'"))) {
        cleanPath = cleanPath.slice(1, -1);
      }

      const response = await fetch('/api/list-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: cleanPath }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to load folder: ${error.error}`);
        return;
      }

      const data = await response.json();
      const newItems: OverlayPaletteItem[] = data.images.map((img: any) => ({
        id: `overlay-${Date.now()}-${Math.random()}`,
        name: img.name,
        path: img.path,
      }));

      const updated = [...overlayPalette, ...newItems];
      setOverlayPalette(updated);
      localStorage.setItem("overlay-editor-palette", JSON.stringify(updated));
      alert(`Added ${newItems.length} images to palette`);
      setFolderPath("");
    } catch (error) {
      console.error("Error loading folder:", error);
      alert("Failed to load images from folder");
    } finally {
      setIsLoadingFolder(false);
    }
  };

  // Handle base image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);

    // Auto-scale to fit
    const maxWidth = 1200;
    if (img.naturalWidth > maxWidth) {
      setScale(maxWidth / img.naturalWidth);
    }
  };

  // Handle overlay image load
  const handleOverlayImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setOverlayDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setOverlayImageLoaded(true);
  };

  // Middle mouse button panning handlers
  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handlePanMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // ZONE MODE: Mouse down - start drawing a zone
  const handleZoneMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded || editorMode !== "zone") return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDragState({
      ...dragState,
      isDrawing: true,
      startX: x,
      startY: y,
      currentZone: null,
    });
  };

  // ZONE MODE: Mouse move - update zone being drawn
  const handleZoneMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDrawing || editorMode !== "zone") return;

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
        mode: "zone",
        type: zoneType,
        x,
        y,
        width,
        height,
      },
    });
  };

  // ZONE MODE: Mouse up - finalize zone
  const handleZoneMouseUp = () => {
    if (editorMode !== "zone") return;

    if (dragState.currentZone && dragState.currentZone.width && dragState.currentZone.height &&
        dragState.currentZone.width > 10 && dragState.currentZone.height > 10) {
      const newZone: Zone = {
        ...dragState.currentZone,
        id: `zone-${Date.now()}`,
      };
      setZones([...zones, newZone]);
      setSelectedZoneId(newZone.id);
    }

    setDragState({
      ...dragState,
      isDrawing: false,
      currentZone: null,
    });
  };

  // SPRITE MODE: Mouse down - start dragging sprite
  const handleSpriteMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded || editorMode !== "sprite") return;

    // Ignore middle mouse button (used for panning)
    if (e.button === 1) return;

    isMouseDownRef.current = true;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Check if clicking on an existing sprite
    const clickedSprite = zones.filter(z => z.mode === "sprite").find((sprite) => {
      const spriteScaleValue = sprite.metadata?.spriteScale || 1;
      // Get the actual dimensions from sprite metadata (if available) or use reasonable defaults
      // Default to 100x100 if dimensions aren't stored (for old sprites before this fix)
      const imageWidth = sprite.metadata?.imageWidth || overlayDimensions.width || 100;
      const imageHeight = sprite.metadata?.imageHeight || overlayDimensions.height || 100;
      const spriteWidth = imageWidth * spriteScaleValue;
      const spriteHeight = imageHeight * spriteScaleValue;

      return (
        x >= sprite.x &&
        x <= sprite.x + spriteWidth &&
        y >= sprite.y &&
        y <= sprite.y + spriteHeight
      );
    });

    if (clickedSprite) {
      // Track start position for detecting click vs drag
      setDragStartPos({ x: e.clientX, y: e.clientY });

      // If clicking on already selected sprite, prepare to drag it
      if (selectedZoneId === clickedSprite.id) {
        setIsDraggingExisting(true);
        setDraggingOffset({
          x: x - clickedSprite.x,
          y: y - clickedSprite.y,
        });
        return;
      }
      // Otherwise select the clicked sprite
      setSelectedZoneId(clickedSprite.id);
      return;
    }

    // Only allow creating new sprite if overlay image is loaded
    if (!overlayImageLoaded) return;

    setDragState({
      ...dragState,
      isDraggingSprite: true,
      spriteX: x - overlayDimensions.width / 2,
      spriteY: y - overlayDimensions.height / 2,
    });
  };

  // SPRITE MODE: Mouse move - update sprite position
  const handleSpriteMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== "sprite") return;

    // Don't update position if mouse button is not pressed
    if (!isMouseDownRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Handle dragging existing sprite
    if (isDraggingExisting && selectedZoneId) {
      const updatedZones = zones.map((z) =>
        z.id === selectedZoneId
          ? { ...z, x: x - draggingOffset.x, y: y - draggingOffset.y }
          : z
      );
      setZones(updatedZones);
      return;
    }

    // Handle dragging new sprite
    if (dragState.isDraggingSprite) {
      setDragState({
        ...dragState,
        spriteX: x - overlayDimensions.width / 2,
        spriteY: y - overlayDimensions.height / 2,
      });
    }
  };

  // SPRITE MODE: Mouse up - prepare to commit sprite position
  const handleSpriteMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== "sprite") return;

    isMouseDownRef.current = false;

    // Handle finishing drag of existing sprite
    if (isDraggingExisting) {
      setIsDraggingExisting(false);

      // Check if this was a click (no movement) or a drag
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );

      // If movement was less than 5 pixels, treat as click and deselect
      if (distance < 5) {
        setSelectedZoneId(null);
        return;
      }

      // Otherwise it was a drag, so autosave the new position
      try {
        await saveOverlay({
          imageKey,
          imagePath,
          imageWidth: imageDimensions.width,
          imageHeight: imageDimensions.height,
          zones,
        });
        await saveAutosave({
          imageKey,
          zones,
        });
      } catch (error) {
        console.error("Autosave after repositioning failed:", error);
      }
      return;
    }

    // Handle finishing drag of new sprite
    setDragState({
      ...dragState,
      isDraggingSprite: false,
    });
  };

  // SPRITE MODE: Commit sprite position with variation
  const commitSpritePosition = async () => {
    if (!selectedVariation) {
      alert("Please select a variation first");
      return;
    }

    // Check if variation is already used (type + name for uniqueness)
    const uniqueId = `${selectedVariation.type}-${selectedVariation.name}`;
    if (usedVariations.has(uniqueId)) {
      const confirmDuplicate = window.confirm(
        `"${selectedVariation.name}" has already been placed. Are you sure you want to place it again?`
      );
      if (!confirmDuplicate) return;
    }

    const newSprite: Zone = {
      id: `sprite-${Date.now()}`,
      mode: "sprite",
      type: "variation-bulb",
      x: dragState.spriteX,
      y: dragState.spriteY,
      overlayImage: overlayImagePath,
      label: selectedVariation.name,
      metadata: {
        variationId: uniqueId,
        variationName: selectedVariation.name,
        variationType: selectedVariation.type,
        sourceKey: selectedVariation.sourceKey,
        spriteScale,
        imageWidth: overlayDimensions.width,
        imageHeight: overlayDimensions.height,
      },
    };

    const updatedZones = [...zones, newSprite];
    setZones(updatedZones);
    setSelectedZoneId(newSprite.id);

    // Mark variation as used
    setUsedVariations(new Set([...usedVariations, uniqueId]));

    setSelectedVariation(null);
    setVariationSearch("");

    // Autosave after committing sprite
    try {
      await saveOverlay({
        imageKey,
        imagePath,
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
        zones: updatedZones,
      });
      // Record autosave in database history (keeps last 20 automatically)
      await saveAutosave({
        imageKey,
        zones: updatedZones,
      });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  // Save to Convex
  const handleSave = async () => {
    if (!imageLoaded) {
      alert("Please load a base image first");
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
      // Silent save - no popup confirmation
    } catch (error) {
      console.error("Error saving overlay:", error);
    }
  };

  // Delete selected zone/sprite
  const handleDelete = async () => {
    if (selectedZoneId) {
      const updatedZones = zones.filter((z) => z.id !== selectedZoneId);
      setZones(updatedZones);
      setSelectedZoneId(null);

      // Autosave after deleting
      try {
        await saveOverlay({
          imageKey,
          imagePath,
          imageWidth: imageDimensions.width,
          imageHeight: imageDimensions.height,
          zones: updatedZones,
        });
        // Record autosave in database history (keeps last 20 automatically)
        await saveAutosave({
          imageKey,
          zones: updatedZones,
        });
      } catch (error) {
        console.error("Autosave after delete failed:", error);
      }
    }
  };

  // Update zone/sprite label
  const handleUpdateLabel = (label: string) => {
    if (selectedZoneId) {
      setZones(
        zones.map((z) =>
          z.id === selectedZoneId ? { ...z, label } : z
        )
      );
    }
  };

  // Restore from autosave history
  const restoreFromHistory = async (historyItem: any) => {
    if (!window.confirm(`Restore to state from ${new Date(historyItem.timestamp).toLocaleString()}? This will replace your current work.`)) {
      return;
    }

    setZones(historyItem.zones);
    setShowAutosaveHistory(false);

    // Save restored state to database
    try {
      await saveOverlay({
        imageKey,
        imagePath,
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
        zones: historyItem.zones,
      });
    } catch (error) {
      console.error("Failed to save restored state:", error);
      alert("Restored locally but failed to save to database");
    }
  };

  // Filter variations by search
  const filteredVariations = COMPLETE_VARIATION_RARITY.filter((v) =>
    v.name.toLowerCase().includes(variationSearch.toLowerCase())
  );

  // Group variations by type for checklist (sorted from least rare to most rare)
  const variationsByType = {
    head: COMPLETE_VARIATION_RARITY.filter(v => v.type === "head").sort((a, b) => b.rank - a.rank),
    body: COMPLETE_VARIATION_RARITY.filter(v => v.type === "body").sort((a, b) => b.rank - a.rank),
    trait: COMPLETE_VARIATION_RARITY.filter(v => v.type === "trait").sort((a, b) => b.rank - a.rank),
  };

  const usedCountByType = {
    head: variationsByType.head.filter(v => usedVariations.has(`${v.type}-${v.name}`)).length,
    body: variationsByType.body.filter(v => usedVariations.has(`${v.type}-${v.name}`)).length,
    trait: variationsByType.trait.filter(v => usedVariations.has(`${v.type}-${v.name}`)).length,
  };

  // Debug logging
  useEffect(() => {
    if (usedVariations.size > 0) {
      console.log('[Debug] Used variations set:', Array.from(usedVariations));
      console.log('[Debug] Count by type:', usedCountByType);
    }
  }, [usedVariations, usedCountByType]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const allZones = editorMode === "zone" && dragState.currentZone
    ? [...zones, dragState.currentZone]
    : zones;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-4 items-center">
        <div className="flex border-2 border-yellow-500/50 rounded overflow-hidden">
          <button
            onClick={() => setEditorMode("sprite")}
            className={`px-6 py-2 font-bold transition-colors ${
              editorMode === "sprite"
                ? "bg-yellow-500 text-black"
                : "bg-black/50 text-yellow-400 hover:bg-yellow-500/20"
            }`}
          >
            Position Sprites
          </button>
          <button
            onClick={() => setEditorMode("zone")}
            className={`px-6 py-2 font-bold transition-colors ${
              editorMode === "zone"
                ? "bg-yellow-500 text-black"
                : "bg-black/50 text-yellow-400 hover:bg-yellow-500/20"
            }`}
          >
            Draw Zones
          </button>
        </div>
        <div className="text-gray-400 text-sm">
          {editorMode === "zone" ? "Draw rectangles for hit zones" : "Drag overlay images to position"}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Panel - Canvas */}
        <div className="flex-1 max-w-[calc(100%-24rem-1.5rem)]">
          <h2 className="mek-text-industrial text-2xl mb-4">Canvas</h2>

          {/* Project Settings */}
          <div className="mb-4 space-y-3 bg-black/50 border border-yellow-500/30 rounded p-4">
            <div>
              <label className="mek-label-uppercase block mb-2">Project Name</label>
              <input
                type="text"
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
                placeholder="variation-triangle"
              />
            </div>
            <div>
              <label className="mek-label-uppercase block mb-2">
                Base Image Path
                <span className="text-xs text-gray-400 ml-2 normal-case">(Right-click file → Copy as path → Paste here)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  onPaste={(e) => {
                    // Immediately convert pasted paths
                    setTimeout(() => {
                      const converted = extractWebPath(e.currentTarget.value);
                      if (converted !== e.currentTarget.value) {
                        setImagePath(converted);
                      }
                    }, 0);
                  }}
                  onBlur={(e) => {
                    const converted = extractWebPath(e.target.value);
                    if (converted !== e.target.value) {
                      setImagePath(converted);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
                  placeholder="Paste full Windows path here (auto-converts)"
                />
                <button
                  onClick={() => addRecentBasePath(imagePath)}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 whitespace-nowrap"
                >
                  Load
                </button>
              </div>
              {recentBasePaths.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Recent:</div>
                  <div className="flex flex-wrap gap-1">
                    {recentBasePaths.map((path, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-black/50 border border-yellow-500/30 rounded hover:border-yellow-500/50"
                      >
                        <button
                          onClick={() => setImagePath(path)}
                          className="px-2 py-1 text-xs text-yellow-400"
                          title={path}
                        >
                          {path.split('/').pop() || path}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecentBasePath(path);
                          }}
                          className="px-1 text-xs text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="mb-4 bg-black/50 border border-yellow-500/30 rounded p-3 space-y-3">
            {/* Zoom Controls */}
            <div className="flex gap-2 items-center">
              <span className="mek-label-uppercase">Zoom:</span>
              <button
                onClick={() => setScale(Math.max(0.25, scale - 0.25))}
                className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
              >
                -
              </button>
              <span className="text-yellow-400 font-bold min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(Math.min(3, scale + 0.25))}
                className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
              >
                +
              </button>
              <button
                onClick={() => {
                  setScale(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="ml-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
              >
                Reset
              </button>
            </div>

            {/* Pan Controls */}
            <div className="flex gap-2 items-center">
              <span className="mek-label-uppercase">Pan:</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setPanOffset(prev => ({ ...prev, y: prev.y + 50 }))}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                  title="Pan Up"
                >
                  ▲
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPanOffset(prev => ({ ...prev, x: prev.x + 50 }))}
                    className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                    title="Pan Left"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setPanOffset({ x: 0, y: 0 })}
                    className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 text-xs"
                    title="Reset Pan"
                  >
                    ⊙
                  </button>
                  <button
                    onClick={() => setPanOffset(prev => ({ ...prev, x: prev.x - 50 }))}
                    className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                    title="Pan Right"
                  >
                    ▶
                  </button>
                </div>
                <button
                  onClick={() => setPanOffset(prev => ({ ...prev, y: prev.y - 50 }))}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                  title="Pan Down"
                >
                  ▼
                </button>
              </div>
              <span className="text-xs text-gray-400 ml-2">
                {panOffset.x !== 0 || panOffset.y !== 0 ? `(${panOffset.x}, ${panOffset.y})` : 'Centered'}
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div
            className="relative border-2 border-yellow-500/50 bg-black/80 overflow-auto w-full h-[800px]"
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            {imagePath && (
              <div
                style={{
                  position: "relative",
                  width: imageDimensions.width * scale,
                  height: imageDimensions.height * scale,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                }}
              >
                <img
                  ref={imageRef}
                  src={imagePath}
                  alt="Base Image"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    console.error("Failed to load base image:", imagePath);
                    setImageLoaded(false);
                  }}
                  style={{
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                    objectFit: "contain",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  className="block"
                />
                <div
                  ref={canvasRef}
                  onMouseDown={editorMode === "zone" ? handleZoneMouseDown : handleSpriteMouseDown}
                  onMouseMove={editorMode === "zone" ? handleZoneMouseMove : handleSpriteMouseMove}
                  onMouseUp={editorMode === "zone" ? handleZoneMouseUp : handleSpriteMouseUp}
                  onMouseLeave={editorMode === "zone" ? handleZoneMouseUp : handleSpriteMouseUp}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                    cursor: editorMode === "zone" ? "crosshair" : "move",
                  }}
                >
                  {/* Render zones */}
                  {allZones.filter(z => z.mode === "zone").map((zone) => {
                    const buttonStyle = zone.metadata?.buttonStyle || "none";
                    const isCustomImage = buttonStyle === "custom-image";

                    // Get button styling
                    const getPreviewStyle = () => {
                      const baseStyle = {
                        position: "absolute" as const,
                        left: zone.x * scale,
                        top: zone.y * scale,
                        width: (zone.width || 0) * scale,
                        height: (zone.height || 0) * scale,
                        pointerEvents: dragState.isDrawing ? "none" : ("auto" as const),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      };

                      const selectionBorder = selectedZoneId === zone.id ? "3px solid #fab617" : "2px solid rgba(250, 182, 23, 0.5)";

                      switch (buttonStyle) {
                        case "industrial-yellow":
                          return {
                            ...baseStyle,
                            background: "linear-gradient(135deg, #fab617 0%, #d19912 100%)",
                            border: selectionBorder,
                            boxShadow: "0 0 20px rgba(250, 182, 23, 0.5)",
                            color: "#000",
                            fontWeight: "bold",
                            textTransform: "uppercase" as const,
                          };
                        case "glowing-blue":
                          return {
                            ...baseStyle,
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            border: selectionBorder,
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
                            color: "#fff",
                            fontWeight: "bold",
                          };
                        case "transparent-outline":
                          return {
                            ...baseStyle,
                            background: "rgba(0, 0, 0, 0.3)",
                            border: selectionBorder,
                            backdropFilter: "blur(5px)",
                            color: "#fab617",
                            fontWeight: "bold",
                          };
                        case "metal-plate":
                          return {
                            ...baseStyle,
                            background: "linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)",
                            border: selectionBorder,
                            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5)",
                            color: "#fab617",
                            fontWeight: "bold",
                          };
                        default:
                          return {
                            ...baseStyle,
                            border: selectionBorder,
                            backgroundColor: "rgba(250, 182, 23, 0.2)",
                          };
                      }
                    };

                    return (
                      <div
                        key={zone.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedZoneId(zone.id);
                        }}
                        style={getPreviewStyle()}
                        className="hover:brightness-110 transition-all"
                      >
                        {/* Custom image button */}
                        {isCustomImage && zone.metadata?.buttonImageUrl && (
                          <img
                            src={zone.metadata.buttonImageUrl}
                            alt={zone.label || "Button"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              transform: `scale(${zone.metadata?.buttonImageScale || 1})`,
                            }}
                          />
                        )}

                        {/* Text button */}
                        {!isCustomImage && buttonStyle !== "none" && zone.metadata?.buttonText && (
                          <span style={{ fontSize: `${Math.max(10, (zone.width || 100) * scale * 0.08)}px` }}>
                            {zone.metadata.buttonText}
                          </span>
                        )}

                        {/* Default zone label */}
                        {buttonStyle === "none" && (
                          <div className="text-xs text-yellow-400 font-bold p-1">
                            {zone.label || zone.type}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render sprites */}
                  {allZones.filter(z => z.mode === "sprite").map((sprite) => {
                    const spriteScaleValue = sprite.metadata?.spriteScale || 1;
                    return (
                      <div
                        key={sprite.id}
                        style={{
                          position: "absolute",
                          left: sprite.x * scale,
                          top: sprite.y * scale,
                          border: (dragState.isDraggingSprite || isDraggingExisting) ? "none" : (selectedZoneId === sprite.id ? "2px solid #fab617" : "1px solid rgba(250, 182, 23, 0.3)"),
                          pointerEvents: dragState.isDraggingSprite ? "none" : "auto",
                          cursor: selectedZoneId === sprite.id ? "move" : "pointer",
                          // CRITICAL: DO NOT MODIFY THIS TRANSFORM!
                          // spriteScaleValue = user's chosen sprite size (0.25-3.0)
                          // scale = canvas zoom level (0.25-3.0)
                          // Both must be multiplied to maintain correct sprite size at all zoom levels
                          transform: `scale(${spriteScaleValue * scale})`,
                          transformOrigin: "top left",
                        }}
                      >
                        {sprite.overlayImage && (
                          <img src={sprite.overlayImage} alt={sprite.label} style={{ display: "block" }} />
                        )}
                        {sprite.label && !dragState.isDraggingSprite && !isDraggingExisting && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/90 px-1 py-0.5 text-[8px] text-yellow-400 text-center font-bold leading-tight border-t border-yellow-500/50">
                            {sprite.label}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Dragging sprite preview */}
                  {editorMode === "sprite" && overlayImageLoaded && (dragState.spriteX !== 0 || dragState.spriteY !== 0) && (
                    <div
                      style={{
                        position: "absolute",
                        left: dragState.spriteX * scale,
                        top: dragState.spriteY * scale,
                        opacity: dragState.isDraggingSprite ? 0.3 : 0.9,
                        pointerEvents: "none",
                        border: dragState.isDraggingSprite ? "2px dashed rgba(250, 182, 23, 0.5)" : "2px solid rgba(250, 182, 23, 0.8)",
                        // CRITICAL: DO NOT MODIFY THIS TRANSFORM!
                        // spriteScale = user's chosen sprite size (0.25-3.0)
                        // scale = canvas zoom level (0.25-3.0)
                        // Both must be multiplied to maintain correct sprite size at all zoom levels
                        transform: `scale(${spriteScale * scale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <img src={overlayImagePath} alt="Overlay" style={{ display: "block" }} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {!imagePath && (
              <div className="p-12 text-center text-gray-500">
                Enter base image path above to start
              </div>
            )}
          </div>

          {/* Hidden overlay image loader */}
          {overlayImagePath && (
            <img
              ref={overlayImageRef}
              src={overlayImagePath}
              alt="Overlay"
              onLoad={handleOverlayImageLoad}
              onError={() => {
                console.error("Failed to load overlay image:", overlayImagePath);
                setOverlayImageLoaded(false);
              }}
              style={{ display: "none" }}
            />
          )}
        </div>

        {/* Right Panel - Tools */}
        <div className="w-96 space-y-4">
          <h3 className="mek-text-industrial text-xl">Tools</h3>

          {/* Saved Projects */}
          {allOverlays && allOverlays.length > 0 && (
            <div className="bg-black/50 border border-yellow-500/30 rounded p-4">
              <h4 className="mek-label-uppercase mb-3 text-yellow-400">Saved Projects</h4>
              <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
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
                    className="p-2 bg-black/50 border border-yellow-500/30 rounded cursor-pointer hover:border-yellow-500/50 transition-colors"
                  >
                    <div className="text-yellow-400 font-bold">{overlay.imageKey}</div>
                    <div className="text-xs text-gray-400">{overlay.zones.length} items</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zone Mode Tools */}
          {editorMode === "zone" && (
            <div className="bg-black/50 border border-yellow-500/30 rounded p-4 space-y-3">
              <h4 className="mek-label-uppercase text-yellow-400">Zone Settings</h4>
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
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="text-sm text-gray-400">
                Click and drag on the canvas to create a rectangular zone.
              </div>
            </div>
          )}

          {/* Sprite Mode Tools */}
          {editorMode === "sprite" && (
            <div className="bg-black/50 border border-yellow-500/30 rounded p-4 space-y-3">
              <h4 className="mek-label-uppercase text-yellow-400">Overlay Palette</h4>

              {/* Load from Folder */}
              <div className="border border-yellow-500/20 rounded p-3 space-y-2">
                <div className="text-xs text-gray-400 font-bold">Load from Folder</div>
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-sm"
                  placeholder="Folder path (e.g., C:\...\public\triangle\bulbs)"
                  disabled={isLoadingFolder}
                />
                <button
                  onClick={loadImagesFromFolder}
                  disabled={isLoadingFolder}
                  className="w-full px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingFolder ? "Loading..." : "Load All Images"}
                </button>
              </div>

              {/* Add New Overlay */}
              <div className="border border-yellow-500/20 rounded p-3 space-y-2">
                <div className="text-xs text-gray-400 font-bold">Add Single Overlay</div>
                <input
                  type="text"
                  value={newOverlayName}
                  onChange={(e) => setNewOverlayName(e.target.value)}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-sm"
                  placeholder="Name (e.g., Green Bulb)"
                />
                <input
                  type="text"
                  value={newOverlayPath}
                  onChange={(e) => setNewOverlayPath(e.target.value)}
                  onBlur={(e) => {
                    const converted = extractWebPath(e.target.value);
                    if (converted !== e.target.value) {
                      setNewOverlayPath(converted);
                    }
                  }}
                  className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-sm"
                  placeholder="Path (e.g., /triangle/bulbs/green.png)"
                />
                <button
                  onClick={addOverlayToPalette}
                  className="w-full px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 text-sm"
                >
                  Add to Palette
                </button>
              </div>

              {/* Palette Grid */}
              {overlayPalette.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-bold">Quick Select</div>
                  <div className="grid grid-cols-6 gap-1">
                    {overlayPalette.map((item) => (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => selectPaletteOverlay(item)}
                          className={`w-full aspect-square border rounded overflow-hidden transition-all ${
                            activeOverlayId === item.id
                              ? "border-yellow-500 bg-yellow-500/20"
                              : "border-yellow-500/30 bg-black/50 hover:border-yellow-500/50"
                          }`}
                          title={item.name}
                        >
                          <img
                            src={item.path}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<div class="text-[8px] text-gray-500 p-1">${item.name}</div>`;
                            }}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPalette(item.id);
                          }}
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full text-white text-[8px] leading-none hover:bg-red-700"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sprite Scale Controls */}
          {editorMode === "sprite" && overlayImageLoaded && (
            <div className="bg-black/50 border border-yellow-500/30 rounded p-4 space-y-3">
              <h4 className="mek-label-uppercase text-yellow-400">Sprite Size</h4>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setSpriteScale(Math.max(0.25, spriteScale - 0.1))}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                >
                  −
                </button>
                <span className="text-yellow-400 font-bold min-w-[60px] text-center">
                  {Math.round(spriteScale * 100)}%
                </span>
                <button
                  onClick={() => setSpriteScale(Math.min(3, spriteScale + 0.1))}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30"
                >
                  +
                </button>
                <button
                  onClick={() => setSpriteScale(1)}
                  className="ml-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Variation Search (only when overlay is selected) */}
          {editorMode === "sprite" && overlayImageLoaded && (
            <div className="bg-black/50 border border-yellow-500/30 rounded p-4 space-y-3">
              <h4 className="mek-label-uppercase text-yellow-400">Assign Variation</h4>

              {overlayImageLoaded && (
                <>
                  <div>
                    <label className="mek-label-uppercase block mb-2">Search Variation</label>
                    <input
                      type="text"
                      value={variationSearch}
                      onChange={(e) => setVariationSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-white"
                      placeholder="Type to search..."
                    />
                  </div>

                  {variationSearch && (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredVariations.slice(0, 10).map((variation) => {
                        const uniqueId = `${variation.type}-${variation.name}`;
                        const isUsed = usedVariations.has(uniqueId);
                        return (
                          <div
                            key={uniqueId}
                            onClick={() => setSelectedVariation(variation)}
                            className={`p-2 border rounded cursor-pointer transition-colors text-sm ${
                              isUsed
                                ? "border-gray-600 bg-gray-900/50"
                                : selectedVariation?.name === variation.name && selectedVariation?.type === variation.type
                                ? "border-yellow-500 bg-yellow-500/20"
                                : "border-yellow-500/30 bg-black/50 hover:border-yellow-500/50"
                            }`}
                          >
                            <div className={`font-bold flex justify-between items-center ${
                              isUsed ? "line-through text-gray-600" : "text-yellow-400"
                            }`}>
                              <span>{variation.name}</span>
                              {isUsed && <span className="text-xs text-red-400 ml-2">Already placed</span>}
                            </div>
                            <div className={`text-xs ${isUsed ? "text-gray-600" : "text-gray-400"}`}>
                              {variation.type} • {variation.sourceKey} • Rank {variation.rank}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedVariation && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
                      <div className="text-sm font-bold text-yellow-400 mb-1">Selected:</div>
                      <div className="text-white">{selectedVariation.name}</div>
                      <div className="text-xs text-gray-400">
                        {selectedVariation.type} • {selectedVariation.sourceKey}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={commitSpritePosition}
                      disabled={!selectedVariation}
                      className="flex-1 mek-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Commit Position
                    </button>
                    {(dragState.spriteX !== 0 || dragState.spriteY !== 0) && (
                      <button
                        onClick={() => {
                          setDragState({
                            ...dragState,
                            spriteX: 0,
                            spriteY: 0,
                            isDraggingSprite: false,
                          });
                          setSelectedVariation(null);
                          setVariationSearch("");
                        }}
                        className="px-3 py-2 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30 transition-colors text-sm"
                        title="Clear sprite position"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="text-sm text-gray-400">
                1. Add overlay images to palette<br />
                2. Click a bulb to select it<br />
                3. Drag it to position on canvas<br />
                4. Search and select variation<br />
                5. Click Commit Position<br />
                <br />
                <span className="text-red-400">To delete:</span><br />
                • Uncommitted sprite: Click "Clear" button<br />
                • Committed sprite: Click it in Items list below, then click Delete
              </div>
            </div>
          )}

          {/* Master Variation Checklist */}
          {editorMode === "sprite" && (
            <div className="bg-black/50 border border-yellow-500/30 rounded overflow-hidden">
              <button
                onClick={() => setChecklistExpanded(!checklistExpanded)}
                className="w-full p-4 flex justify-between items-center hover:bg-yellow-500/10 transition-colors"
              >
                <div className="flex gap-3 items-center">
                  <h4 className="mek-label-uppercase text-yellow-400">Variation Checklist</h4>
                  <div className="text-xs text-gray-400">
                    {usedVariations.size}/288 placed
                  </div>
                </div>
                <span className="text-yellow-400">{checklistExpanded ? "▼" : "▶"}</span>
              </button>

              {checklistExpanded && (
                <div className="p-4 pt-0 space-y-2">
                  {/* Heads Section */}
                  <div className="border border-yellow-500/20 rounded overflow-hidden">
                    <button
                      onClick={() =>
                        setChecklistTypeExpanded({
                          ...checklistTypeExpanded,
                          head: !checklistTypeExpanded.head,
                        })
                      }
                      className="w-full p-2 bg-black/30 flex justify-between items-center hover:bg-yellow-500/10"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-yellow-400">Heads</span>
                        <span className="text-xs text-gray-400">
                          {usedCountByType.head}/{variationsByType.head.length}
                        </span>
                      </div>
                      <span className="text-yellow-400 text-xs">
                        {checklistTypeExpanded.head ? "▼" : "▶"}
                      </span>
                    </button>
                    {checklistTypeExpanded.head && (
                      <div className="p-2 space-y-2">
                        <input
                          type="text"
                          value={checklistSearch.head}
                          onChange={(e) => setChecklistSearch({ ...checklistSearch, head: e.target.value })}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-xs"
                          placeholder="Search heads..."
                        />
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {variationsByType.head
                            .filter(v => v.name.toLowerCase().includes(checklistSearch.head.toLowerCase()))
                            .map((variation) => {
                              const uniqueId = `${variation.type}-${variation.name}`;
                              const isUsed = usedVariations.has(uniqueId);
                              return (
                                <div
                                  key={uniqueId}
                                  onClick={() => !isUsed && setSelectedVariation(variation)}
                                  className={`text-xs p-2 rounded cursor-pointer transition-all ${
                                    isUsed
                                      ? "line-through text-gray-600 bg-gray-900/50"
                                      : selectedVariation?.name === variation.name && selectedVariation?.type === variation.type
                                      ? "border border-yellow-500 bg-yellow-500/20 text-yellow-400"
                                      : "hover:bg-yellow-500/10 text-gray-300"
                                  }`}
                                >
                                  <div className="flex justify-between">
                                    <span>{variation.name}</span>
                                    <span className="text-gray-500">#{variation.rank}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bodies Section */}
                  <div className="border border-yellow-500/20 rounded overflow-hidden">
                    <button
                      onClick={() =>
                        setChecklistTypeExpanded({
                          ...checklistTypeExpanded,
                          body: !checklistTypeExpanded.body,
                        })
                      }
                      className="w-full p-2 bg-black/30 flex justify-between items-center hover:bg-yellow-500/10"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-yellow-400">Bodies</span>
                        <span className="text-xs text-gray-400">
                          {usedCountByType.body}/{variationsByType.body.length}
                        </span>
                      </div>
                      <span className="text-yellow-400 text-xs">
                        {checklistTypeExpanded.body ? "▼" : "▶"}
                      </span>
                    </button>
                    {checklistTypeExpanded.body && (
                      <div className="p-2 space-y-2">
                        <input
                          type="text"
                          value={checklistSearch.body}
                          onChange={(e) => setChecklistSearch({ ...checklistSearch, body: e.target.value })}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-xs"
                          placeholder="Search bodies..."
                        />
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {variationsByType.body
                            .filter(v => v.name.toLowerCase().includes(checklistSearch.body.toLowerCase()))
                            .map((variation) => {
                              const uniqueId = `${variation.type}-${variation.name}`;
                              const isUsed = usedVariations.has(uniqueId);
                              return (
                                <div
                                  key={uniqueId}
                                  onClick={() => !isUsed && setSelectedVariation(variation)}
                                  className={`text-xs p-2 rounded cursor-pointer transition-all ${
                                    isUsed
                                      ? "line-through text-gray-600 bg-gray-900/50"
                                      : selectedVariation?.name === variation.name && selectedVariation?.type === variation.type
                                      ? "border border-yellow-500 bg-yellow-500/20 text-yellow-400"
                                      : "hover:bg-yellow-500/10 text-gray-300"
                                  }`}
                                >
                                  <div className="flex justify-between">
                                    <span>{variation.name}</span>
                                    <span className="text-gray-500">#{variation.rank}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Traits Section */}
                  <div className="border border-yellow-500/20 rounded overflow-hidden">
                    <button
                      onClick={() =>
                        setChecklistTypeExpanded({
                          ...checklistTypeExpanded,
                          trait: !checklistTypeExpanded.trait,
                        })
                      }
                      className="w-full p-2 bg-black/30 flex justify-between items-center hover:bg-yellow-500/10"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-bold text-yellow-400">Traits</span>
                        <span className="text-xs text-gray-400">
                          {usedCountByType.trait}/{variationsByType.trait.length}
                        </span>
                      </div>
                      <span className="text-yellow-400 text-xs">
                        {checklistTypeExpanded.trait ? "▼" : "▶"}
                      </span>
                    </button>
                    {checklistTypeExpanded.trait && (
                      <div className="p-2 space-y-2">
                        <input
                          type="text"
                          value={checklistSearch.trait}
                          onChange={(e) => setChecklistSearch({ ...checklistSearch, trait: e.target.value })}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-white text-xs"
                          placeholder="Search traits..."
                        />
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {variationsByType.trait
                            .filter(v => v.name.toLowerCase().includes(checklistSearch.trait.toLowerCase()))
                            .map((variation) => {
                              const uniqueId = `${variation.type}-${variation.name}`;
                              const isUsed = usedVariations.has(uniqueId);
                              return (
                                <div
                                  key={uniqueId}
                                  onClick={() => !isUsed && setSelectedVariation(variation)}
                                  className={`text-xs p-2 rounded cursor-pointer transition-all ${
                                    isUsed
                                      ? "line-through text-gray-600 bg-gray-900/50"
                                      : selectedVariation?.name === variation.name && selectedVariation?.type === variation.type
                                      ? "border border-yellow-500 bg-yellow-500/20 text-yellow-400"
                                      : "hover:bg-yellow-500/10 text-gray-300"
                                  }`}
                                >
                                  <div className="flex justify-between">
                                    <span>{variation.name}</span>
                                    <span className="text-gray-500">#{variation.rank}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="bg-black/50 border border-yellow-500/30 rounded p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="mek-label-uppercase text-yellow-400">
                Items ({zones.length})
              </h4>
              <span className="text-xs text-gray-500">Click to select</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {zones.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedZoneId(item.id)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedZoneId === item.id
                      ? "border-yellow-500 bg-yellow-500/20"
                      : "border-yellow-500/30 bg-black/50"
                  }`}
                >
                  <div className="text-sm font-bold text-yellow-400">
                    {item.mode === "zone" ? "🔲" : "📌"} {item.label || `${item.type} #${item.id.slice(-4)}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(item.x)}, {Math.round(item.y)}
                    {item.mode === "zone" && item.width && item.height && ` • ${Math.round(item.width)}×${Math.round(item.height)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Item Editor */}
          {selectedZone && (
            <div className="bg-black/50 border border-yellow-500/50 rounded p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="mek-label-uppercase">Edit Selected</h4>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30 transition-colors text-xs font-bold"
                >
                  DELETE
                </button>
              </div>
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

              {/* Button Configuration Panel - Only for zones */}
              {selectedZone.mode === "zone" && (
                <div className="border-t border-yellow-500/30 pt-3 mt-3 space-y-3">
                  <div className="text-sm font-bold text-yellow-400">Button Configuration</div>

                  {/* Button Style Selector */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Button Style</label>
                    <select
                      value={selectedZone.metadata?.buttonStyle || "none"}
                      onChange={(e) => {
                        const newStyle = e.target.value;
                        setZones(zones.map(z => z.id === selectedZoneId ? {
                          ...z,
                          metadata: {
                            ...z.metadata,
                            buttonStyle: newStyle,
                            // Clear image fields if switching away from custom-image
                            ...(newStyle !== "custom-image" && { buttonImageUrl: undefined, buttonImageScale: undefined })
                          }
                        } : z));
                      }}
                      className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                    >
                      <option value="none">No Button</option>
                      <option value="industrial-yellow">Industrial Yellow</option>
                      <option value="glowing-blue">Glowing Blue</option>
                      <option value="transparent-outline">Transparent Outline</option>
                      <option value="metal-plate">Metal Plate</option>
                      <option value="custom-image">Custom Image Upload</option>
                    </select>
                  </div>

                  {/* Show text/font/hover options for predefined styles */}
                  {selectedZone.metadata?.buttonStyle && selectedZone.metadata?.buttonStyle !== "none" && selectedZone.metadata?.buttonStyle !== "custom-image" && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Button Text</label>
                        <input
                          type="text"
                          value={selectedZone.metadata?.buttonText || ""}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: { ...z.metadata, buttonText: e.target.value }
                            } : z));
                          }}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                          placeholder="Enter button text..."
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Font</label>
                        <select
                          value={selectedZone.metadata?.buttonFont || "orbitron"}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: { ...z.metadata, buttonFont: e.target.value }
                            } : z));
                          }}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                        >
                          <option value="orbitron">Orbitron</option>
                          <option value="geist-sans">Geist Sans</option>
                          <option value="geist-mono">Geist Mono</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Hover Effect</label>
                        <select
                          value={selectedZone.metadata?.buttonHoverEffect || "glow"}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: { ...z.metadata, buttonHoverEffect: e.target.value }
                            } : z));
                          }}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                        >
                          <option value="glow">Glow Brighter</option>
                          <option value="brighten">Brighten</option>
                          <option value="pulse">Pulse</option>
                          <option value="lift">Lift Up</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Show upload and scale options for custom-image */}
                  {selectedZone.metadata?.buttonStyle === "custom-image" && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Hover Effect</label>
                        <select
                          value={selectedZone.metadata?.buttonHoverEffect || "glow"}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: { ...z.metadata, buttonHoverEffect: e.target.value }
                            } : z));
                          }}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                        >
                          <option value="glow">Glow</option>
                          <option value="brighten">Brighten</option>
                          <option value="pulse">Pulse</option>
                          <option value="lift">Lift Up</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Upload Button Image</label>
                        <div
                          className="border-2 border-dashed border-yellow-500/30 rounded p-4 bg-black/50 hover:border-yellow-500/50 transition-colors"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-yellow-500');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-yellow-500');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-yellow-500');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                setZones(zones.map(z => z.id === selectedZoneId ? {
                                  ...z,
                                  metadata: { ...z.metadata, buttonImageUrl: dataUrl }
                                } : z));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <div className="text-center space-y-2">
                            {selectedZone.metadata?.buttonImageUrl ? (
                              <div className="space-y-2">
                                <img
                                  src={selectedZone.metadata.buttonImageUrl}
                                  alt="Button preview"
                                  className="max-h-20 mx-auto"
                                />
                                <button
                                  onClick={() => {
                                    setZones(zones.map(z => z.id === selectedZoneId ? {
                                      ...z,
                                      metadata: { ...z.metadata, buttonImageUrl: undefined }
                                    } : z));
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-xs text-gray-400">
                                  Drag & drop image here
                                </div>
                                <div className="text-xs text-gray-500">or</div>
                                <label className="inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 hover:bg-yellow-500/30 transition-colors cursor-pointer text-sm font-bold">
                                  LOAD
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const dataUrl = event.target?.result as string;
                                          setZones(zones.map(z => z.id === selectedZoneId ? {
                                            ...z,
                                            metadata: { ...z.metadata, buttonImageUrl: dataUrl }
                                          } : z));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Button Image Scale: {Math.round((selectedZone.metadata?.buttonImageScale || 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.05"
                          value={selectedZone.metadata?.buttonImageScale || 1}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: { ...z.metadata, buttonImageScale: parseFloat(e.target.value) }
                            } : z));
                          }}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Button Action Configuration */}
                  {selectedZone.metadata?.buttonStyle && selectedZone.metadata?.buttonStyle !== "none" && (
                    <div className="border-t border-yellow-500/30 pt-3 mt-3 space-y-3">
                      <div className="text-sm font-bold text-yellow-400">Button Action</div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">When Clicked</label>
                        <select
                          value={selectedZone.metadata?.buttonAction || "none"}
                          onChange={(e) => {
                            setZones(zones.map(z => z.id === selectedZoneId ? {
                              ...z,
                              metadata: {
                                ...z.metadata,
                                buttonAction: e.target.value,
                                // Clear action data when switching types
                                ...(e.target.value === "none" && { buttonActionData: undefined })
                              }
                            } : z));
                          }}
                          className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                        >
                          <option value="none">No Action</option>
                          <option value="lightbox">Open Lightbox</option>
                          <option value="url">Navigate to URL</option>
                        </select>
                      </div>

                      {/* Lightbox selector */}
                      {selectedZone.metadata?.buttonAction === "lightbox" && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Select Lightbox</label>
                          <select
                            value={selectedZone.metadata?.buttonActionData || ""}
                            onChange={(e) => {
                              setZones(zones.map(z => z.id === selectedZoneId ? {
                                ...z,
                                metadata: { ...z.metadata, buttonActionData: e.target.value }
                              } : z));
                            }}
                            className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                          >
                            <option value="">Choose lightbox...</option>
                            <option value="mek-levels">Mek Levels Viewer</option>
                            <option value="activity-log">Activity Log</option>
                            <option value="essence-balances">Essence Balances</option>
                            <option value="essence-buffs">Essence Buff Management</option>
                            <option value="essence-distribution">Essence Distribution</option>
                          </select>
                        </div>
                      )}

                      {/* URL input */}
                      {selectedZone.metadata?.buttonAction === "url" && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Destination URL</label>
                          <input
                            type="text"
                            value={selectedZone.metadata?.buttonActionData || ""}
                            onChange={(e) => {
                              setZones(zones.map(z => z.id === selectedZoneId ? {
                                ...z,
                                metadata: { ...z.metadata, buttonActionData: e.target.value }
                              } : z));
                            }}
                            className="w-full px-2 py-1 bg-black/50 border border-yellow-500/30 rounded text-sm text-white"
                            placeholder="/essence-market"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Enter page path (e.g., /essence-market) or full URL
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400 space-y-1">
                <div>Mode: {selectedZone.mode}</div>
                <div>Type: {selectedZone.type}</div>
                <div>Position: {Math.round(selectedZone.x)}, {Math.round(selectedZone.y)}</div>
                {selectedZone.mode === "zone" && selectedZone.width && selectedZone.height && (
                  <div>Size: {Math.round(selectedZone.width)}×{Math.round(selectedZone.height)}</div>
                )}
                {selectedZone.metadata && (
                  <div className="mt-2 pt-2 border-t border-yellow-500/30">
                    <div className="font-bold">Metadata:</div>
                    <pre className="text-xs">{JSON.stringify(selectedZone.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              className="mek-button-primary w-full"
            >
              Save Project
            </button>
            <button
              onClick={() => setShowAutosaveHistory(true)}
              className="w-full px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              Autosave History ({autosaveHistoryFromDb?.length || 0})
            </button>
            <button
              onClick={async () => {
                // Auto-save current state before clearing
                if (zones.length > 0) {
                  try {
                    await saveOverlay({
                      imageKey,
                      imagePath,
                      imageWidth: imageDimensions.width,
                      imageHeight: imageDimensions.height,
                      zones,
                    });
                  } catch (error) {
                    console.error("Failed to save before clearing:", error);
                    const confirmClear = window.confirm("Failed to save project. Clear anyway?");
                    if (!confirmClear) return;
                  }
                }

                // Clear all fields and canvas with unique project name to avoid reloading
                const uniqueKey = `new-project-${Date.now()}`;
                setImageKey(uniqueKey);
                setImagePath("");
                setZones([]);
                setSelectedZoneId(null);
                setImageLoaded(false);
                setImageDimensions({ width: 0, height: 0 });
                setScale(1);
                setPanOffset({ x: 0, y: 0 });
                setUsedVariations(new Set());
              }}
              className="w-full px-4 py-2 bg-black/50 border border-yellow-500/50 rounded text-white hover:bg-yellow-500/20 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Autosave History Modal */}
      {showAutosaveHistory && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowAutosaveHistory(false)}
        >
          <div
            className="bg-black border-2 border-blue-500/50 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="mek-text-industrial text-2xl text-blue-400">Autosave History</h2>
              <button
                onClick={() => setShowAutosaveHistory(false)}
                className="px-3 py-1 bg-red-600/20 border border-red-500/50 rounded text-red-400 hover:bg-red-600/30"
              >
                Close
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              Last {autosaveHistoryFromDb?.length || 0} autosaves (most recent first). Click to restore.
              <br />
              <span className="text-green-400">✓ Permanent - survives page refresh</span>
            </div>

            {!autosaveHistoryFromDb || autosaveHistoryFromDb.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No autosave history yet. Autosaves happen when you commit or delete sprites.
              </div>
            ) : (
              <div className="space-y-2">
                {autosaveHistoryFromDb.map((item, index) => (
                  <div
                    key={item._id}
                    onClick={() => restoreFromHistory(item)}
                    className="p-4 bg-black/50 border border-blue-500/30 rounded cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-blue-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {item.spriteCount} sprite{item.spriteCount !== 1 ? 's' : ''} placed
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? 'Most recent' : `${index} save${index !== 1 ? 's' : ''} ago`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
