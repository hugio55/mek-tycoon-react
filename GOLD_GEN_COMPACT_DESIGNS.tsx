/**
 * COMPACT TABLE-LIKE GOLD GENERATION CARD DESIGNS
 *
 * 4 new compact designs to replace blocky/huge existing styles
 * Each design emphasizes data density and readability
 *
 * Usage:
 * - goldGenData.base: Base gold generation (white)
 * - goldGenData.bonus: Bonus gold generation (glowing green #00ff00)
 * - goldGenData.total: Total gold generation (yellow/cyan based on useYellowGlow)
 *
 * Typography:
 * - Numbers: Saira Condensed weight 200
 * - Labels: Inter weight 400
 */

// ==========================================
// STYLE 1: "data-table"
// Clean table rows with minimal spacing
// ==========================================
const DataTableStyle = ({ goldGenData, useYellowGlow }: any) => <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}><div className="divide-y divide-yellow-500/10"><div className="flex items-center justify-between px-3 py-1.5 hover:bg-yellow-500/5 transition-colors"><span className="text-white/70 text-xs uppercase tracking-wide" style={{ fontWeight: 400 }}>Base Rate</span><span className="text-white text-base tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200 }}>{goldGenData.base.toFixed(1)} g/h</span></div><div className="flex items-center justify-between px-3 py-1.5 hover:bg-green-500/5 transition-colors"><span className="text-white/70 text-xs uppercase tracking-wide" style={{ fontWeight: 400 }}>Bonus</span><span className="text-green-400 text-base tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: '0 0 10px rgba(0, 255, 0, 0.6)' }}>+{goldGenData.bonus.toFixed(1)} g/h</span></div><div className="flex items-center justify-between px-3 py-2 bg-yellow-500/10 border-t-2 border-yellow-500/30"><span className={`text-xs uppercase tracking-wide font-semibold ${useYellowGlow ? 'text-yellow-400' : 'text-cyan-400'}`} style={{ fontWeight: 400 }}>Total Generation</span><span className={`text-lg tabular-nums ${useYellowGlow ? 'text-yellow-400' : 'text-cyan-400'}`} style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: useYellowGlow ? '0 0 12px rgba(250, 182, 23, 0.7)' : '0 0 12px rgba(0, 212, 255, 0.7)' }}>{goldGenData.total.toFixed(1)} g/h</span></div></div></div>;

// ==========================================
// STYLE 2: "compact-grid"
// 2x2 grid with metric boxes
// ==========================================
const CompactGridStyle = ({ goldGenData, useYellowGlow }: any) => <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded p-2"><div className="grid grid-cols-2 gap-1.5"><div className="bg-black/30 border border-white/10 rounded px-2 py-1.5"><div className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Base</div><div className="text-white text-sm tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200 }}>{goldGenData.base.toFixed(1)}</div></div><div className="bg-black/30 border border-green-500/20 rounded px-2 py-1.5"><div className="text-green-400/70 text-[10px] uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Bonus</div><div className="text-green-400 text-sm tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}>+{goldGenData.bonus.toFixed(1)}</div></div><div className={`col-span-2 ${useYellowGlow ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-cyan-500/10 border-cyan-500/30'} border-2 rounded px-2 py-1.5 flex items-baseline justify-between`}><div className={`text-[10px] uppercase tracking-wider ${useYellowGlow ? 'text-yellow-400/80' : 'text-cyan-400/80'}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Total</div><div className={`text-base tabular-nums ${useYellowGlow ? 'text-yellow-400' : 'text-cyan-400'}`} style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.6)' : '0 0 10px rgba(0, 212, 255, 0.6)' }}>{goldGenData.total.toFixed(1)} g/h</div></div></div></div>;

// ==========================================
// STYLE 3: "info-rows"
// Stacked rows with color-coded left border
// ==========================================
const InfoRowsStyle = ({ goldGenData, useYellowGlow }: any) => <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded overflow-hidden"><div className="space-y-px"><div className="flex items-center justify-between px-3 py-2 bg-black/20 border-l-2 border-white/30"><div><div className="text-white/70 text-[10px] uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Base Rate</div><div className="text-white text-sm tabular-nums mt-0.5" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200 }}>{goldGenData.base.toFixed(1)} g/h</div></div></div><div className="flex items-center justify-between px-3 py-2 bg-black/20 border-l-2 border-green-500/60"><div><div className="text-green-400/80 text-[10px] uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Bonus Rate</div><div className="text-green-400 text-sm tabular-nums mt-0.5" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}>+{goldGenData.bonus.toFixed(1)} g/h</div></div></div><div className={`flex items-center justify-between px-3 py-2 bg-black/30 border-l-4 ${useYellowGlow ? 'border-yellow-400' : 'border-cyan-400'}`}><div><div className={`text-[10px] uppercase tracking-wide ${useYellowGlow ? 'text-yellow-400/80' : 'text-cyan-400/80'}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Total Generation</div><div className={`text-base tabular-nums mt-0.5 ${useYellowGlow ? 'text-yellow-400' : 'text-cyan-400'}`} style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.6)' : '0 0 10px rgba(0, 212, 255, 0.6)' }}>{goldGenData.total.toFixed(1)} g/h</div></div></div></div></div>;

