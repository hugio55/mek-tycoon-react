'use client';

import { useState, useEffect } from 'react';

interface Section {
  title: string;
  level: number; // 1 for #, 2 for ##, etc.
  line: number;
  category: 'critical' | 'protection' | 'config' | 'general';
}

export default function ClaudeMdSummary() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClaudeMd();
  }, []);

  async function loadClaudeMd() {
    try {
      const response = await fetch('/api/claude-md');
      if (!response.ok) {
        throw new Error(`Failed to load CLAUDE.md: ${response.status}`);
      }

      const content = await response.text();
      const parsedSections = parseClaudeMd(content);
      setSections(parsedSections);
    } catch (err) {
      console.error('Error loading CLAUDE.md:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function parseClaudeMd(content: string): Section[] {
    // Split on any line ending and trim each line to remove \r
    const lines = content.split(/\r?\n/).map(line => line.trim());
    const sections: Section[] = [];

    lines.forEach((line, index) => {
      // Match markdown headers (# Header, ## Header, etc.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        // Determine category based on content
        let category: Section['category'] = 'general';
        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes('critical') || lowerTitle.includes('🚨')) {
          category = 'critical';
        } else if (lowerTitle.includes('protection') || lowerTitle.includes('git checkout') || lowerTitle.includes('branch switching') || lowerTitle.includes('session')) {
          category = 'protection';
        } else if (lowerTitle.includes('database') || lowerTitle.includes('deployment') || lowerTitle.includes('config') || lowerTitle.includes('environment')) {
          category = 'config';
        }

        sections.push({
          title,
          level,
          line: index + 1,
          category
        });
      }
    });

    return sections;
  }

  function getCategoryColor(category: Section['category']): string {
    switch (category) {
      case 'critical':
        return 'text-red-400';
      case 'protection':
        return 'text-yellow-400';
      case 'config':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  }

  function getCategoryIcon(category: Section['category']): string {
    switch (category) {
      case 'critical':
        return '🚨';
      case 'protection':
        return '🛡️';
      case 'config':
        return '⚙️';
      default:
        return '📄';
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-3 text-yellow-400">
          <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Parsing CLAUDE.md...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-400 mb-2">Failed to Load CLAUDE.md</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group sections by top-level categories
  const topLevelSections = sections.filter(s => s.level === 2); // ## level headers
  const criticalSections = sections.filter(s => s.category === 'critical');
  const protectionSections = sections.filter(s => s.category === 'protection');
  const configSections = sections.filter(s => s.category === 'config');

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">CLAUDE.md Summary</h2>
        <p className="text-gray-400">
          Overview of project instructions and protection rules
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="text-gray-400">
            Total Sections: <span className="text-white font-bold">{sections.length}</span>
          </div>
          <div className="text-red-400">
            Critical: <span className="font-bold">{criticalSections.length}</span>
          </div>
          <div className="text-yellow-400">
            Protection: <span className="font-bold">{protectionSections.length}</span>
          </div>
          <div className="text-blue-400">
            Configuration: <span className="font-bold">{configSections.length}</span>
          </div>
        </div>
      </div>

      {/* Critical Sections */}
      {criticalSections.length > 0 && (
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚨</span>
            <h3 className="text-xl font-bold text-red-400">Critical Sections</h3>
          </div>
          <div className="space-y-2">
            {criticalSections.map((section, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-black/30 rounded border border-red-800/30 hover:border-red-700/50 transition-colors"
              >
                <span className="text-xl">{getCategoryIcon(section.category)}</span>
                <div className="flex-1">
                  <div className={`font-medium ${getCategoryColor(section.category)}`}>
                    {section.title.replace(/🚨/g, '').trim()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Line {section.line}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protection Sections */}
      {protectionSections.length > 0 && (
        <div className="bg-yellow-900/20 border-2 border-yellow-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🛡️</span>
            <h3 className="text-xl font-bold text-yellow-400">Protection Rules</h3>
          </div>
          <div className="space-y-2">
            {protectionSections.map((section, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-black/30 rounded border border-yellow-800/30 hover:border-yellow-700/50 transition-colors"
              >
                <span className="text-xl">{getCategoryIcon(section.category)}</span>
                <div className="flex-1">
                  <div className={`font-medium ${getCategoryColor(section.category)}`}>
                    {section.title.replace(/🚨/g, '').trim()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Line {section.line}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      {configSections.length > 0 && (
        <div className="bg-blue-900/20 border-2 border-blue-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚙️</span>
            <h3 className="text-xl font-bold text-blue-400">Configuration & Setup</h3>
          </div>
          <div className="space-y-2">
            {configSections.map((section, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-black/30 rounded border border-blue-800/30 hover:border-blue-700/50 transition-colors"
              >
                <span className="text-xl">{getCategoryIcon(section.category)}</span>
                <div className="flex-1">
                  <div className={`font-medium ${getCategoryColor(section.category)}`}>
                    {section.title.replace(/🚨/g, '').trim()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Line {section.line}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Major Sections (Collapsible) */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📋</span>
          <h3 className="text-xl font-bold text-gray-300">All Major Sections</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {topLevelSections.map((section, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 bg-black/20 rounded border border-gray-800 hover:border-gray-600 transition-colors text-sm"
            >
              <span className="text-lg">{getCategoryIcon(section.category)}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${getCategoryColor(section.category)} truncate`}>
                  {section.title.replace(/🚨/g, '').trim()}
                </div>
                <div className="text-xs text-gray-500">Line {section.line}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-400">
          <strong className="text-white">Purpose:</strong> This summary helps identify sections of CLAUDE.md that may no longer be needed or require updates.
          Review critical and protection sections carefully before making changes.
        </div>
      </div>
    </div>
  );
}
