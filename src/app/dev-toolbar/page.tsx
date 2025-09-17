"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Button = {
  name: string;
  url: string;
  favorite: boolean;
  color: string;
  order?: number;
  isDivider?: boolean;
};

export default function DevToolbarPage() {
  const settings = useQuery(api.devToolbar.getSettings);
  const saveSettings = useMutation(api.devToolbar.saveSettings);

  const [buttons, setButtons] = useState<Button[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    button: Button | null;
  }>({ show: false, x: 0, y: 0, button: null });
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [status, setStatus] = useState("");
  const [draggedButton, setDraggedButton] = useState<Button | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const chromeTabRef = useRef<Window | null>(null);

  // Load settings from Convex
  useEffect(() => {
    if (settings) {
      setButtons(settings.buttons);
    }
  }, [settings]);

  // Save to Convex whenever buttons change
  const handleSave = async (newButtons: Button[]) => {
    setButtons(newButtons);
    await saveSettings({ buttons: newButtons });
    showStatus("Settings saved to database");
  };

  // Status message
  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 2000);
  };

  // Sort buttons with favorites first
  const getSortedButtons = () => {
    return [...buttons].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
  };

  // Open URL in same tab or new
  const openInChrome = (url: string, name: string) => {
    // Always use the same named window target - this makes it reuse the same tab
    const targetWindow = window.open(url, 'mainDevToolbarTarget');
    if (targetWindow) {
      targetWindow.focus();
      showStatus(`Navigated to: ${name}`);
    }
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, button: Button) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      button
    });
  };

  const toggleFavorite = () => {
    if (contextMenu.button) {
      const newButtons = buttons.map(btn =>
        btn.url === contextMenu.button!.url
          ? { ...btn, favorite: !btn.favorite }
          : btn
      );
      handleSave(newButtons);
    }
    setContextMenu({ show: false, x: 0, y: 0, button: null });
  };

  const setButtonColor = (color: string) => {
    if (contextMenu.button) {
      const newButtons = buttons.map(btn =>
        btn.url === contextMenu.button!.url
          ? { ...btn, color }
          : btn
      );
      handleSave(newButtons);
    }
    setShowColorDropdown(false);
    setContextMenu({ show: false, x: 0, y: 0, button: null });
  };

  const copyUrl = () => {
    if (contextMenu.button) {
      navigator.clipboard.writeText(contextMenu.button.url);
      showStatus(`Copied: ${contextMenu.button.url}`);
    }
    setContextMenu({ show: false, x: 0, y: 0, button: null });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, button: Button, index: number) => {
    setDraggedButton(button);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedButton(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newButtons = [...getSortedButtons()];
      const [removed] = newButtons.splice(draggedIndex, 1);
      newButtons.splice(dropIndex, 0, removed);

      // Update the main buttons array
      const finalButtons = [...newButtons];
      handleSave(finalButtons);
    }

    setDragOverIndex(null);
  };

  // Add new button
  const addNewButton = () => {
    const newButton = {
      name: `Button ${buttons.length + 1}`,
      url: 'http://localhost:3100/',
      favorite: false,
      color: 'default',
      isDivider: false
    };
    handleSave([...buttons, newButton]);
  };

  // Add divider
  const addDivider = (afterIndex?: number) => {
    const divider = {
      name: '---',
      url: '',
      favorite: false,
      color: 'default',
      isDivider: true
    };

    if (afterIndex !== undefined) {
      const sortedButtons = getSortedButtons();
      const newButtons = [...sortedButtons];
      newButtons.splice(afterIndex + 1, 0, divider);
      handleSave(newButtons);
    } else {
      handleSave([...buttons, divider]);
    }
  };

  // Update button in edit mode
  const updateButton = (index: number, field: keyof Button, value: string | boolean) => {
    const sortedButtons = getSortedButtons();
    const newButtons = [...buttons];
    const button = sortedButtons[index];
    const originalIndex = buttons.indexOf(button);

    if (originalIndex !== -1) {
      newButtons[originalIndex] = { ...newButtons[originalIndex], [field]: value };
      handleSave(newButtons);
    }
  };

  // Remove button
  const removeButton = (index: number) => {
    const sortedButtons = getSortedButtons();
    const button = sortedButtons[index];
    const newButtons = buttons.filter(b => b.url !== button.url);
    handleSave(newButtons);
  };

  // Button color styles
  const getButtonColorClass = (color: string) => {
    const colors: Record<string, string> = {
      default: 'bg-gradient-to-br from-purple-600 to-purple-800',
      green: 'bg-gradient-to-br from-green-600 to-green-800',
      blue: 'bg-gradient-to-br from-blue-600 to-blue-800',
      red: 'bg-gradient-to-br from-red-600 to-red-800',
      yellow: 'bg-gradient-to-br from-yellow-600 to-yellow-800',
      cyan: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
      orange: 'bg-gradient-to-br from-orange-600 to-orange-800',
    };
    return colors[color] || colors.default;
  };

  if (!settings) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  }

  const sortedButtons = getSortedButtons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-black/50 backdrop-blur-lg rounded-lg border border-white/10 mb-6">
        {sortedButtons.map((button, index) => (
          button.isDivider ? (
            <div
              key={`divider-${index}`}
              className={`
                w-full basis-full h-4 relative group
                ${draggedIndex === index ? 'bg-yellow-400/20' : ''}
                ${dragOverIndex === index ? 'bg-yellow-400/30' : ''}
                ${editMode ? 'bg-white/5 hover:bg-white/10' : ''}
              `}
              draggable={!editMode}
              onDragStart={(e) => !editMode && handleDragStart(e, button, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => !editMode && handleDragOver(e, index)}
              onDrop={(e) => !editMode && handleDrop(e, index)}
            >
              {editMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-gray-600">Line Break</span>
                </div>
              )}
            </div>
          ) : (
            <button
              key={button.url || `button-${index}`}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all transform
                hover:scale-105 hover:shadow-xl cursor-move
                ${getButtonColorClass(button.color)}
                ${button.favorite ? 'ring-2 ring-yellow-400' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${dragOverIndex === index ? 'scale-110' : ''}
                ${editMode ? 'opacity-70 cursor-not-allowed' : ''}
              `}
              draggable={!editMode}
              onDragStart={(e) => !editMode && handleDragStart(e, button, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => !editMode && handleDragOver(e, index)}
              onDrop={(e) => !editMode && handleDrop(e, index)}
              onClick={() => !editMode && !button.isDivider && openInChrome(button.url, button.name)}
              onContextMenu={(e) => !editMode && !button.isDivider && handleContextMenu(e, button)}
            >
              {button.favorite && <span className="mr-2">★</span>}
              {button.name}
            </button>
          )
        ))}
      </div>

      {/* Settings Panel */}
      <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-white/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">Button Configuration</h2>
          <div className="flex gap-3">
            <button
              onClick={() => addDivider()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
            >
              + Add Line Break
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-6 py-2 rounded font-semibold transition-colors ${
                editMode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              Edit Mode: {editMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Edit Mode */}
        {editMode && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto mb-4">
              {sortedButtons.map((button, index) => (
                <div key={`edit-${index}`} className="bg-white/5 p-4 rounded-lg">
                  {button.isDivider ? (
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📐 Line Break</div>
                      <div className="text-xs text-gray-500 mb-2">Creates a new row</div>
                      <button
                        onClick={() => removeButton(index)}
                        className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 w-full"
                      >
                        Remove Line Break
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={button.name}
                        onChange={(e) => updateButton(index, 'name', e.target.value)}
                        className="w-full p-2 mb-2 bg-white/10 rounded"
                        placeholder="Button Name"
                      />
                      <input
                        type="text"
                        value={button.url}
                        onChange={(e) => updateButton(index, 'url', e.target.value)}
                        className="w-full p-2 mb-2 bg-white/10 rounded"
                        placeholder="URL"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateButton(index, 'favorite', !button.favorite)}
                          className={`px-3 py-1 rounded text-sm ${
                            button.favorite ? 'bg-yellow-600' : 'bg-gray-600'
                          }`}
                        >
                          {button.favorite ? '★ Favorited' : '☆ Favorite'}
                        </button>
                        <button
                          onClick={() => removeButton(index)}
                          className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addNewButton}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
            >
              + Add New Button
            </button>
          </>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h3 className="font-bold mb-2">How to use:</h3>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>• Click "Edit Mode" to configure your buttons</li>
            <li>• <strong>Left-click</strong> any button to open/replace the current tab</li>
            <li>• <strong>Right-click</strong> any button for more options (favorite, color, copy URL)</li>
            <li>• <strong>Drag and drop</strong> buttons to reorder them</li>
            <li>• All settings are saved to the database automatically</li>
          </ul>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className="fixed bottom-4 right-4 px-6 py-3 bg-black/80 rounded-lg shadow-xl">
          {status}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setContextMenu({ show: false, x: 0, y: 0, button: null });
              setShowColorDropdown(false);
            }}
          />
          <div
            className="fixed z-50 bg-gray-900 border border-white/20 rounded-lg shadow-2xl p-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => openInChrome(contextMenu.button!.url, contextMenu.button!.name)}
              className="w-full text-left px-4 py-2 hover:bg-white/10 rounded"
            >
              🔗 Open in Main Tab
            </button>
            <button
              onClick={() => {
                window.open(contextMenu.button!.url, '_blank');
                setContextMenu({ show: false, x: 0, y: 0, button: null });
              }}
              className="w-full text-left px-4 py-2 hover:bg-white/10 rounded"
            >
              🆕 Open in New Tab
            </button>
            <hr className="my-2 border-white/20" />
            <button
              onClick={toggleFavorite}
              className="w-full text-left px-4 py-2 hover:bg-white/10 rounded"
            >
              {contextMenu.button?.favorite ? '★ Remove from Favorites' : '☆ Set as Favorite'}
            </button>
            <button
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="w-full text-left px-4 py-2 hover:bg-white/10 rounded flex justify-between items-center"
            >
              <span>🎨 Set Color</span>
              <span>{showColorDropdown ? '▲' : '▼'}</span>
            </button>
            {showColorDropdown && (
              <div className="ml-4 mt-1 space-y-1">
                {['default', 'green', 'blue', 'red', 'yellow', 'cyan', 'orange'].map(color => (
                  <button
                    key={color}
                    onClick={() => setButtonColor(color)}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded flex items-center gap-2"
                  >
                    <div className={`w-5 h-5 rounded ${getButtonColorClass(color)}`} />
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <hr className="my-2 border-white/20" />
            <button
              onClick={copyUrl}
              className="w-full text-left px-4 py-2 hover:bg-white/10 rounded"
            >
              📋 Copy URL
            </button>
          </div>
        </>
      )}
    </div>
  );
}