// ==========================================
// STYLE 4: "stats-list"
// Condensed list with inline values
// ==========================================
const StatsListStyle = ({ goldGenData, useYellowGlow }: any) => <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded px-3 py-2"><div className="space-y-1.5"><div className="flex items-center justify-between text-xs"><span className="text-white/60 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Base:</span><span className="text-white tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200 }}>{goldGenData.base.toFixed(1)} g/h</span></div><div className="flex items-center justify-between text-xs"><span className="text-green-400/70 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Bonus:</span><span className="text-green-400 tabular-nums" style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}>+{goldGenData.bonus.toFixed(1)} g/h</span></div><div className={`flex items-center justify-between pt-1.5 mt-1.5 border-t ${useYellowGlow ? 'border-yellow-500/30' : 'border-cyan-500/30'}`}><span className={`text-xs uppercase tracking-wide font-semibold ${useYellowGlow ? 'text-yellow-400/90' : 'text-cyan-400/90'}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>Total:</span><span className={`text-base tabular-nums ${useYellowGlow ? 'text-yellow-400' : 'text-cyan-400'}`} style={{ fontFamily: 'Saira Condensed, sans-serif', fontWeight: 200, textShadow: useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.6)' : '0 0 10px rgba(0, 212, 255, 0.6)' }}>{goldGenData.total.toFixed(1)} g/h</span></div></div></div>;

// ==========================================
// EXPORT ALL STYLES
// ==========================================
export const COMPACT_GOLD_GEN_STYLES = {
  'data-table': DataTableStyle,
  'compact-grid': CompactGridStyle,
  'info-rows': InfoRowsStyle,
  'stats-list': StatsListStyle,
};

/**
 * COMPARISON WITH OLD STYLES
 *
 * Old styles (matrix-badge, command-line, etc.):
 * - Large padding (p-6, p-8)
 * - Big font sizes (text-2xl, text-3xl)
 * - Lots of decorative elements
 * - Takes up significant screen space
 *
 * New compact styles:
 * - Minimal padding (p-2, px-3 py-1.5)
 * - Smaller fonts (text-xs, text-sm, text-base)
 * - Focus on data readability
 * - 60-70% less vertical space
 * - Table-like information density
 * - Still maintains futuristic aesthetic
 *
 * USAGE EXAMPLE:
 *
 * import { COMPACT_GOLD_GEN_STYLES } from './GOLD_GEN_COMPACT_DESIGNS';
 *
 * const goldGenData = { base: 20.0, bonus: 4.0, total: 24.0 };
 * const useYellowGlow = true; // or false for cyan
 *
 * // Render style by name
 * const SelectedStyle = COMPACT_GOLD_GEN_STYLES['data-table'];
 * <SelectedStyle goldGenData={goldGenData} useYellowGlow={useYellowGlow} />
 */
