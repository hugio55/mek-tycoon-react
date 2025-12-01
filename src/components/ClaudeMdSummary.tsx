'use client';

import { useState, useEffect } from 'react';

interface Section {
  title: string;
  level: number; // 1 for #, 2 for ##, etc.
  line: number;
  category: 'critical' | 'protection' | 'config' | 'general';
}

interface Recommendation {
  sectionTitle: string;
  reason: 'resolved' | 'verbose' | 'duplicate' | 'automated' | 'historical';
  shortTitle: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export default function ClaudeMdSummary() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadClaudeMd();
  }, []);

  async function loadClaudeMd() {
    try {
      console.log('[CLAUDE_MD] Fetching from /api/claude-md...');
      const response = await fetch('/api/claude-md');
      if (!response.ok) {
        throw new Error(`Failed to load CLAUDE.md: ${response.status}`);
      }

      const content = await response.text();
      console.log('[CLAUDE_MD] Received content, length:', content.length);
      const parsedSections = parseClaudeMd(content);
      console.log('[CLAUDE_MD] Parsed sections:', parsedSections.length);
      console.log('[CLAUDE_MD] First 5 sections:', parsedSections.slice(0, 5));
      setSections(parsedSections);
    } catch (err) {
      console.error('[CLAUDE_MD] Error loading:', err);
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

  function generateRecommendations(sections: Section[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const sectionTitles = sections.map(s => s.title.toLowerCase());

    // Check for overly verbose historical incidents
    if (sectionTitles.some(t => t.includes('real incident') && t.includes('port conflict'))) {
      recommendations.push({
        sectionTitle: 'REAL INCIDENT: PORT CONFLICT THAT KILLED ALL SESSIONS',
        reason: 'historical',
        shortTitle: 'Port Conflict Incident (Oct 24, 2025)',
        reasoning: 'This historical incident from October 2025 is well-documented and the lesson has been learned. The key takeaway (never use taskkill /IM node.exe) is already covered in the "Session Protection" section. The lengthy incident report could be condensed to a brief warning or removed entirely.',
        confidence: 'high'
      });
    }

    if (sectionTitles.some(t => t.includes('git checkout') && t.includes('destroys uncommitted work'))) {
      recommendations.push({
        sectionTitle: 'GIT CHECKOUT DESTROYS UNCOMMITTED WORK',
        reason: 'verbose',
        shortTitle: 'Git Checkout Protection Rules',
        reasoning: 'While the protection is important, this section is extremely verbose with multiple repetitions of the same warning. The core rule ("never use git checkout without asking") could be stated once with a brief example, rather than the current lengthy breakdown with multiple subsections.',
        confidence: 'medium'
      });
    }

    // REMOVED: Branch Switching Protection - Already condensed to brief numbered rules
    // REMOVED: Duplicate Session Protection - Already consolidated into one section
    // REMOVED: Tailwind CSS Version Management - Already condensed significantly
    // REMOVED: User Communication Patterns - Already converted to bullet points

    if (sectionTitles.some(t => t.includes('unauthorized production deployment'))) {
      recommendations.push({
        sectionTitle: 'Real Incident - Unauthorized Production Deployment',
        reason: 'historical',
        shortTitle: 'Production Deployment Incident (Nov 4, 2025)',
        reasoning: 'This incident report is very detailed but the lesson is already captured in the "Production Deployment Protection" section above it. The incident details could be removed or moved to a separate "historical incidents" appendix.',
        confidence: 'high'
      });
    }

    if (sectionTitles.some(t => t.includes('third-party platform caution'))) {
      recommendations.push({
        sectionTitle: 'THIRD-PARTY PLATFORM CAUTION',
        reason: 'resolved',
        shortTitle: 'Third-Party Platform Warning',
        reasoning: 'This section warns about overconfidence with undocumented platforms like NMKR Studio. If the NMKR integration is now complete and working, or if this was a one-time issue, this warning might no longer be relevant.',
        confidence: 'low'
      });
    }

    return recommendations;
  }

  function toggleRecommendation(index: number) {
    setExpandedRecommendations(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function getReasonColor(reason: Recommendation['reason']): string {
    switch (reason) {
      case 'resolved':
        return 'text-green-400';
      case 'verbose':
        return 'text-orange-400';
      case 'duplicate':
        return 'text-yellow-400';
      case 'automated':
        return 'text-blue-400';
      case 'historical':
        return 'text-purple-400';
    }
  }

  function getReasonLabel(reason: Recommendation['reason']): string {
    switch (reason) {
      case 'resolved':
        return 'Possibly Resolved';
      case 'verbose':
        return 'Too Verbose';
      case 'duplicate':
        return 'Duplicate Info';
      case 'automated':
        return 'Now Automated';
      case 'historical':
        return 'Historical';
    }
  }

  function getConfidenceIcon(confidence: Recommendation['confidence']): string {
    switch (confidence) {
      case 'high':
        return '🎯';
      case 'medium':
        return '⚠️';
      case 'low':
        return '❓';
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
  const recommendations = generateRecommendations(sections);

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

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💡</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-400">Recommendations</h3>
              <p className="text-sm text-yellow-300/70 mt-1">
                Sections that might be outdated, too verbose, or redundant
              </p>
            </div>
            <div className="text-sm text-yellow-400 font-bold">
              {recommendations.length} suggestions
            </div>
          </div>

          <div className="space-y-2">
            {recommendations.map((rec, idx) => {
              const isExpanded = expandedRecommendations.has(idx);
              return (
                <div
                  key={idx}
                  className="bg-black/30 border border-yellow-700/30 rounded-lg overflow-hidden hover:border-yellow-600/50 transition-colors"
                >
                  <button
                    onClick={() => toggleRecommendation(idx)}
                    className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-yellow-900/10 transition-colors"
                  >
                    <span className="text-xl flex-shrink-0">{getConfidenceIcon(rec.confidence)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-yellow-400">{rec.shortTitle}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getReasonColor(rec.reason)} bg-black/30`}>
                          {getReasonLabel(rec.reason)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Section: {rec.sectionTitle}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-yellow-400">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-3 bg-black/50 border-t border-yellow-700/20">
                      <div className="text-sm text-gray-300 leading-relaxed">
                        {rec.reasoning}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <span>Confidence:</span>
                        <span className={`font-medium ${
                          rec.confidence === 'high' ? 'text-green-400' :
                          rec.confidence === 'medium' ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {rec.confidence.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-yellow-900/10 border border-yellow-700/30 rounded text-xs text-yellow-300/80">
            <strong>Note:</strong> These are suggestions based on common patterns. Review each section carefully before removing.
            Confidence levels: 🎯 High = Safe to remove/condense, ⚠️ Medium = Review first, ❓ Low = Context-dependent
          </div>
        </div>
      )}

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
