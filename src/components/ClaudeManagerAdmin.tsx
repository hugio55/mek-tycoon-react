'use client';

import { useState, useEffect } from 'react';
import ClaudeMdSummary from './ClaudeMdSummary';

interface ClaudeFile {
  name: string;
  path: string;
  type: 'command' | 'document' | 'agent' | 'config';
  location: 'project' | 'parent' | 'computer';
  description?: string;
  content: string;
  frontmatter?: Record<string, any>;
  lastModified?: number;
}

interface ClaudeFilesResponse {
  success: boolean;
  files: ClaudeFile[];
  stats: {
    total: number;
    project: number;
    parent: number;
    computer: number;
    byType: {
      commands: number;
      documents: number;
      agents: number;
      config: number;
    };
  };
}

export default function ClaudeManagerAdmin() {
  const [activeTab, setActiveTab] = useState<'files' | 'summary'>('files');
  const [data, setData] = useState<ClaudeFilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'command' | 'document' | 'agent' | 'config'>('all');
  const [filterLocation, setFilterLocation] = useState<'all' | 'project' | 'parent' | 'computer'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ path: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  // FileCard component for rendering individual files
  const FileCard = ({ file }: { file: ClaudeFile }) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* File Header */}
      <div className="p-4 flex items-center gap-4">
        <div
          className="flex-1 flex items-center gap-4 cursor-pointer hover:bg-gray-700/50 transition-colors -m-4 p-4"
          onClick={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
        >
          <div className="text-2xl">{getTypeIcon(file.type)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {file.type === 'command' ? '/' : file.type === 'agent' ? '@' : ''}{file.name}
              </span>
              {getLocationBadge(file.location)}
            </div>
            {file.description && (
              <div className="text-sm text-gray-400 mt-1">{file.description}</div>
            )}
          </div>
          <div className="text-gray-500">
            {expandedFile === file.path ? '▼' : '▶'}
          </div>
        </div>

        {/* Copy Path Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(file.path);
            // Visual feedback could be added here
          }}
          className="px-3 py-2 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700 text-blue-400 rounded transition-colors flex items-center gap-2"
          title="Copy file path"
        >
          <span className="text-lg">📋</span>
          <span className="text-xs">COPY PATH</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(file.path, file.name);
          }}
          className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-700 text-red-400 rounded transition-colors flex items-center gap-2"
          title="Delete file"
        >
          <span className="text-lg">🗑️</span>
          <span className="text-xs">DELETE</span>
        </button>
      </div>

      {/* Expanded Content */}
      {expandedFile === file.path && (
        <div className="border-t border-gray-700 p-4 bg-gray-900/50">
          {/* Frontmatter */}
          {file.frontmatter && Object.keys(file.frontmatter).length > 0 && (
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <div className="text-sm text-gray-400 mb-2">Metadata:</div>
              <div className="space-y-1">
                {Object.entries(file.frontmatter).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-blue-400">{key}:</span>{' '}
                    <span className="text-gray-300">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Path */}
          <div className="mb-3 text-xs text-gray-500 font-mono">
            {file.path}
          </div>

          {/* Content */}
          <div className="bg-black/30 rounded p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {file.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    console.log('[CLAUDE_ADMIN] Component mounted, loading files...');
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/claude-files');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from API');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[CLAUDE_ADMIN] Failed to load Claude files:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(filePath: string, fileName: string) {
    setDeleteConfirm({ path: filePath, name: fileName });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/claude-files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: deleteConfirm.path })
      });

      const result = await response.json();
      if (result.success) {
        // Reload files after successful deletion
        await loadFiles();
        setDeleteConfirm(null);
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  }

  const filteredFiles = data?.files.filter(file => {
    if (filterType !== 'all' && file.type !== filterType) return false;
    if (filterLocation !== 'all' && file.location !== filterLocation) return false;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = file.name.toLowerCase().includes(query);
      const descMatch = file.description?.toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortOrder === 'newest') {
      return (b.lastModified || 0) - (a.lastModified || 0);
    } else if (sortOrder === 'oldest') {
      return (a.lastModified || 0) - (b.lastModified || 0);
    } else {
      // Sort by name
      return a.name.localeCompare(b.name);
    }
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'command': return '⚡';
      case 'document': return '📄';
      case 'agent': return '🤖';
      case 'config': return '⚙️';
      default: return '📝';
    }
  };

  const getLocationBadge = (location: string) => {
    if (location === 'project') {
      return <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">Project</span>;
    } else if (location === 'parent') {
      return <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded">Mek Tycoon</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded">Computer-Wide</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-3 text-yellow-400">
          <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Claude files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-4">
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-400 mb-2">Failed to Load Claude Files</h3>
              <p className="text-red-300 mb-4">{error}</p>

              <div className="bg-black/30 p-4 rounded text-sm text-gray-300 mb-4">
                <div className="font-bold mb-2">Troubleshooting:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Is the dev server running? (npm run dev:all)</li>
                  <li>Check browser console for detailed error messages</li>
                  <li>Verify the API route exists: /api/claude-files</li>
                  <li>Check server logs for backend errors</li>
                </ul>
              </div>

              <button
                onClick={loadFiles}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">
            <strong className="text-white">Expected file locations:</strong>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>• Project: .claude/ (this project)</li>
              <li>• Mek Tycoon: C:\Users\Ben Meyers\Documents\Mek Tycoon\.claude\</li>
              <li>• Computer: C:\Users\Ben Meyers\.claude\</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="p-8 text-center">
        <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-6 inline-block">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-orange-400">No data available</p>
          <button
            onClick={loadFiles}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
          >
            🔄 Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'files'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          📁 Claude Files
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'summary'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          📋 CLAUDE.md Summary
        </button>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === 'summary' ? (
        <ClaudeMdSummary />
      ) : (
        <>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Files</div>
          <div className="text-2xl font-bold text-white">{data.stats.total}</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-400 text-sm">Project Files</div>
          <div className="text-2xl font-bold text-blue-300">{data.stats.project}</div>
        </div>
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="text-green-400 text-sm">Mek Tycoon</div>
          <div className="text-2xl font-bold text-green-300">{data.stats.parent}</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
          <div className="text-purple-400 text-sm">Computer-Wide</div>
          <div className="text-2xl font-bold text-purple-300">{data.stats.computer}</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="text-yellow-400 text-sm">Slash Commands</div>
          <div className="text-2xl font-bold text-yellow-300">{data.stats.byType.commands}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <span className="text-gray-400 text-sm">Type:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-sm rounded ${filterType === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            All ({data.stats.total})
          </button>
          <button
            onClick={() => setFilterType('command')}
            className={`px-3 py-1 text-sm rounded ${filterType === 'command' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            ⚡ Commands ({data.stats.byType.commands})
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`px-3 py-1 text-sm rounded ${filterType === 'document' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            📄 Documents ({data.stats.byType.documents})
          </button>
          <button
            onClick={() => setFilterType('agent')}
            className={`px-3 py-1 text-sm rounded ${filterType === 'agent' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            🤖 Agents ({data.stats.byType.agents})
          </button>
        </div>

        <div className="flex gap-2">
          <span className="text-gray-400 text-sm">Location:</span>
          <button
            onClick={() => setFilterLocation('all')}
            className={`px-3 py-1 text-sm rounded ${filterLocation === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterLocation('project')}
            className={`px-3 py-1 text-sm rounded ${filterLocation === 'project' ? 'bg-blue-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            Project
          </button>
          <button
            onClick={() => setFilterLocation('parent')}
            className={`px-3 py-1 text-sm rounded ${filterLocation === 'parent' ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            Mek Tycoon
          </button>
          <button
            onClick={() => setFilterLocation('computer')}
            className={`px-3 py-1 text-sm rounded ${filterLocation === 'computer' ? 'bg-purple-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            Computer-Wide
          </button>
        </div>

        <button
          onClick={loadFiles}
          className="ml-auto px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Files List - Organized by Type */}
      <div className="space-y-8">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No files found matching filters
          </div>
        ) : (
          <>
            {/* Slash Commands Section */}
            {filteredFiles.some(f => f.type === 'command') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">⚡</div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Slash Commands</h3>
                    <p className="text-sm text-gray-400">Type /command-name in Claude to activate</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredFiles.filter(f => f.type === 'command').map((file) => (
                    <FileCard key={file.path} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* Agents Section */}
            {filteredFiles.some(f => f.type === 'agent') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-400">Specialist Agents</h3>
                    <p className="text-sm text-gray-400">Type @agent-name in Claude or launch via Task tool</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredFiles.filter(f => f.type === 'agent').map((file) => (
                    <FileCard key={file.path} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* Reference Documents Section */}
            {filteredFiles.some(f => f.type === 'document') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">📄</div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400">Reference Documents</h3>
                    <p className="text-sm text-gray-400">Specialist knowledge bases and pattern guides</p>
                  </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="flex gap-3 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-green-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'name')}
                    className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-green-400 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="newest">📅 Newest First</option>
                    <option value="oldest">📅 Oldest First</option>
                    <option value="name">🔤 Name (A-Z)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredFiles.filter(f => f.type === 'document').map((file) => (
                    <FileCard key={file.path} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* Config Files Section */}
            {filteredFiles.some(f => f.type === 'config') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">⚙️</div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-400">Configuration Files</h3>
                    <p className="text-sm text-gray-400">Claude configuration and settings</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredFiles.filter(f => f.type === 'config').map((file) => (
                    <FileCard key={file.path} file={file} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Helper Info */}
      <div className="mt-8 p-4 bg-blue-900/10 border border-blue-700/30 rounded-lg">
        <div className="text-sm text-blue-300 space-y-2">
          <div><strong>Slash Commands:</strong> Type <code className="bg-black/30 px-2 py-1 rounded">/command-name</code> in Claude to use</div>
          <div><strong>Agents:</strong> Type <code className="bg-black/30 px-2 py-1 rounded">@agent-name</code> in Claude to use (or launch via Task tool)</div>
          <div><strong>Project Files:</strong> .claude/ (this project only)</div>
          <div><strong>Mek Tycoon Files:</strong> C:\Users\Ben Meyers\Documents\Mek Tycoon\.claude\ (shared across staging & main)</div>
          <div><strong>Computer-Wide Files:</strong> C:\Users\Ben Meyers\.claude\ (all projects on this computer)</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-xl font-bold text-red-400">Delete File?</h3>
            </div>

            <div className="bg-black/50 p-4 rounded mb-4">
              <div className="text-gray-400 text-sm mb-1">File to delete:</div>
              <div className="text-white font-bold">{deleteConfirm.name}</div>
              <div className="text-gray-500 text-xs mt-2 break-all">{deleteConfirm.path}</div>
            </div>

            <div className="text-yellow-400 text-sm mb-4 text-center">
              ⚠️ This action cannot be undone!
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-bold"
              >
                {deleting ? 'Deleting...' : 'DELETE PERMANENTLY'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Export the project path for reference
const PROJECT_CLAUDE_DIR = '.claude';
