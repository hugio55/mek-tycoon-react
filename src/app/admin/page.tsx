'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import * as Switch from '@radix-ui/react-switch';
import MasterRangeSystem from '@/components/MasterRangeSystem';
import RarityChart from '@/components/RarityChart';
import GameDataLightbox from '@/components/GameDataLightbox';
import StoryClimbConfig from '@/components/StoryClimbConfig';
import DifficultyAdminConfig from '@/components/DifficultyAdminConfig';
import BuffCategoriesAdmin from '@/components/BuffCategoriesAdmin';
import BuffCategoriesV2Admin from '@/components/BuffCategoriesV2Admin';
import MekBaseConfig from '@/components/MekBaseConfig';
import MekTalentTreeConfig from '@/components/MekTalentTreeConfig';
import MekDetailViewer from '@/components/MekDetailViewer';
import GoldBackupAdmin from '@/components/GoldBackupAdmin';
import WalletManagementAdmin from '@/components/WalletManagementAdmin';
import NftPurchasePlanner from '@/components/NftPurchasePlanner';
import VariationsHub from '@/components/VariationsHub';
import CommemorativeToken1Admin from '@/components/CommemorativeToken1Admin';
import SourceKeyMigrationAdmin from '@/components/SourceKeyMigrationAdmin';
import WhitelistManagerAdmin from '@/components/WhitelistManagerAdmin';
import RouteVisualization from '@/components/RouteVisualization';
import NewStylingAdmin from '@/components/NewStylingAdmin';
import MessagingSystemAdmin from '@/components/MessagingSystemAdmin';
import CoachMarksAdmin from '@/components/CoachMarksAdmin';
import { getMediaUrl } from '@/lib/media-url';
import MutationConfirmDialog from '@/components/admin/MutationConfirmDialog';
import NMKRJSONGenerator from '@/components/admin/nft/NMKRJSONGenerator';
import CampaignManager from '@/components/admin/campaign/CampaignManager';
import NFTInventoryTable from '@/components/admin/campaign/NFTInventoryTable';
import NMKRSyncModal from '@/components/admin/campaign/NMKRSyncModal';
import EssenceMarketAdmin from '@/components/EssenceMarketAdmin';
import OverlayEditor from '@/components/OverlayEditor';
import CometLoader from '@/components/loaders/CometLoader';
import CubeSpinner from '@/components/loaders/CubeSpinner';
import TriangleKaleidoscope from '@/components/loaders/TriangleKaleidoscope';
import PreLoader from '@/components/loaders/PreLoader';
import AnimatedBorderButton from '@/components/loaders/AnimatedBorderButton';
import GlowButton from '@/components/loaders/GlowButton';
import GlowCard from '@/components/loaders/GlowCard';
import GradientBlurButton from '@/components/loaders/GradientBlurButton';
import SpinningGradientCard from '@/components/loaders/SpinningGradientCard';
import RotaryDial from '@/components/loaders/RotaryDial';
import GlowRadioStack from '@/components/loaders/GlowRadioStack';
import MekCarousel3D from '@/components/loaders/MekCarousel3D';
import MekCarousel3DSquare from '@/components/loaders/MekCarousel3DSquare';
import ProModeToggle from '@/components/controls/ProModeToggle';
import PowerSwitch from '@/components/controls/PowerSwitch';
import PowerSwitchToggle from '@/components/controls/PowerSwitchToggle';
import NebulaCheckbox from '@/components/controls/NebulaCheckbox';
import PowerButtonSwitch from '@/components/controls/PowerButtonSwitch';
import ColorToggleSwitch from '@/components/controls/ColorToggleSwitch';
import DottedToggleSwitch from '@/components/controls/DottedToggleSwitch';
import MechanicalToggle from '@/components/controls/MechanicalToggle';
import GlowToggle from '@/components/controls/GlowToggle';
import GlassButton from '@/components/controls/GlassButton';
import GlassButtonSharp from '@/components/controls/GlassButtonSharp';
import IsometricSocialButton from '@/components/controls/IsometricSocialButton';
import RadialSwitch from '@/components/RadialSwitch';
import CloseButton from '@/components/controls/CloseButton';
import DiscordButton from '@/components/controls/DiscordButton';
import GeneratingLoader from '@/components/loaders/GeneratingLoader';
import TextSwitch from '@/components/controls/TextSwitch';
import HoverTooltip from '@/components/controls/HoverTooltip';
import FillTextButton from '@/components/controls/FillTextButton';
import FloatingLabelInput from '@/components/controls/FloatingLabelInput';
import IndustrialFlipCard from '@/components/controls/IndustrialFlipCard';
import StarBurstButton from '@/components/controls/StarBurstButton';
import GlowingPowerSwitch from '@/components/controls/GlowingPowerSwitch';
import KeycapRadioGroup from '@/components/controls/KeycapRadioGroup';
import ColorPalettePicker from '@/components/controls/ColorPalettePicker';
import ColorPalettePickerSmooth from '@/components/controls/ColorPalettePickerSmooth';
import GliderRadio from '@/components/controls/GliderRadio';
import MekFlipCard from '@/components/controls/MekFlipCard';
import PushButtonRadio, { PushButtonIcons } from '@/components/controls/PushButtonRadio';
import FlipToggleSwitch from '@/components/controls/FlipToggleSwitch';
import PressedButtonRadio from '@/components/controls/PressedButtonRadio';
import GlowingBorderInput from '@/components/controls/GlowingBorderInput';
import ProgressiveBlur from '@/components/controls/ProgressiveBlur';
import NumberTicker from '@/components/controls/NumberTicker';
import ClaudeManagerAdmin from '@/components/ClaudeManagerAdmin';
import PortMonitor from '@/components/PortMonitor';
import DeploymentsAdmin from '@/components/DeploymentsAdmin';
import StarField from '@/components/StarField';
import JobBuilder from '@/components/JobBuilder';
import { VARIATIONS_BY_TYPE } from '@/lib/completeVariationRarity';
import { variationsData } from '@/lib/variationsData';
import { getVariationTrueRank, VARIATION_MEK_RANKS } from '@/lib/variationRarityMekRanks';

// Helper function to format tenure as time duration
function formatTenureDuration(tenure: number, tenurePerSecond: number): string {
  if (tenure === 0) return '0 seconds';

  const totalSeconds = tenure / tenurePerSecond;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 && days === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return parts.join(' ') || '0 seconds';
}

// Story Climb Mechanics subsections
const STORY_CLIMB_SUBSECTIONS = [
  { id: 'difficulty-subsystem', name: 'Difficulty System', icon: '⚔️' },
  { id: 'duration-subsystem', name: 'Duration Configuration', icon: '⏱️' },
  { id: 'normal-mek-distribution', name: 'Normal Mek Distribution', icon: '🤖' },
  { id: 'chapter-rarity', name: 'Chapter Rarity Distribution', icon: '📊' },
  { id: 'mek-slots', name: 'Mek Slots Configuration', icon: '📋' },
  { id: 'node-fee', name: 'Node Fee Configuration', icon: '💰' },
  { id: 'event-node', name: 'Event Node Configuration', icon: '✨' },
  { id: 'nft-planning', name: 'NFT Purchase Planning', icon: '💎' },
  { id: 'boss-rewards', name: 'Mini Boss & Final Boss Rewards', icon: '🏆' },
  { id: 'normal-rewards', name: 'Normal Mek Node Rewards', icon: '🎁' }
];


// Rarity Bias Admin Component
function RarityBiasAdmin() {
  const [rarityBias, setRarityBias] = useState(150);
  const [displayBias, setDisplayBias] = useState(150);

  const handleSliderChange = (value: number) => {
    setDisplayBias(value);
    setRarityBias(value);
  };

  return (
    <div className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Rarity Bias System</h3>
          <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
        </div>

        <p className="text-gray-400 mb-6">
          The Rarity Bias system determines crafting probabilities using a bell curve distribution.
          Higher bias values shift the curve toward rarer ranks (S, SS, SSS, X, XX, XXX).
        </p>

        {/* Size Variants Showcase */}
        <div className="space-y-8">
          {/* Large - with slider for demo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 font-bold uppercase tracking-wider">Large</span>
              <span className="text-gray-500 text-sm">(300px height, full width - full features)</span>
            </div>
            <RarityChart
              rarityBias={rarityBias}
              displayBias={displayBias}
              onSliderChange={handleSliderChange}
              showSlider={true}
              size="large"
            />
          </div>

          {/* Medium */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 font-bold uppercase tracking-wider">Medium</span>
              <span className="text-gray-500 text-sm">(150px height, max-w-md - compact with labels)</span>
            </div>
            <RarityChart
              rarityBias={rarityBias}
              displayBias={displayBias}
              showSlider={false}
              size="medium"
            />
          </div>

          {/* Small */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 font-bold uppercase tracking-wider">Small</span>
              <span className="text-gray-500 text-sm">(80px height, max-w-xs - minimal)</span>
            </div>
            <RarityChart
              rarityBias={rarityBias}
              displayBias={displayBias}
              showSlider={false}
              size="small"
            />
          </div>

          {/* Micro */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 font-bold uppercase tracking-wider">Micro</span>
              <span className="text-gray-500 text-sm">(40px height, 180px wide - bars + peak label)</span>
            </div>
            <RarityChart
              rarityBias={rarityBias}
              displayBias={displayBias}
              showSlider={false}
              size="micro"
            />
          </div>

          {/* Sub-Micro Variants */}
          <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/10">
            <h4 className="text-yellow-400 font-bold mb-4 uppercase tracking-wider text-sm">Sub-Micro Variants (Skinny Bars)</h4>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-gray-500 text-xs mb-2">sub-micro-lg (38px, 170px)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="sub-micro-lg" />
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-2">sub-micro (30px, 140px)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="sub-micro" />
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-2">sub-micro-sm (22px, 100px)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="sub-micro-sm" />
              </div>
            </div>
          </div>

          {/* Ultra-Micro Variants */}
          <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/10">
            <h4 className="text-yellow-400 font-bold mb-4 uppercase tracking-wider text-sm">Ultra-Micro Variants (Abstract)</h4>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-gray-500 text-xs mb-2">ultra-micro (gradient)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="ultra-micro" />
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-2">ultra-micro-bar (progress)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="ultra-micro-bar" />
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-2">ultra-micro-dot (indicator)</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="ultra-micro-dot" />
              </div>
            </div>
          </div>

          {/* Creative Variants */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/20">
            <h4 className="text-purple-400 font-bold mb-4 uppercase tracking-wider text-sm">Creative Variants (Experimental)</h4>
            <div className="flex flex-wrap items-start gap-8">
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Radial Gauge</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="creative-radial" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Audio Wave</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="creative-wave" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Orbital Rings</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="creative-orbital" />
              </div>
            </div>
          </div>

          {/* Wave Variants */}
          <div className="bg-gradient-to-br from-cyan-900/20 to-teal-900/20 rounded-lg p-4 border border-cyan-500/20">
            <h4 className="text-cyan-400 font-bold mb-4 uppercase tracking-wider text-sm">Wave Variants (Soundwave Series)</h4>
            <div className="flex flex-wrap items-start gap-8">
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">ECG Heartbeat</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="wave-heartbeat" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Mirror Reflection</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="wave-mirror" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Radial Spectrum</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="wave-spectrum" />
              </div>
            </div>
          </div>

          {/* Spectrum Variants (Dense) */}
          <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-500/20">
            <h4 className="text-orange-400 font-bold mb-4 uppercase tracking-wider text-sm">Spectrum Variants (Dense Radial)</h4>
            <div className="flex flex-wrap items-start gap-8">
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Wedge Segments</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-wedge" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Concentric Rings</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-rings" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Solid Donut</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-solid" />
              </div>
            </div>
          </div>

          {/* Spectrum Variants II (More Dense) */}
          <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-lg p-4 border border-pink-500/20">
            <h4 className="text-pink-400 font-bold mb-4 uppercase tracking-wider text-sm">Spectrum Variants II (Wedge Styles)</h4>
            <div className="flex flex-wrap items-start gap-8">
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Bloom Petals</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-bloom" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Starburst</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-burst" />
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-2">Gear Teeth</div>
                <RarityChart rarityBias={rarityBias} displayBias={displayBias} showSlider={false} size="spectrum-gear" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-6">
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Current Bias</div>
            <div className="text-3xl font-bold text-yellow-400">{displayBias}</div>
          </div>
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Min Bias</div>
            <div className="text-3xl font-bold text-gray-500">0</div>
          </div>
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Max Bias</div>
            <div className="text-3xl font-bold text-red-500">1000</div>
          </div>
        </div>

        {/* Rank Reference */}
        <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">Rank Reference</h4>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-center text-sm">
            <div><span className="block text-[#999999] font-bold">D</span><span className="text-gray-500">0-100</span></div>
            <div><span className="block text-[#90EE90] font-bold">C</span><span className="text-gray-500">100-200</span></div>
            <div><span className="block text-[#87CEEB] font-bold">B</span><span className="text-gray-500">200-300</span></div>
            <div><span className="block text-[#FFF700] font-bold">A</span><span className="text-gray-500">300-400</span></div>
            <div><span className="block text-[#FFB6C1] font-bold">S</span><span className="text-gray-500">400-500</span></div>
            <div><span className="block text-[#DA70D6] font-bold">SS</span><span className="text-gray-500">500-600</span></div>
            <div><span className="block text-[#9370DB] font-bold">SSS</span><span className="text-gray-500">600-700</span></div>
            <div><span className="block text-[#FF8C00] font-bold">X</span><span className="text-gray-500">700-800</span></div>
            <div><span className="block text-[#DC143C] font-bold">XX</span><span className="text-gray-500">800-900</span></div>
            <div><span className="block text-[#8B0000] font-bold">XXX</span><span className="text-gray-500">900-1000</span></div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-6 bg-black/40 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">How It Works</h4>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li><span className="text-yellow-500 mr-2">1.</span> Bell curve is centered based on the bias value using sqrt progression</li>
            <li><span className="text-yellow-500 mr-2">2.</span> Each rank has a probability calculated by Gaussian distribution (sigma = 120)</li>
            <li><span className="text-yellow-500 mr-2">3.</span> Probabilities are normalized to sum to 100%</li>
            <li><span className="text-yellow-500 mr-2">4.</span> Players increase bias through: Equipment, Upgrades, Buffs, Achievements</li>
          </ul>
        </div>

        {/* Usage Examples */}
        <div className="mt-6 bg-black/40 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">All Size Options</h4>
          <div className="text-gray-400 space-y-1 text-xs font-mono">
            <div className="text-yellow-400/70 mt-2 mb-1">Standard Sizes:</div>
            <div><span className="text-green-400">size="large"</span> - Full page displays</div>
            <div><span className="text-green-400">size="medium"</span> - Sidebars, modals</div>
            <div><span className="text-green-400">size="small"</span> - Cards, compact views</div>
            <div><span className="text-green-400">size="micro"</span> - Inline widgets</div>
            <div className="text-yellow-400/70 mt-2 mb-1">Sub-Micro (Skinny Bars):</div>
            <div><span className="text-green-400">size="sub-micro-lg"</span> - 38px, 170px wide</div>
            <div><span className="text-green-400">size="sub-micro"</span> - 30px, 140px wide</div>
            <div><span className="text-green-400">size="sub-micro-sm"</span> - 22px, 100px wide</div>
            <div className="text-yellow-400/70 mt-2 mb-1">Ultra-Micro (Abstract):</div>
            <div><span className="text-green-400">size="ultra-micro"</span> - Gradient with marker</div>
            <div><span className="text-green-400">size="ultra-micro-bar"</span> - Progress bar style</div>
            <div><span className="text-green-400">size="ultra-micro-dot"</span> - Glowing dot indicator</div>
            <div className="text-purple-400/70 mt-2 mb-1">Creative (Experimental):</div>
            <div><span className="text-purple-400">size="creative-radial"</span> - Semi-circular gauge with needle</div>
            <div><span className="text-purple-400">size="creative-wave"</span> - Audio visualizer wave</div>
            <div><span className="text-purple-400">size="creative-orbital"</span> - Concentric orbital rings</div>
            <div className="text-cyan-400/70 mt-2 mb-1">Wave Series (Soundwave Variations):</div>
            <div><span className="text-cyan-400">size="wave-heartbeat"</span> - ECG heart monitor style</div>
            <div><span className="text-cyan-400">size="wave-mirror"</span> - Symmetrical reflection wave</div>
            <div><span className="text-cyan-400">size="wave-spectrum"</span> - Radial spectrum analyzer</div>
            <div className="text-orange-400/70 mt-2 mb-1">Spectrum Series (Dense Radial):</div>
            <div><span className="text-orange-400">size="spectrum-wedge"</span> - Thick pie wedge segments</div>
            <div><span className="text-orange-400">size="spectrum-rings"</span> - Concentric filled rings</div>
            <div><span className="text-orange-400">size="spectrum-solid"</span> - Solid donut with indicator</div>
            <div className="text-pink-400/70 mt-2 mb-1">Spectrum Series II (Wedge Styles):</div>
            <div><span className="text-pink-400">size="spectrum-bloom"</span> - Flower petal shapes</div>
            <div><span className="text-pink-400">size="spectrum-burst"</span> - Starburst rays</div>
            <div><span className="text-pink-400">size="spectrum-gear"</span> - Mechanical gear teeth</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Universal Background Admin Component - Preview data for satellites and particles
const PREVIEW_SATELLITES = [
  { id: 0, startX: '-5%', startY: '20%', endX: '105%', endY: '60%', delay: '0s', duration: '35s' },
  { id: 1, startX: '105%', startY: '70%', endX: '-5%', endY: '30%', delay: '8s', duration: '40s' },
  { id: 2, startX: '30%', startY: '-5%', endX: '70%', endY: '105%', delay: '4s', duration: '38s' },
];

const PREVIEW_PARTICLES = [
  { id: 0, left: '5%', top: '15%', size: 2, driftAngle: -30, delay: '0s', duration: '22s' },
  { id: 1, left: '20%', top: '40%', size: 3, driftAngle: 15, delay: '3s', duration: '26s' },
  { id: 2, left: '35%', top: '25%', size: 2, driftAngle: -15, delay: '6s', duration: '24s' },
  { id: 3, left: '50%', top: '55%', size: 2, driftAngle: 30, delay: '9s', duration: '28s' },
  { id: 4, left: '65%', top: '35%', size: 3, driftAngle: -45, delay: '12s', duration: '25s' },
  { id: 5, left: '80%', top: '65%', size: 2, driftAngle: 0, delay: '15s', duration: '27s' },
];

// Sub-tabs for Universal Background
const BACKGROUND_SUB_TABS = [
  { id: 'current', name: 'Current Background', icon: '🌌' },
  { id: 'planet', name: 'Planet Background', icon: '🪐' },
];

function UniversalBackgroundAdmin() {
  const [activeSubTab, setActiveSubTab] = useState<'current' | 'planet'>('current');
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get current site settings to know which background is active
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const setBackgroundType = useMutation(api.siteSettings.setBackgroundType);

  // Current active background from settings
  const currentBackgroundType = siteSettings?.backgroundType ?? 'current';
  const isActiveBackground = activeSubTab === currentBackgroundType;

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  const effectiveIsMobile = mounted ? isMobile : false;

  const openFullScreenPreview = () => {
    if (activeSubTab === 'current') {
      window.open('/admin/background-preview', '_blank', 'noopener,noreferrer');
    } else {
      window.open('/admin/planet-background-preview', '_blank', 'noopener,noreferrer');
    }
  };

  const handleActivateBackground = async () => {
    setIsUpdating(true);
    try {
      await setBackgroundType({ backgroundType: activeSubTab });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌌</span>
            <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Universal Background</h3>
            <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">
              {currentBackgroundType === 'current' ? 'STARS ACTIVE' : 'PLANET ACTIVE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isActiveBackground && (
              <button
                onClick={handleActivateBackground}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/30 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/40 transition-colors uppercase tracking-wider text-sm font-bold disabled:opacity-50"
              >
                {isUpdating ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Activate This Background
              </button>
            )}
            <button
              onClick={openFullScreenPreview}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors uppercase tracking-wider text-sm font-bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Full Screen
            </button>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex gap-2 mb-6">
          {BACKGROUND_SUB_TABS.map((tab: any) => {
            const isCurrentlyActive = tab.id === currentBackgroundType;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as 'current' | 'planet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                    : 'bg-black/40 text-gray-400 border border-gray-700 hover:bg-black/60 hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
                {isCurrentlyActive && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-600/50 text-green-300 text-[10px] rounded uppercase">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Background Content */}
        {activeSubTab === 'current' && (
          <>
            <p className="text-gray-400 mb-6">
              The Universal Background is rendered across all pages of the site. It includes animated stars,
              drifting particles, and satellites creating a deep space atmosphere.
            </p>

        {/* Live Preview Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Live Preview</h4>
            <span className="text-gray-500 text-xs">(Scaled representation - click Full Screen for actual view)</span>
          </div>
          <div
            className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-yellow-500/30"
            style={{ background: 'linear-gradient(to bottom, #030712, #111827, #030712)' }}
          >
            {/* Industrial grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px)',
              }}
            />

            {/* Stars with twinkling */}
            {[...Array(50)].map((_: any, i: number) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${((i * 37 + 13) % 97) + 1}%`,
                  top: `${((i * 23 + 7) % 97) + 1}%`,
                  width: `${1 + (i % 3)}px`,
                  height: `${1 + (i % 3)}px`,
                  opacity: i % 2 === 0 ? 0.3 : (0.5 + (i % 4) * 0.15),
                  animation: i % 2 === 0 ? 'starTwinkle 2s ease-in-out infinite' : 'none',
                  animationDelay: `${(i % 8) * 0.5}s`,
                }}
              />
            ))}

            {/* Yellow particles with proper drift animation using CSS variables */}
            {PREVIEW_PARTICLES.map((particle: any) => (
              <div
                key={`particle-${particle.id}`}
                className="absolute bg-yellow-400 rounded-full"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: particle.left,
                  top: particle.top,
                  boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
                  animationName: 'linearDrift',
                  animationDuration: particle.duration,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationDelay: particle.delay,
                  '--drift-x': `${Math.cos(particle.driftAngle * Math.PI / 180) * 120}%`,
                  '--drift-y': `${Math.sin(particle.driftAngle * Math.PI / 180) * 120}%`,
                } as React.CSSProperties}
              />
            ))}

            {/* Satellites with proper edge-to-edge movement using CSS variables */}
            {PREVIEW_SATELLITES.map((satellite: any) => {
              const startX = parseFloat(satellite.startX);
              const startY = parseFloat(satellite.startY);
              const endX = parseFloat(satellite.endX);
              const endY = parseFloat(satellite.endY);
              const translateX = `${endX - startX}%`;
              const translateY = `${endY - startY}%`;

              return (
                <div
                  key={`satellite-${satellite.id}`}
                  className="absolute w-[3px] h-[3px] bg-white rounded-full"
                  style={{
                    left: satellite.startX,
                    top: satellite.startY,
                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.9)',
                    animationName: 'satelliteMove',
                    animationDuration: satellite.duration,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    animationDelay: satellite.delay,
                    '--translate-x': translateX,
                    '--translate-y': translateY,
                  } as React.CSSProperties}
                />
              );
            })}

            {/* Preview Label */}
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 border border-yellow-500/30 rounded text-xs text-yellow-400 uppercase tracking-wider">
              Live Preview
            </div>
          </div>
        </div>

        {/* Background Elements Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌟</span>
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Stars</span>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="text-white">100 stars</span>
              </div>
              <div className="flex justify-between">
                <span>Size Range:</span>
                <span className="text-white">1-3px</span>
              </div>
              <div className="flex justify-between">
                <span>Twinkling:</span>
                <span className="text-green-400">50% of stars</span>
              </div>
              <div className="flex justify-between">
                <span>Color:</span>
                <span className="text-white">White</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✨</span>
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Yellow Particles</span>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="text-white">12 particles</span>
              </div>
              <div className="flex justify-between">
                <span>Size Range:</span>
                <span className="text-white">1.5-3px</span>
              </div>
              <div className="flex justify-between">
                <span>Animation:</span>
                <span className="text-yellow-400">Linear drift</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-white">20-35s</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛰️</span>
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Satellites</span>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="text-white">4 satellites</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="text-white">3px</span>
              </div>
              <div className="flex justify-between">
                <span>Animation:</span>
                <span className="text-blue-400">Edge-to-edge movement</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-white">30-50s</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📐</span>
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Grid Overlay</span>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="text-white">Industrial grid</span>
              </div>
              <div className="flex justify-between">
                <span>Spacing:</span>
                <span className="text-white">50px</span>
              </div>
              <div className="flex justify-between">
                <span>Color:</span>
                <span className="text-yellow-400">Yellow (#fab617)</span>
              </div>
              <div className="flex justify-between">
                <span>Opacity:</span>
                <span className="text-white">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Base Gradient Info */}
        <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎨</span>
            <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Base Gradient</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-8 rounded" style={{ background: 'linear-gradient(to right, #030712, #111827, #030712)' }} />
            <div className="text-gray-400 text-sm">
              <code className="text-green-400">from-gray-950 via-gray-900 to-gray-950</code>
            </div>
          </div>
        </div>

        {/* Source File Info */}
        <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📁</span>
            <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Source File</span>
          </div>
          <code className="text-green-400 text-sm">src/components/GlobalBackground.tsx</code>
          <p className="text-gray-500 text-xs mt-2">
            This component is rendered in the root layout and appears on all pages except the landing page.
          </p>
        </div>
          </>
        )}

        {/* Planet Background Content */}
        {activeSubTab === 'planet' && (
          <>
            <p className="text-gray-400 mb-6">
              This is the background used on the landing page (root path). It features an animated canvas-based starfield
              with two layers of stars flying toward you, overlaid on the planet image.
            </p>

            {/* Live Preview Section - Uses actual StarField component */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Live Preview</h4>
                <span className="text-gray-500 text-xs">(Actual StarField component + background image)</span>
              </div>
              <div
                className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-yellow-500/30"
                style={{ background: '#000' }}
              >
                {/* Background image - exact same as LandingContainer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${getMediaUrl('/colored-bg-1.webp')})`,
                    backgroundSize: effectiveIsMobile ? '180%' : 'cover',
                    backgroundPosition: effectiveIsMobile ? 'center calc(50% + 80px)' : 'center',
                    opacity: 0.77,
                    zIndex: 0,
                  }}
                />

                {/* StarField - exact same component from landing page */}
                {mounted && (
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    <StarField />
                  </div>
                )}

                {/* Preview Label */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 border border-yellow-500/30 rounded text-xs text-yellow-400 uppercase tracking-wider z-10">
                  Live Preview
                </div>
              </div>
            </div>

            {/* Background Elements Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌟</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">StarField Layer 1</span>
                </div>
                <div className="text-gray-400 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="text-white">120 stars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white">Slow moving dots</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="text-blue-400">1.5 (slow drift)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="text-white">1-1.3px</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">StarField Layer 2</span>
                </div>
                <div className="text-gray-400 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="text-white">20 streaks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white">Fast streaking lines</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="text-red-400">30 (fast)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Line Width:</span>
                    <span className="text-white">6px</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🪐</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Planet Image</span>
                </div>
                <div className="text-gray-400 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="text-white">/colored-bg-1.webp</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size (Desktop):</span>
                    <span className="text-white">cover</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size (Mobile):</span>
                    <span className="text-white">180%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opacity:</span>
                    <span className="text-yellow-400">77%</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚙️</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Animation</span>
                </div>
                <div className="text-gray-400 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white">Canvas 2D</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frame Rate:</span>
                    <span className="text-green-400">60fps (fixed timestep)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Depth:</span>
                    <span className="text-white">1000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direction:</span>
                    <span className="text-blue-400">Toward viewer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Files Info */}
            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📁</span>
                <span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Source Files</span>
              </div>
              <div className="space-y-2">
                <div>
                  <code className="text-green-400 text-sm">src/components/StarField.tsx</code>
                  <p className="text-gray-500 text-xs mt-1">Canvas-based animated starfield with two layers</p>
                </div>
                <div>
                  <code className="text-green-400 text-sm">src/app/landing-v2/components/LandingContainer.tsx</code>
                  <p className="text-gray-500 text-xs mt-1">Container with background image positioning</p>
                </div>
                <div>
                  <code className="text-green-400 text-sm">public/colored-bg-1.webp</code>
                  <p className="text-gray-500 text-xs mt-1">Planet/space background image</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Data system definitions
const DATA_SYSTEMS = [
  { id: 'mek-systems', name: 'Mek Systems', icon: '⚙️', implemented: true },
  { id: 'mech-power-chips', name: 'Mech Power Chips', icon: '⚡', implemented: false },
  { id: 'universal-chips', name: 'Universal Power Chips', icon: '🔮', implemented: true },
  { id: 'buff-categories', name: 'Buff Categories', icon: '✨', implemented: true },
  { id: 'buff-categories-v2', name: 'Buff Categories V2', icon: '⚡', implemented: true },
  { id: 'story-climb-mechanics', name: 'Story Climb Mechanics', icon: '🏔️', implemented: false },
  { id: 'daily-recipes', name: 'Daily Recipes (Universal Chips)', icon: '📖', implemented: false },
  { id: 'salvage-materials', name: 'Salvage Materials', icon: '🔧', implemented: false },
  { id: 'circuitry-costs', name: 'Circuitry', icon: '💰', implemented: false },
  { id: 'mech-chip-recipes', name: 'Mech Chip Crafting Recipes', icon: '🔨', implemented: false },
  { id: 'single-missions', name: 'Single Missions Formulation', icon: '🎯', implemented: false },
  { id: 'global-game-data', name: 'Global Game Data', icon: '🌐', implemented: true },
  { id: 'market-system', name: 'Market', icon: '🏪', implemented: true },
  { id: 'offers-system', name: 'Offers System', icon: '💬', implemented: true },
  { id: 'variations', name: 'Variations', icon: '🎨', implemented: false },
  { id: 'jobs-system', name: 'Jobs', icon: '💼', implemented: true },
  { id: 'gold-backup-system', name: 'Gold Backup System', icon: '💾', implemented: true },
  { id: 'wallet-management', name: 'Player Management', icon: '👥', implemented: true },
  { id: 'port-monitor', name: 'Port Monitor', icon: '🔌', implemented: true },
  { id: 'sourcekey-migration', name: 'SourceKey Migration', icon: '🔧', implemented: true },
  { id: 'claude-manager', name: 'Claude Manager', icon: '🤖', implemented: true },
  { id: 'notification-system', name: 'Notification System', icon: '🔔', implemented: false },
  { id: 'nft-admin', name: 'NFT', icon: '🎨', implemented: true },
  { id: 'route-config', name: 'Route Configuration', icon: '🗺️', implemented: true },
  { id: 'overlay-editor', name: 'Overlay Editor', icon: '🎯', implemented: true },
  { id: 'navigation-preview', name: 'Navigation', icon: '🧭', implemented: true },
  { id: 'components', name: 'Components', icon: '🧩', implemented: true },
  { id: 'deployments', name: 'Deployments', icon: '🚀', implemented: true },
  { id: 'new-styling', name: 'Space Age Style', icon: '🎨', implemented: true },
  { id: 'messaging-system', name: 'Messaging System', icon: '💬', implemented: true },
  { id: 'rarity-bias', name: 'Rarity Bias', icon: '📊', implemented: true },
  { id: 'universal-background', name: 'Universal Background', icon: '🌌', implemented: true },
  { id: 'coach-marks', name: 'Coach Marks', icon: '🎯', implemented: true }
];

export default function AdminMasterDataPage() {
  const convex = useConvex();

  // DUAL DATABASE CLIENTS - Smart Environment Detection
  // On localhost: CONVEX_URL = Trout, STURGEON_URL = Sturgeon (dual mode)
  // On production: CONVEX_URL = Sturgeon, STURGEON_URL = undefined (single mode)
  const mainUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const secondaryUrl = process.env.NEXT_PUBLIC_STURGEON_URL;

  // Detect which database the main URL points to
  const mainIsSturgeon = mainUrl.includes('sturgeon');
  const mainIsTrout = mainUrl.includes('trout');

  // Smart client setup based on environment
  // If main is Trout (localhost): troutClient = main, sturgeonClient = secondary
  // If main is Sturgeon (production): sturgeonClient = main, troutClient = secondary (if available)
  const [mainClient] = useState(() => new ConvexHttpClient(mainUrl));
  const [secondaryClient] = useState(() => secondaryUrl ? new ConvexHttpClient(secondaryUrl) : null);

  // Assign clients based on detected environment
  const troutClient = mainIsTrout ? mainClient : (secondaryUrl?.includes('trout') ? secondaryClient : null);
  const sturgeonClient = mainIsSturgeon ? mainClient : (secondaryUrl?.includes('sturgeon') ? secondaryClient : null);

  // Legacy alias for backwards compatibility
  const httpClient = mainClient;

  // Detect connected database names
  const mainDeployment = mainUrl.split("//")[1]?.split(".")[0] || "unknown";
  const secondaryDeployment = secondaryUrl?.split("//")[1]?.split(".")[0] || "not-configured";

  // Determine actual deployment names for each database
  const troutDeployment = mainIsTrout ? mainDeployment : (secondaryUrl?.includes('trout') ? secondaryDeployment : "not-configured");
  const sturgeonDeployment = mainIsSturgeon ? mainDeployment : (secondaryUrl?.includes('sturgeon') ? secondaryDeployment : "not-configured");

  // Legacy variables for backwards compatibility
  const convexUrl = mainUrl;
  const deploymentName = mainDeployment;
  const isProduction = mainIsSturgeon;
  const databaseLabel = mainDeployment;

  // Check if we have dual database access
  const hasDualDatabase = (troutClient !== null) && (sturgeonClient !== null);
  const hasOnlyTrout = troutClient !== null && sturgeonClient === null;
  const hasOnlySturgeon = sturgeonClient !== null && troutClient === null;

  // DUAL DATABASE SETTINGS
  const [troutSettings, setTroutSettings] = useState<any>(null);
  const [sturgeonSettings, setSturgeonSettings] = useState<any>(null);
  const [troutLoading, setTroutLoading] = useState(true);
  const [sturgeonLoading, setSturgeonLoading] = useState(true);

  // Legacy alias (points to main database)
  const dbSettings = mainIsSturgeon ? sturgeonSettings : troutSettings;
  const setDbSettings = mainIsSturgeon ? setSturgeonSettings : setTroutSettings;
  const dbLoading = mainIsSturgeon ? sturgeonLoading : troutLoading;

  // Portal mounting state
  const [mounted, setMounted] = useState(false);

  // Fetch settings from available databases
  useEffect(() => {
    async function fetchTroutSettings() {
      if (!troutClient) {
        setTroutLoading(false);
        return;
      }
      try {
        const settings = await troutClient.query(api.siteSettings.getSiteSettings);
        setTroutSettings(settings);
      } catch (error) {
        console.error('[Admin] Error fetching Trout settings:', error);
      } finally {
        setTroutLoading(false);
      }
    }

    async function fetchSturgeonSettings() {
      if (!sturgeonClient) {
        setSturgeonLoading(false);
        return;
      }
      try {
        const settings = await sturgeonClient.query(api.siteSettings.getSiteSettings);
        setSturgeonSettings(settings);
      } catch (error) {
        console.error('[Admin] Error fetching Sturgeon settings:', error);
      } finally {
        setSturgeonLoading(false);
      }
    }

    fetchTroutSettings();
    fetchSturgeonSettings();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchTroutSettings();
      fetchSturgeonSettings();
    }, 5000);

    return () => clearInterval(interval);
  }, [troutClient, sturgeonClient]);

  // Set mounted state for portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Site settings for current database (using default convex client)
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const toggleLandingPage = useMutation(api.siteSettings.toggleLandingPage);
  const toggleLocalhostBypass = useMutation(api.siteSettings.toggleLocalhostBypass);
  const toggleMaintenanceMode = useMutation(api.siteSettings.toggleMaintenanceMode);

  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  // Initialize with static value to avoid hydration mismatch
  // Load from localStorage after mount (client-side only)
  const [activeTab, setActiveTab] = useState<string>('wallet-management');
  const [storyClimbSubTab, setStoryClimbSubTab] = useState<string>('difficulty-subsystem');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showGameDataLightbox, setShowGameDataLightbox] = useState(false);
  const [minimizedTabs, setMinimizedTabs] = useState<Set<string>>(new Set());
  const [tabOrder, setTabOrder] = useState<string[]>(DATA_SYSTEMS.map((sys: any) => sys.id));
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [systemCompletion, setSystemCompletion] = useState<Record<string, 'incomplete' | 'in-progress' | 'complete'>>({});

  // Save system state
  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Pages dropdown state
  const [showPagesDropdown, setShowPagesDropdown] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [favoritePages, setFavoritePages] = useState<string[]>([]);

  // Load favorite pages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adminFavoritePages');
    if (saved) {
      try {
        setFavoritePages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load favorite pages:', e);
      }
    }
  }, []);

  // Toggle favorite and persist to localStorage
  const toggleFavorite = (path: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the copy URL action
    setFavoritePages(prev => {
      const newFavorites = prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path];
      localStorage.setItem('adminFavoritePages', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // List of important pages for quick access
  const QUICK_ACCESS_PAGES = [
    { name: 'Home (Triangle + Slots)', path: '/home', category: 'Main' },
    { name: 'Landing Page', path: '/', category: 'Main' },
    { name: 'Corporation', path: '/corp/demo_wallet_123', category: 'Main' },
    { name: 'Essence Market', path: '/essence-market', category: 'Main' },
    { name: 'Federation', path: '/federation', category: 'Main' },
    { name: 'Profile', path: '/profile', category: 'Main' },
    { name: 'Crafting', path: '/crafting', category: 'Main' },
    { name: 'Contracts', path: '/contracts', category: 'Contracts' },
    { name: 'Single Missions', path: '/contracts/single-missions', category: 'Contracts' },
    { name: 'Story Climb', path: '/scrap-yard/story-climb', category: 'Contracts' },
    { name: 'Cirutree (Talent)', path: '/cirutree', category: 'Systems' },
    { name: 'Talent Builder', path: '/talent-builder', category: 'Systems' },
    { name: 'Shop', path: '/shop', category: 'Systems' },
    { name: 'Achievements', path: '/achievements', category: 'Systems' },
    { name: 'Leaderboard', path: '/leaderboard', category: 'Systems' },
    { name: 'Search', path: '/search', category: 'Systems' },
    { name: 'Mek Layouts', path: '/mek-layouts', category: 'Systems' },
    { name: 'Admin', path: '/admin', category: 'Admin' },
    { name: 'Admin Users', path: '/admin/users', category: 'Admin' },
  ];

  const copyPageUrl = (path: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3200';
    const fullUrl = `${baseUrl}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(path);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPagesDropdown && !target.closest('[data-pages-dropdown]')) {
        setShowPagesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPagesDropdown]);

  // Market configuration state
  const [marketConfig, setMarketConfig] = useState({
    durationCosts: {
      '1': 100,
      '3': 200,
      '7': 500,
      '14': 800,
      '30': 1500
    },
    baseListingFee: 2,
    minListingPrice: 1,
    minEssenceAmount: 0.1
  });

  // Variation buff mutations
  const applyBuffsToVariations = useMutation(api.variationBuffs.applyBuffsToVariations);
  const saveBuffConfiguration = useMutation(api.variationBuffs.saveBuffConfiguration);
  const buffConfig = useQuery(api.variationBuffs.getBuffConfiguration);
  const variationBuffs = useQuery(api.variationBuffs.getVariationBuffs);

  // Tenure configuration query
  const tenureBaseRateData = useQuery(api.tenureConfig.getBaseRate);
  const tenurePerSecond = tenureBaseRateData?.baseRate || 1.0;

  // Navigation Preview State (must be declared before useQuery that uses it)
  const [selectedNavigationOverlay, setSelectedNavigationOverlay] = useState<string>('');
  const [navigationScale, setNavigationScale] = useState<number>(1);
  const [navigationStatusMessage, setNavigationStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Duration configuration queries and mutations
  const saveDurationConfig = useMutation(api.durationConfigs.saveDurationConfig);
  const updateDurationConfig = useMutation(api.durationConfigs.updateDurationConfig);
  const deployDurationConfig = useMutation(api.durationConfigs.deployDurationConfig);
  const deleteDurationConfig = useMutation(api.durationConfigs.deleteDurationConfig);
  const durationConfigsList = useQuery(api.durationConfigs.listDurationConfigs);
  const activeDurationConfig = useQuery(api.durationConfigs.getActiveDurationConfig);
  const allOverlays = useQuery(api.overlays.listOverlays);
  const selectedOverlayData = useQuery(
    api.overlays.getOverlay,
    selectedNavigationOverlay ? { imageKey: selectedNavigationOverlay } : "skip"
  );
  const saveNavigationConfig = useMutation(api.navigation.saveNavigationConfig);
  const deployNavigation = useMutation(api.navigation.deployNavigation);
  const deactivateNavigation = useMutation(api.navigation.deactivateNavigation);
  const navigationConfig = useQuery(api.navigation.getNavigationConfig);
  const activeNavigationConfig = useQuery(api.navigation.getActiveNavigationConfig);
  const [selectedConfigName, setSelectedConfigName] = useState<string>('');
  const [configNameInput, setConfigNameInput] = useState<string>('');
  const [durationConfigAutoLoaded, setDurationConfigAutoLoaded] = useState(false);

  // Variations System State
  const [variationsImageFolder, setVariationsImageFolder] = useState('');
  const [variationsSubSections, setVariationsSubSections] = useState<Set<string>>(new Set());
  const [buffPercentages, setBuffPercentages] = useState({
    minPercent: 5,
    maxPercent: 50,
    curveType: 'linear' as 'linear' | 'exponential' | 'logarithmic',
    curveFactor: 1.5
  });
  const [variationSearch, setVariationSearch] = useState('');
  const [selectedVariation, setSelectedVariation] = useState<{ name: string; rank: number; category: string } | null>(null);

  // Jobs System State
  const [slotsSubTab, setSlotsSubTab] = useState<'job-builder' | 'tenure-config'>('job-builder');
  const [selectedSlotType, setSelectedSlotType] = useState<'basic' | 'advanced' | 'master'>('basic');
  const [slotsConfig, setSlotsConfig] = useState({
    basic: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    advanced: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    master: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [slotRoundingOption, setSlotRoundingOption] = useState<10 | 100 | 1000>(10);
  const [slotCurveFactor, setSlotCurveFactor] = useState<number>(1.0); // 1.0 = linear, >1 = exponential

  // Slot Configuration Save/Load State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Component demo states
  const [mechanicalToggleChecked, setMechanicalToggleChecked] = useState(false);
  const [powerSwitchToggleChecked, setPowerSwitchToggleChecked] = useState(false);
  const [radialSwitchIndex, setRadialSwitchIndex] = useState(0);

  // Query saved slot configurations
  const savedConfigurations = useQuery(api.slotConfigurations.listSlotConfigurations);

  // Mutations for save/load/delete
  const saveConfiguration = useMutation(api.slotConfigurations.saveSlotConfiguration);
  const loadConfiguration = useMutation(api.slotConfigurations.loadSlotConfiguration);
  const deleteConfiguration = useMutation(api.slotConfigurations.deleteSlotConfiguration);

  // Page Loader Toggle State - Separate for Localhost and Production
  const [pageLoaderDisabledLocalhost, setPageLoaderDisabledLocalhost] = useState(false);
  const [pageLoaderDisabledProduction, setPageLoaderDisabledProduction] = useState(false);
  const [loaderStatusMessage, setLoaderStatusMessage] = useState<{ type: 'success' | 'info', text: string } | null>(null);

  // Production Bypass Links
  const [showBypassLinks, setShowBypassLinks] = useState(false);
  const BYPASS_SECRET = 'mektycoon2025';
  const PRODUCTION_URL = 'https://mek.overexposed.io';
  const BYPASS_LINKS = [
    { name: 'Landing Page', path: '/' },
    { name: 'Home (Hub)', path: '/home' },
    { name: 'Profile', path: '/profile' },
    { name: 'Contracts', path: '/contracts' },
    { name: 'NFT Phases', path: '/landing-v2' },
    { name: 'Essence Market', path: '/essence-market' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Admin Panel', path: '/admin' },
  ];

  // Client-side mounting check for portal
  useEffect(() => {
    setMounted(true);

    // Load page loader preferences from localStorage
    if (typeof window !== 'undefined') {
      const storedLocalhost = localStorage.getItem('disablePageLoaderLocalhost');
      const storedProduction = localStorage.getItem('disablePageLoaderProduction');
      setPageLoaderDisabledLocalhost(storedLocalhost === 'true');
      setPageLoaderDisabledProduction(storedProduction === 'true');
    }
  }, []);

  // Interpolate slot values between first and last
  const interpolateSlotValues = () => {
    const firstValue = slotsConfig[selectedSlotType][0];
    const lastValue = slotsConfig[selectedSlotType][8];

    const newValues = Array.from({ length: 9 }, (_, index) => {
      if (index === 0) return firstValue;
      if (index === 8) return lastValue;

      // Exponential interpolation based on curve factor
      const t = index / 8; // Progress from 0 to 1
      const curvedT = Math.pow(t, slotCurveFactor); // Apply exponential curve
      const interpolated = firstValue + (lastValue - firstValue) * curvedT;

      // Round to selected option
      const rounded = Math.round(interpolated / slotRoundingOption) * slotRoundingOption;
      return rounded;
    });

    setSlotsConfig(prev => ({
      ...prev,
      [selectedSlotType]: newValues
    }));
  };

  // Handle save configuration
  const handleSaveConfiguration = async () => {
    if (!saveName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    try {
      await saveConfiguration({
        name: saveName.trim(),
        basicSlot: slotsConfig.basic,
        advancedSlot: slotsConfig.advanced,
        masterSlot: slotsConfig.master,
        curveFactor: slotCurveFactor,
        roundingOption: slotRoundingOption,
      });

      setShowSaveModal(false);
      setSaveName('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle load configuration
  const handleLoadConfiguration = async (configId: any) => {
    try {
      const config = savedConfigurations?.find((c: any) => c._id === configId);
      if (!config) {
        alert('Configuration not found');
        return;
      }

      // Update local state with saved values
      setSlotsConfig({
        basic: config.basicSlot,
        advanced: config.advancedSlot,
        master: config.masterSlot,
      });
      setSlotCurveFactor(config.curveFactor);
      setSlotRoundingOption(config.roundingOption as 10 | 100 | 1000);

      // Mark as active in database
      await loadConfiguration({ configId });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      alert(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle delete configuration
  const handleDeleteConfiguration = async (configId: any, configName: string) => {
    if (!confirm(`Are you sure you want to delete "${configName}"?`)) {
      return;
    }

    try {
      await deleteConfiguration({ configId, setOtherActive: true });
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Lock body scroll when save modal is open
  useEffect(() => {
    if (showSaveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSaveModal]);

  // Create ordered DATA_SYSTEMS array based on saved order
  const orderedDataSystems = useMemo(() => {
    return tabOrder
      .map((id: any) => DATA_SYSTEMS.find((sys: any) => sys.id === id))
      .filter((sys): sys is typeof DATA_SYSTEMS[0] => sys !== undefined);
  }, [tabOrder]);

  // Update buff percentages from database when loaded
  useEffect(() => {
    if (buffConfig) {
      setBuffPercentages({
        minPercent: buffConfig.minPercent,
        maxPercent: buffConfig.maxPercent,
        curveType: buffConfig.curveType,
        curveFactor: buffConfig.curveFactor
      });
    }
  }, [buffConfig]);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('admin-master-data-active-tab', activeTab);
    } catch (error) {
      console.error('Failed to save active tab to localStorage:', error);
    }
  }, [activeTab]);

  // Auto-load the most recent duration configuration
  useEffect(() => {
    const loadMostRecentConfig = async () => {
      if (!durationConfigAutoLoaded && durationConfigsList && durationConfigsList.length > 0 && convex) {
        // Find the most recent config (first in the list since they're sorted by creation time desc)
        const mostRecentConfig = durationConfigsList[0];

        try {
          const loadedConfig = await convex.query(api.durationConfigs.loadDurationConfig, {
            name: mostRecentConfig.name
          });

          if (loadedConfig) {
            setDurationSettings({
              normal: loadedConfig.normal,
              challenger: loadedConfig.challenger,
              miniboss: loadedConfig.miniboss,
              event: loadedConfig.event,
              finalboss: loadedConfig.finalboss,
            });
            setSelectedConfigName(mostRecentConfig.name);
            setConfigNameInput(mostRecentConfig.name);
            setDurationConfigAutoLoaded(true);
          }
        } catch (error) {
          console.error('Failed to auto-load duration configuration:', error);
        }
      }
    };

    loadMostRecentConfig();
  }, [durationConfigsList, durationConfigAutoLoaded, convex]);


  // Load variations folder path and active tab from localStorage on mount
  useEffect(() => {
    // Load active tab (fixes hydration mismatch)
    const savedTab = localStorage.getItem('admin-master-data-active-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }

    const savedPath = localStorage.getItem('variationsImageFolder');
    if (savedPath) {
      setVariationsImageFolder(savedPath);
    }

    // Load minimized tabs
    const savedMinimized = localStorage.getItem('adminMinimizedTabs');
    if (savedMinimized) {
      try {
        const parsed = JSON.parse(savedMinimized);
        setMinimizedTabs(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse minimized tabs:', e);
      }
    }

    // Load tab order
    const savedOrder = localStorage.getItem('adminTabOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Validate that all current tabs are in the saved order
        const currentTabIds = DATA_SYSTEMS.map((sys: any) => sys.id);
        const validOrder = parsed.filter((id: string) => currentTabIds.includes(id));
        // Add any new tabs that weren't in the saved order
        const missingTabs = currentTabIds.filter((id: any) => !validOrder.includes(id));
        setTabOrder([...validOrder, ...missingTabs]);
      } catch (e) {
        console.error('Failed to parse tab order:', e);
      }
    }
  }, []);

  // Save variations folder path when it changes
  const handleVariationsFolderChange = (path: string) => {
    setVariationsImageFolder(path);
    localStorage.setItem('variationsImageFolder', path);
  };

  // Minimize/Restore tab handlers
  const handleMinimizeTab = (tabId: string) => {
    const newMinimized = new Set(minimizedTabs);
    newMinimized.add(tabId);
    setMinimizedTabs(newMinimized);
    localStorage.setItem('adminMinimizedTabs', JSON.stringify(Array.from(newMinimized)));

    // If we're minimizing the active tab, switch to the first non-minimized tab
    if (activeTab === tabId) {
      const firstVisibleTab = orderedDataSystems.find((sys: any) => !newMinimized.has(sys.id));
      if (firstVisibleTab) {
        setActiveTab(firstVisibleTab.id);
      }
    }
  };

  const handleRestoreTab = (tabId: string) => {
    const newMinimized = new Set(minimizedTabs);
    newMinimized.delete(tabId);
    setMinimizedTabs(newMinimized);
    localStorage.setItem('adminMinimizedTabs', JSON.stringify(Array.from(newMinimized)));

    // Switch to the restored tab
    setActiveTab(tabId);
  };

  // Drag-and-drop handlers for tab reordering
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();

    if (!draggedTabId || draggedTabId === targetTabId) {
      setDraggedTabId(null);
      return;
    }

    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(draggedTabId);
    const targetIndex = newOrder.indexOf(targetTabId);

    // Remove dragged item and insert at new position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTabId);

    setTabOrder(newOrder);
    localStorage.setItem('adminTabOrder', JSON.stringify(newOrder));
    setDraggedTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };

  // Navigation configuration handlers
  const handleSaveNavigationConfig = async () => {
    if (!selectedNavigationOverlay) {
      setNavigationStatusMessage({ type: 'error', text: 'Please select an overlay first' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
      return;
    }

    try {
      setNavigationStatusMessage({ type: 'info', text: 'Saving configuration...' });
      const result = await saveNavigationConfig({
        overlayImageKey: selectedNavigationOverlay,
        scale: navigationScale,
      });
      setNavigationStatusMessage({
        type: 'success',
        text: `Configuration ${result.action}! Click "Deploy to Site" to make it active.`
      });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save navigation config:', error);
      setNavigationStatusMessage({ type: 'error', text: 'Failed to save configuration' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  const handleDeployNavigation = async () => {
    try {
      setNavigationStatusMessage({ type: 'info', text: 'Deploying navigation...' });
      const result = await deployNavigation({});
      setNavigationStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to deploy navigation:', error);
      setNavigationStatusMessage({
        type: 'error',
        text: error.message || 'Failed to deploy navigation'
      });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  const handleDeactivateNavigation = async () => {
    try {
      setNavigationStatusMessage({ type: 'info', text: 'Deactivating navigation...' });
      const result = await deactivateNavigation({});
      setNavigationStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => setNavigationStatusMessage(null), 5000);
    } catch (error) {
      console.error('Failed to deactivate navigation:', error);
      setNavigationStatusMessage({ type: 'error', text: 'Failed to deactivate navigation' });
      setTimeout(() => setNavigationStatusMessage(null), 3000);
    }
  };

  // Handle creating a new save
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: 'info', text: 'Creating save backup...' });

    try {
      const now = new Date();
      const saveName = `Save_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Save created successfully! ${result.filesCount} files backed up.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle git commit
  const handleCommit = async () => {
    setIsCommitting(true);
    setMessage({ type: 'info', text: 'Creating git commit...' });

    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Save state: ${new Date().toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Git commit created successfully! ${result.message}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create git commit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating commit: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsCommitting(false);
    }
  };

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  // Duration Configuration State
  const [selectedNodeType, setSelectedNodeType] = useState<'normal' | 'challenger' | 'miniboss' | 'event' | 'finalboss'>('normal');
  const [durationSettings, setDurationSettings] = useState({
    normal: {
      min: { days: 0, hours: 0, minutes: 0, seconds: 30 },
      max: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      curve: 1.5
    },
    challenger: {
      min: { days: 0, hours: 0, minutes: 3, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 8, seconds: 0 },
      curve: 1.5
    },
    miniboss: {
      min: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 15, seconds: 0 },
      curve: 1.5
    },
    event: {
      min: { days: 0, hours: 0, minutes: 5, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 50, seconds: 0 },
      curve: 1.5
    },
    finalboss: {
      min: { days: 0, hours: 0, minutes: 10, seconds: 0 },
      max: { days: 0, hours: 0, minutes: 30, seconds: 0 },
      curve: 1.5
    }
  });

  // Helper function to convert time components to total seconds
  const timeToSeconds = (time: { days: number, hours: number, minutes: number, seconds: number }): number => {
    return (time.days * 86400) + (time.hours * 3600) + (time.minutes * 60) + time.seconds;
  };

  // Helper function to format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  };

  const toggleSection = (sectionId: string) => {
    // List of known subsection IDs
    const subsectionIds = [
      'mek-base-config',
      'mek-talent-tree',
      'mek-detail-viewer',
      'difficulty-subsystem',
      'duration-subsystem',
      'buff-categories-sub',
      'variations-image-sync',
      'variations-search',
      'variations-buff-assignment'
    ];

    const isSubsection = subsectionIds.includes(sectionId);

    if (isSubsection) {
      // For subsections, keep the parent section open and just toggle the subsection
      const newExpanded = new Set(expandedSections);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      setExpandedSections(newExpanded);
    } else {
      // For main sections, only allow one open at a time
      const newExpanded = new Set<string>();
      if (!expandedSections.has(sectionId)) {
        newExpanded.add(sectionId);
        // Also close all subsections when closing a main section
      }
      setExpandedSections(newExpanded);
    }
  };

  const navigateToSection = (sectionId: string) => {
    // Only expand this section (close others)
    const newExpanded = new Set<string>();
    newExpanded.add(sectionId);
    setExpandedSections(newExpanded);

    // Scroll to section after a brief delay for expansion animation
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSystemRightClick = (e: React.MouseEvent, systemId: string) => {
    e.preventDefault();
    // Cycle through states: incomplete -> in-progress -> complete -> incomplete
    setSystemCompletion(prev => {
      const current = prev[systemId];
      let next: 'incomplete' | 'in-progress' | 'complete' = 'incomplete';
      if (current === 'incomplete') next = 'in-progress';
      else if (current === 'in-progress') next = 'complete';
      else next = 'incomplete';
      return { ...prev, [systemId]: next };
    });
  };

  const handleTogglePageLoaderLocalhost = () => {
    const newValue = !pageLoaderDisabledLocalhost;
    setPageLoaderDisabledLocalhost(newValue);

    if (typeof window !== 'undefined') {
      localStorage.setItem('disablePageLoaderLocalhost', newValue.toString());
    }

    setLoaderStatusMessage({
      type: 'success',
      text: newValue
        ? 'Page loader DISABLED for localhost. Refresh the page to see the change.'
        : 'Page loader ENABLED for localhost. Refresh the page to see the change.'
    });

    // Clear message after 5 seconds
    setTimeout(() => {
      setLoaderStatusMessage(null);
    }, 5000);
  };

  const handleTogglePageLoaderProduction = () => {
    const newValue = !pageLoaderDisabledProduction;
    setPageLoaderDisabledProduction(newValue);

    if (typeof window !== 'undefined') {
      localStorage.setItem('disablePageLoaderProduction', newValue.toString());
    }

    setLoaderStatusMessage({
      type: 'success',
      text: newValue
        ? 'Page loader DISABLED for production. Refresh the page to see the change.'
        : 'Page loader ENABLED for production. Refresh the page to see the change.'
    });

    // Clear message after 5 seconds
    setTimeout(() => {
      setLoaderStatusMessage(null);
    }, 5000);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8 relative z-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-orbitron tracking-wider">
              MASTER DATA SYSTEMS
            </h1>
            <p className="text-gray-400">Centralized procedural generation and game balance control</p>
          </div>

          {/* Quick Access Pages Dropdown */}
          <div className="relative" data-pages-dropdown>
            <button
              onClick={() => setShowPagesDropdown(!showPagesDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-600/30 hover:border-cyan-400 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-bold text-sm uppercase tracking-wider">Pages</span>
              <svg className={`w-4 h-4 transition-transform ${showPagesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showPagesDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl shadow-black/50 z-50 overflow-hidden">
                <div className="p-2 bg-cyan-900/20 border-b border-cyan-500/30">
                  <span className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Quick Access Pages</span>
                  <span className="text-xs text-gray-500 ml-2">(click to copy URL)</span>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                  {/* Favorites section - only show if there are favorites */}
                  {favoritePages.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-yellow-900/30 text-xs text-yellow-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <span>★</span> Favorites
                      </div>
                      {QUICK_ACCESS_PAGES
                        .filter((p: any) => favoritePages.includes(p.path))
                        .map((page: any) => (
                        <button
                          key={`fav-${page.path}`}
                          onClick={() => copyPageUrl(page.path)}
                          className="w-full px-3 py-2 text-left hover:bg-cyan-600/20 transition-colors flex items-center justify-between group bg-yellow-900/10"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleFavorite(page.path, e)}
                              className="text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Remove from favorites"
                            >
                              ★
                            </button>
                            <span className="text-sm text-gray-300 group-hover:text-cyan-300">{page.name}</span>
                          </div>
                          {copiedUrl === page.path ? (
                            <span className="text-xs text-green-400 font-bold">Copied!</span>
                          ) : (
                            <span className="text-xs text-gray-600 group-hover:text-cyan-500 font-mono">{page.path}</span>
                          )}
                        </button>
                      ))}
                      <div className="border-b border-gray-700 my-1" />
                    </>
                  )}
                  {/* All non-Admin pages without category headers */}
                  {QUICK_ACCESS_PAGES
                    .filter((p: any) => p.category !== 'Admin' && !favoritePages.includes(p.path))
                    .map((page: any) => (
                    <button
                      key={page.path}
                      onClick={() => copyPageUrl(page.path)}
                      className="w-full px-3 py-2 text-left hover:bg-cyan-600/20 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(page.path, e)}
                          className="text-gray-600 hover:text-yellow-400 transition-colors"
                          title="Add to favorites"
                        >
                          ☆
                        </button>
                        <span className="text-sm text-gray-300 group-hover:text-cyan-300">{page.name}</span>
                      </div>
                      {copiedUrl === page.path ? (
                        <span className="text-xs text-green-400 font-bold">Copied!</span>
                      ) : (
                        <span className="text-xs text-gray-600 group-hover:text-cyan-500 font-mono">{page.path}</span>
                      )}
                    </button>
                  ))}
                  {/* Admin section with header */}
                  <div className="px-3 py-1.5 bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider font-bold">
                    Admin
                  </div>
                  {QUICK_ACCESS_PAGES
                    .filter((p: any) => p.category === 'Admin' && !favoritePages.includes(p.path))
                    .map((page: any) => (
                    <button
                      key={page.path}
                      onClick={() => copyPageUrl(page.path)}
                      className="w-full px-3 py-2 text-left hover:bg-cyan-600/20 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleFavorite(page.path, e)}
                          className="text-gray-600 hover:text-yellow-400 transition-colors"
                          title="Add to favorites"
                        >
                          ☆
                        </button>
                        <span className="text-sm text-gray-300 group-hover:text-cyan-300">{page.name}</span>
                      </div>
                      {copiedUrl === page.path ? (
                        <span className="text-xs text-green-400 font-bold">Copied!</span>
                      ) : (
                        <span className="text-xs text-gray-600 group-hover:text-cyan-500 font-mono">{page.path}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-gray-800/50 border-t border-gray-700">
                  <button
                    onClick={() => setShowPagesDropdown(false)}
                    className="w-full text-xs text-gray-500 hover:text-gray-300 py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🐟 DATABASE CONTROLS - Adapts to available databases 🐟 */}
        <div className={`mb-4 grid gap-4 ${hasDualDatabase ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* STAGING (Trout) Panel - Only show if Trout is available */}
          {troutClient && (
            <div className={`p-3 bg-yellow-900/20 border-yellow-600/50 border rounded-lg ${hasOnlyTrout ? 'max-w-xl' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-yellow-400">🐟 STAGING</span>
                <span className="text-[10px] text-yellow-300">({troutDeployment})</span>
                {hasOnlyTrout && <span className="text-[10px] text-gray-500 ml-auto">(Development Mode)</span>}
              </div>
              {troutLoading ? (
                <p className="text-gray-400 text-xs">Loading...</p>
              ) : (
                <div className={hasOnlyTrout ? "grid grid-cols-3 gap-4" : "space-y-2"}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-300">Landing Page</span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={troutSettings?.landingPageEnabled ?? false}
                        onCheckedChange={async (enabled) => {
                          await troutClient.mutation(api.siteSettings.toggleLandingPage, { enabled });
                          const updated = await troutClient.query(api.siteSettings.getSiteSettings);
                          setTroutSettings(updated);
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${troutSettings?.landingPageEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                        {troutSettings?.landingPageEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-300">Localhost Bypass</span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={troutSettings?.localhostBypass ?? true}
                        onCheckedChange={async (enabled) => {
                          await troutClient.mutation(api.siteSettings.toggleLocalhostBypass, { enabled });
                          const updated = await troutClient.query(api.siteSettings.getSiteSettings);
                          setTroutSettings(updated);
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${troutSettings?.localhostBypass ? 'text-green-400' : 'text-gray-500'}`}>
                        {troutSettings?.localhostBypass ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-300 flex items-center gap-1">
                      <span className="text-[10px]">🚨</span> Maintenance
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={troutSettings?.maintenanceMode ?? false}
                        onCheckedChange={async (enabled) => {
                          const confirmed = window.confirm(
                            '🚨 STAGING MAINTENANCE MODE 🚨\n\n' +
                            `You are about to ${enabled ? 'ENABLE' : 'DISABLE'} maintenance mode on STAGING (Trout).\n\n` +
                            'Are you sure?'
                          );
                          if (!confirmed) return;
                          await troutClient.mutation(api.siteSettings.toggleMaintenanceMode, { enabled });
                          const updated = await troutClient.query(api.siteSettings.getSiteSettings);
                          setTroutSettings(updated);
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-orange-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${troutSettings?.maintenanceMode ? 'text-orange-400' : 'text-gray-500'}`}>
                        {troutSettings?.maintenanceMode ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTION (Sturgeon) Panel - Only show if Sturgeon is available */}
          {sturgeonClient && (
            <div className={`p-3 bg-green-900/20 border-green-600/50 border rounded-lg ${hasOnlySturgeon ? 'max-w-xl' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-green-400">🐟 PRODUCTION</span>
                <span className="text-[10px] text-green-300">({sturgeonDeployment})</span>
                {hasOnlySturgeon && <span className="text-[10px] text-gray-500 ml-auto">(Live Site)</span>}
              </div>
              {sturgeonLoading ? (
                <p className="text-gray-400 text-xs">Loading...</p>
              ) : (
                <div className={hasOnlySturgeon ? "grid grid-cols-3 gap-4" : "space-y-2"}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-300">Landing Page</span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={sturgeonSettings?.landingPageEnabled ?? false}
                        onCheckedChange={async (enabled) => {
                          const confirmed = window.confirm(
                            '⚠️ PRODUCTION CHANGE ⚠️\n\n' +
                            `You are about to ${enabled ? 'ENABLE' : 'DISABLE'} the landing page on PRODUCTION.\n\n` +
                            'This affects REAL USERS. Are you sure?'
                          );
                          if (!confirmed) return;
                          await sturgeonClient!.mutation(api.siteSettings.toggleLandingPage, { enabled });
                          const updated = await sturgeonClient!.query(api.siteSettings.getSiteSettings);
                          setSturgeonSettings(updated);
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${sturgeonSettings?.landingPageEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                        {sturgeonSettings?.landingPageEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-300">Localhost Bypass</span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={sturgeonSettings?.localhostBypass ?? true}
                        onCheckedChange={async (enabled) => {
                          const confirmed = window.confirm(
                            '⚠️ PRODUCTION CHANGE ⚠️\n\n' +
                            `You are about to ${enabled ? 'ENABLE' : 'DISABLE'} localhost bypass on PRODUCTION.\n\n` +
                            'Are you sure?'
                          );
                          if (!confirmed) return;
                          await sturgeonClient!.mutation(api.siteSettings.toggleLocalhostBypass, { enabled });
                          const updated = await sturgeonClient!.query(api.siteSettings.getSiteSettings);
                          setSturgeonSettings(updated);
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${sturgeonSettings?.localhostBypass ? 'text-green-400' : 'text-gray-500'}`}>
                        {sturgeonSettings?.localhostBypass ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-300 flex items-center gap-1">
                      <span className="text-[10px]">🚨</span> Maintenance
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={sturgeonSettings?.maintenanceMode ?? false}
                        onCheckedChange={async (enabled) => {
                          const confirmed = window.confirm(
                            '🚨🚨🚨 PRODUCTION MAINTENANCE MODE 🚨🚨🚨\n\n' +
                            `You are about to ${enabled ? 'ENABLE' : 'DISABLE'} maintenance mode on PRODUCTION (Sturgeon).\n\n` +
                            'This will redirect ALL REAL USERS to the maintenance page!\n\n' +
                            'ARE YOU ABSOLUTELY SURE?'
                          );
                          if (!confirmed) return;
                          await sturgeonClient!.mutation(api.siteSettings.toggleMaintenanceMode, { enabled });
                          const updated = await sturgeonClient!.query(api.siteSettings.getSiteSettings);
                          setSturgeonSettings(updated);
                          if (enabled) {
                            alert('🚨 PRODUCTION MAINTENANCE MODE ACTIVATED!\nAll users are being redirected to the maintenance page.');
                          } else {
                            alert('✓ Production maintenance mode deactivated.');
                          }
                        }}
                        className="w-9 h-5 bg-gray-700 rounded-full relative data-[state=checked]:bg-orange-500 transition-colors cursor-pointer"
                      >
                        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                      <span className={`text-[10px] font-bold w-6 ${sturgeonSettings?.maintenanceMode ? 'text-orange-400' : 'text-gray-500'}`}>
                        {sturgeonSettings?.maintenanceMode ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' :
            'bg-blue-900/20 border-blue-500 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Page Loader Toggles - Separate for Localhost and Production */}
        <div className="flex gap-4 mb-6">
          {/* Localhost Toggle */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 inline-flex items-center gap-3">
            <label htmlFor="page-loader-localhost" className="text-sm font-bold text-blue-400 cursor-pointer">
              Page Loader (Localhost)
            </label>
            <Switch.Root
              id="page-loader-localhost"
              checked={!pageLoaderDisabledLocalhost}
              onCheckedChange={handleTogglePageLoaderLocalhost}
              className="w-11 h-6 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
            <span className={`text-xs font-bold ${pageLoaderDisabledLocalhost ? 'text-red-400' : 'text-green-400'}`}>
              {pageLoaderDisabledLocalhost ? 'OFF' : 'ON'}
            </span>
          </div>

          {/* Production Toggle */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 inline-flex items-center gap-3">
            <label htmlFor="page-loader-production" className="text-sm font-bold text-blue-400 cursor-pointer">
              Page Loader (Production)
            </label>
            <Switch.Root
              id="page-loader-production"
              checked={!pageLoaderDisabledProduction}
              onCheckedChange={handleTogglePageLoaderProduction}
              className="w-11 h-6 bg-gray-700 rounded-full relative data-[state=checked]:bg-green-600 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
            <span className={`text-xs font-bold ${pageLoaderDisabledProduction ? 'text-red-400' : 'text-green-400'}`}>
              {pageLoaderDisabledProduction ? 'OFF' : 'ON'}
            </span>
          </div>

          {/* Production Bypass Links Button */}
          <button
            onClick={() => setShowBypassLinks(true)}
            className="bg-blue-900/50 border border-blue-600 hover:border-blue-400 rounded-xl px-4 py-2 text-sm font-bold text-blue-300 hover:text-white transition-all"
          >
            Production Bypass Links
          </button>
        </div>

        {/* Tab Navigation for All Systems */}
        <div className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {orderedDataSystems.filter((system: any) => !minimizedTabs.has(system.id)).map((system: any) => (
              <button
                key={system.id}
                draggable
                onDragStart={(e) => handleDragStart(e, system.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, system.id)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setActiveTab(system.id);
                  // Reset story climb sub-tab to default when switching to Story Climb Mechanics
                  if (system.id === 'story-climb-mechanics') {
                    setStoryClimbSubTab('difficulty-subsystem');
                  }
                  // Reset player management sub-tab to default when switching to Player Management
                  if (system.id === 'wallet-management') {
                  }
                  // Auto-expand all subsections for this system
                  const subsections = {
                    'mek-systems': ['mek-base-config', 'mek-talent-tree', 'mek-detail-viewer'],
                    'story-climb-mechanics': ['difficulty-subsystem', 'duration-subsystem'],
                    'variations': ['variations-image-sync', 'variations-search', 'variations-buff-assignment']
                  };
                  const sectionsToExpand = [system.id, ...(subsections[system.id as keyof typeof subsections] || [])];
                  setExpandedSections(new Set(sectionsToExpand));
                }}
                className={`group relative px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold cursor-move ${
                  draggedTabId === system.id
                    ? 'opacity-50 scale-95'
                    : activeTab === system.id
                    ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                    : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-yellow-500/50 hover:bg-yellow-900/20'
                }`}
              >
                <span className="mr-2">{system.icon}</span>
                {system.name}

                {/* Minimize button - appears on hover */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinimizeTab(system.id);
                  }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full bg-gray-700 hover:bg-red-500 flex items-center justify-center text-[10px] text-white cursor-pointer"
                  title="Minimize tab"
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          {/* Minimized Tabs Section */}
          {minimizedTabs.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Minimized:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {orderedDataSystems.filter((system: any) => minimizedTabs.has(system.id)).map((system: any) => (
                  <button
                    key={system.id}
                    onClick={() => handleRestoreTab(system.id)}
                    className="group relative w-6 h-6 rounded-full bg-gray-800/50 border border-gray-600/50 hover:border-yellow-500/50 hover:bg-yellow-900/20 transition-all flex items-center justify-center"
                    title={`Restore: ${system.name}`}
                  >
                    <span className="text-xs opacity-60 group-hover:opacity-100">{system.icon}</span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 border border-yellow-500/30 rounded text-xs text-yellow-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      {system.name}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-500/30"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Systems Sections */}
        <div className="space-y-4">
          {/* Mek Systems */}
          {activeTab === 'mek-systems' && (
          <div id="section-mek-systems" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
              <div className="p-4">
                <p className="text-gray-400 mb-4">Configure core Mek systems including talent trees and base success rates</p>

                {/* Mek Base Configuration Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-base-config')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Mek Base Configuration</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-base-config') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-base-config') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <MekBaseConfig />
                    </div>
                  )}
                </div>

                {/* Talent Tree Nodes Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-talent-tree')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌳</span>
                      <h4 className="text-sm font-semibold text-yellow-300">MEC Talent Tree Nodes</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-talent-tree') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-talent-tree') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Configure talent tree node buff values across different rarity tiers.
                        Set progression curves for gold, essence, XP, and other buff categories.
                      </p>
                      <MekTalentTreeConfig />
                    </div>
                  )}
                </div>

                {/* Mek Detail Viewer Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('mek-detail-viewer')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Mek Detail Viewer</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">ACTIVE</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('mek-detail-viewer') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('mek-detail-viewer') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Look up any Mek by number or rank to view detailed statistics including base gold rate,
                        variations, base success rate, and talent tree configuration.
                      </p>
                      <MekDetailViewer />
                    </div>
                  )}
                </div>

                {/* Additional Mek Systems can be added here */}
              </div>
          </div>
          )}

          {/* Mech Power Chips */}
          {activeTab === 'mech-power-chips' && (
          <div id="section-mech-power-chips" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
              <div className="p-4">
                <p className="text-gray-400 mb-4">Mech chip stats and rarity configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
          </div>
          )}

          {/* Universal Power Chips */}
          {activeTab === 'universal-chips' && (
          <div id="section-universal-chips" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('universal-chips')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <h3 className="text-xl font-bold text-yellow-400">Universal Power Chips</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('universal-chips') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('universal-chips') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Universal chip buff generation system with master ranges for all buff categories.
                  <span className="text-green-400 ml-2">✓ Migrated from chip-builder page</span>
                </p>
                <MasterRangeSystem
                  onApplyRanges={() => {
                    console.log('Universal chip ranges applied');
                  }}
                />
              </div>
            )}
          </div>
          )}

          {/* Buff Categories */}
          {activeTab === 'buff-categories' && (
          <div id="section-buff-categories" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('buff-categories')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <h3 className="text-xl font-bold text-yellow-400">Buff Categories</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('buff-categories') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('buff-categories') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Manage buff categories for chips, mechanisms, and game systems. Configure success rate curves and tier-specific buffs.
                </p>
                <BuffCategoriesAdmin />
              </div>
            )}
          </div>
          )}

          {/* Buff Categories V2 */}
          {activeTab === 'buff-categories-v2' && (
          <div id="section-buff-categories-v2" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('buff-categories-v2')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <h3 className="text-xl font-bold text-yellow-400">Buff Categories V2</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('buff-categories-v2') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('buff-categories-v2') && (
              <div className="p-4 border-t border-gray-700/50">
                <BuffCategoriesV2Admin />
              </div>
            )}
          </div>
          )}

          {/* Story Climb Mechanics */}
          {activeTab === 'story-climb-mechanics' && (
          <div id="section-story-climb-mechanics" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Unified system for story progression, events, mechanisms, bosses, and final bosses.
                  Controls how mechanisms are distributed across story nodes.
                </p>

                {/* Story Climb Sub-Tab Navigation */}
                <div className="bg-black/70 border-2 border-blue-500/30 rounded-lg p-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {STORY_CLIMB_SUBSECTIONS.map((subsection: any) => (
                      <button
                        key={subsection.id}
                        onClick={() => setStoryClimbSubTab(subsection.id)}
                        className={`px-3 py-1.5 rounded-lg border-2 transition-all text-xs font-semibold ${
                          storyClimbSubTab === subsection.id
                            ? 'border-blue-400 bg-blue-900/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-blue-500/50 hover:bg-blue-900/20'
                        }`}
                      >
                        <span className="mr-1.5">{subsection.icon}</span>
                        {subsection.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty System Configuration Sub-section */}
                {storyClimbSubTab === 'difficulty-subsystem' && (
                <div className="bg-black/70 border border-yellow-500/20 rounded p-4">
                      <p className="text-gray-400 text-sm mb-3">
                        Configure difficulty levels for missions: success thresholds, reward multipliers, and slot counts.
                        Controls how Easy, Medium, and Hard difficulties affect gameplay balance.
                      </p>
                      <DifficultyAdminConfig />
                </div>
                )}

                {/* Duration Configuration Sub-section */}
                {storyClimbSubTab === 'duration-subsystem' && (
                <div className="bg-black/70 border border-blue-500/20 rounded p-4">
                      <p className="text-gray-400 text-sm mb-4">
                        Set mission duration ranges for each node type. Durations ascend as you progress up the tree—shortest missions at the bottom, longest at the top.
                      </p>

                      {/* Node Type Selector */}
                      <div className="mb-6">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Select Node Type</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: 'normal', name: 'Normal Mechs', icon: '🤖' },
                            { id: 'challenger', name: 'Challenger Mechs', icon: '⚔️' },
                            { id: 'miniboss', name: 'Mini Bosses', icon: '👹' },
                            { id: 'event', name: 'Events', icon: '✨' },
                            { id: 'finalboss', name: 'Final Bosses', icon: '🐲' }
                          ].map((type: any) => (
                            <button
                              key={type.id}
                              onClick={() => setSelectedNodeType(type.id as any)}
                              className={`p-3 rounded-lg border transition-all text-center ${
                                selectedNodeType === type.id
                                  ? 'border-blue-400 bg-blue-900/30 text-blue-300'
                                  : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-blue-500/50'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div className="text-xs font-semibold">{type.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Settings for Selected Type */}
                      <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                        <h5 className="text-sm font-bold text-blue-300 mb-4">
                          {selectedNodeType === 'normal' && 'Normal Mechs Duration'}
                          {selectedNodeType === 'challenger' && 'Challenger Mechs Duration'}
                          {selectedNodeType === 'miniboss' && 'Mini Bosses Duration'}
                          {selectedNodeType === 'event' && 'Events Duration'}
                          {selectedNodeType === 'finalboss' && 'Final Bosses Duration'}
                        </h5>

                        <div className="space-y-4 mb-4">
                          {/* Min Duration */}
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Minimum Duration <span className="text-[10px] normal-case">(Bottom of tree - earliest)</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Days</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.days}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        days: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Hours</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.hours}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        hours: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="23"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Minutes</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.minutes}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        minutes: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Seconds</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].min.seconds}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      min: {
                                        ...prev[selectedNodeType].min,
                                        seconds: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Max Duration */}
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Maximum Duration <span className="text-[10px] normal-case">(Top of tree - latest)</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Days</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.days}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        days: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Hours</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.hours}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        hours: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="23"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Minutes</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.minutes}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        minutes: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Seconds</label>
                                <input
                                  type="number"
                                  value={durationSettings[selectedNodeType].max.seconds}
                                  onChange={(e) => setDurationSettings(prev => ({
                                    ...prev,
                                    [selectedNodeType]: {
                                      ...prev[selectedNodeType],
                                      max: {
                                        ...prev[selectedNodeType].max,
                                        seconds: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }))}
                                  min="0"
                                  max="59"
                                  className="w-full px-2 py-1.5 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Curve Adjustment Slider */}
                        <div className="mb-4">
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Interpolation Curve: {durationSettings[selectedNodeType].curve.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={durationSettings[selectedNodeType].curve}
                            onChange={(e) => setDurationSettings(prev => ({
                              ...prev,
                              [selectedNodeType]: {
                                ...prev[selectedNodeType],
                                curve: parseFloat(e.target.value)
                              }
                            }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>Linear (0.5)</span>
                            <span>Balanced (1.5)</span>
                            <span>Exponential (3.0)</span>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-blue-900/20 rounded p-3 border border-blue-500/20">
                          <p className="text-xs text-blue-300 mb-2">Duration Progression Preview:</p>
                          <div className="space-y-1">
                            {[0, 0.25, 0.5, 0.75, 1].map((progress: any) => {
                              const settings = durationSettings[selectedNodeType];
                              const minSeconds = timeToSeconds(settings.min);
                              const maxSeconds = timeToSeconds(settings.max);
                              const interpolated = Math.pow(progress, settings.curve);
                              const durationSeconds = Math.round(
                                minSeconds + (maxSeconds - minSeconds) * interpolated
                              );
                              return (
                                <div key={progress} className="flex justify-between text-[11px]">
                                  <span className="text-gray-400">
                                    {progress === 0 ? 'Bottom' : progress === 1 ? 'Top' : `${(progress * 100).toFixed(0)}% up`}:
                                  </span>
                                  <span className="text-blue-400 font-semibold">
                                    {formatDuration(durationSeconds)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Important Note */}
                        <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
                          <p className="text-[11px] text-yellow-400">
                            <strong>Important:</strong> Duration values ascend with tree progression. The first {selectedNodeType === 'event' ? 'event' : 'node'}
                            encountered will use the minimum duration, with subsequent ones progressively increasing toward the maximum based on their position in the tree.
                          </p>
                        </div>

                        {/* Configuration Management */}
                        <div className="mt-4 space-y-3">
                          {/* Config Name Input and Save/Update */}
                          <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
                            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                              Configuration Name
                            </label>
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={configNameInput}
                                onChange={(e) => setConfigNameInput(e.target.value)}
                                placeholder="Enter configuration name..."
                                className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm placeholder-gray-500"
                              />
                              <button
                                onClick={async () => {
                                  if (!configNameInput.trim()) {
                                    alert('Please enter a configuration name');
                                    return;
                                  }
                                  try {
                                    await saveDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                    alert(`Configuration "${configNameInput}" saved successfully!`);
                                    setSelectedConfigName(configNameInput);
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to save configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={async () => {
                                  if (!configNameInput.trim()) {
                                    alert('Please enter a configuration name');
                                    return;
                                  }
                                  try {
                                    await updateDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                    alert(`Configuration "${configNameInput}" updated successfully!`);
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to update configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors"
                              >
                                Update
                              </button>
                            </div>

                            {/* Load Configuration Dropdown */}
                            <div className="flex gap-2">
                              <select
                                value={selectedConfigName}
                                onChange={(e) => {
                                  setSelectedConfigName(e.target.value);
                                  setConfigNameInput(e.target.value);
                                }}
                                className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500/30 rounded text-blue-400 text-sm"
                              >
                                <option value="">Select a configuration to load...</option>
                                {durationConfigsList?.map((config: any) => (
                                  <option key={config.name} value={config.name}>
                                    {config.name}
                                    {config.isActive && ' (Active)'}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={async () => {
                                  if (!selectedConfigName) {
                                    alert('Please select a configuration to load');
                                    return;
                                  }
                                  try {
                                    const loadedConfig = await convex.query(api.durationConfigs.loadDurationConfig, {
                                      name: selectedConfigName
                                    });
                                    if (loadedConfig) {
                                      setDurationSettings({
                                        normal: loadedConfig.normal,
                                        challenger: loadedConfig.challenger,
                                        miniboss: loadedConfig.miniboss,
                                        event: loadedConfig.event,
                                        finalboss: loadedConfig.finalboss,
                                      });
                                      setConfigNameInput(selectedConfigName);
                                      alert(`Configuration "${selectedConfigName}" loaded successfully!`);
                                    }
                                  } catch (error) {
                                    alert('Failed to load configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded transition-colors"
                              >
                                Load
                              </button>
                              <button
                                onClick={async () => {
                                  if (!selectedConfigName) {
                                    alert('Please select a configuration to delete');
                                    return;
                                  }
                                  if (!confirm(`Are you sure you want to delete "${selectedConfigName}"?`)) {
                                    return;
                                  }
                                  try {
                                    await deleteDurationConfig({ name: selectedConfigName });
                                    alert(`Configuration "${selectedConfigName}" deleted successfully!`);
                                    setSelectedConfigName('');
                                    setConfigNameInput('');
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to delete configuration');
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Deploy Button */}
                          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg p-4 border border-orange-500/50">
                            <h5 className="text-sm font-bold text-orange-300 mb-2">Deploy to Story Climb</h5>
                            <p className="text-xs text-gray-400 mb-3">
                              Push the currently loaded configuration to the Story Climb page. This will make it the active configuration for all players.
                            </p>
                            {activeDurationConfig && (
                              <p className="text-xs text-green-400 mb-3">
                                Currently deployed: <strong>{activeDurationConfig.name}</strong>
                              </p>
                            )}
                            <button
                              onClick={async () => {
                                if (!configNameInput.trim()) {
                                  alert('Please enter or load a configuration name first');
                                  return;
                                }
                                if (!confirm(`Deploy "${configNameInput}" to Story Climb? This will affect all active players.`)) {
                                  return;
                                }
                                try {
                                  // First save/update the configuration
                                  try {
                                    await updateDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                  } catch (e) {
                                    // If update fails, try save
                                    await saveDurationConfig({
                                      name: configNameInput,
                                      normal: durationSettings.normal,
                                      challenger: durationSettings.challenger,
                                      miniboss: durationSettings.miniboss,
                                      event: durationSettings.event,
                                      finalboss: durationSettings.finalboss,
                                    });
                                  }

                                  // Then deploy it
                                  await deployDurationConfig({ name: configNameInput });
                                  alert(`Configuration "${configNameInput}" deployed to Story Climb successfully!`);
                                } catch (error: any) {
                                  alert(error.message || 'Failed to deploy configuration');
                                }
                              }}
                              className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded transition-all shadow-lg hover:shadow-orange-500/30"
                            >
                              🚀 Deploy / Push to Story Climb
                            </button>
                          </div>
                        </div>
                      </div>
                </div>
                )}

                {/* NFT Purchase Planning */}
                {storyClimbSubTab === 'nft-planning' && (
                  <div className="bg-black/70 border border-gray-500/20 rounded p-4">
                    <NftPurchasePlanner />
                  </div>
                )}

                {/* Other Story Climb Subsections from StoryClimbConfig */}
                {(storyClimbSubTab === 'normal-mek-distribution' ||
                  storyClimbSubTab === 'chapter-rarity' ||
                  storyClimbSubTab === 'mek-slots' ||
                  storyClimbSubTab === 'node-fee' ||
                  storyClimbSubTab === 'event-node' ||
                  storyClimbSubTab === 'boss-rewards' ||
                  storyClimbSubTab === 'normal-rewards') && (
                  <div className="bg-black/70 border border-gray-500/20 rounded p-4">
                    <StoryClimbConfig
                      activeSection={storyClimbSubTab}
                      key={`${activeTab}-${storyClimbSubTab}`}
                    />
                  </div>
                )}
              </div>
          </div>
          )}

          {/* Daily Recipes */}
          {activeTab === 'daily-recipes' && (
          <div id="section-daily-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('daily-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <h3 className="text-xl font-bold text-yellow-400">Daily Recipes (Universal Chips)</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('daily-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('daily-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Daily recipe rotation and requirements</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Salvage Materials */}
          {activeTab === 'salvage-materials' && (
          <div id="section-salvage-materials" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('salvage-materials')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔧</span>
                <h3 className="text-xl font-bold text-yellow-400">Salvage Materials</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('salvage-materials') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('salvage-materials') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Material types, rarity, and drop rates</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Circuitry */}
          {activeTab === 'circuitry-costs' && (
          <div id="section-circuitry-costs" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('circuitry-costs')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <h3 className="text-xl font-bold text-yellow-400">Circuitry</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('circuitry-costs') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('circuitry-costs') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Circuitry system configuration</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Mech Chip Crafting Recipes */}
          {activeTab === 'mech-chip-recipes' && (
          <div id="section-mech-chip-recipes" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('mech-chip-recipes')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔨</span>
                <h3 className="text-xl font-bold text-yellow-400">Mech Chip Crafting Recipes</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('mech-chip-recipes') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('mech-chip-recipes') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Recipe requirements and combinations</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Single Missions Formulation */}
          {activeTab === 'single-missions' && (
          <div id="section-single-missions" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('single-missions')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-xl font-bold text-yellow-400">Single Missions Formulation</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('single-missions') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('single-missions') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Mission generation and reward balancing</p>
                <div className="bg-gray-800/30 rounded p-4">
                  <p className="text-sm text-gray-500">System not yet implemented</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Market System */}
          {activeTab === 'market-system' && (
          <div id="section-market-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('market-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏪</span>
                <h3 className="text-xl font-bold text-yellow-400">Market</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('market-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('market-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Essence marketplace configuration and listing fee management</p>

                {/* Listing Duration & Fees - Editable */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-yellow-400 mb-3">Listing Duration Options & Fees</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {['1', '3', '7', '14', '30'].map((days: any) => (
                      <div key={days} className="bg-black/30 rounded p-3">
                        <div className="text-yellow-300 font-bold mb-2 text-center text-xs">
                          {days} DAY{days !== '1' ? 'S' : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={marketConfig.durationCosts[days as keyof typeof marketConfig.durationCosts]}
                            onChange={(e) => setMarketConfig(prev => ({
                              ...prev,
                              durationCosts: {
                                ...prev.durationCosts,
                                [days]: parseInt(e.target.value) || 0
                              }
                            }))}
                            className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-yellow-300 text-xs text-center font-mono focus:border-yellow-500 focus:outline-none"
                          />
                          <span className="text-gray-400 text-[10px]">g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-400 bg-black/30 p-2 rounded">
                    <div className="text-yellow-400 font-semibold mb-1">Notes:</div>
                    <div>• Fees are deducted when listing is created</div>
                    <div>• Longer durations cost more but provide better visibility</div>
                    <div>• Expired listings are automatically removed</div>
                  </div>
                </div>

                {/* Market Configuration - Editable */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-3">Market Configuration</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Base Listing Fee (%):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={marketConfig.baseListingFee}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            baseListingFee: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-yellow-300 text-center font-mono focus:border-yellow-500 focus:outline-none"
                        />
                        <span className="text-yellow-300">%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Min Listing Price:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={marketConfig.minListingPrice}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            minListingPrice: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-green-500/30 rounded px-2 py-1 text-green-300 text-center font-mono focus:border-green-500 focus:outline-none"
                        />
                        <span className="text-green-300">gold</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-black/30 p-3 rounded">
                      <span className="text-gray-400">Min Essence Amount:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={marketConfig.minEssenceAmount}
                          onChange={(e) => setMarketConfig(prev => ({
                            ...prev,
                            minEssenceAmount: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 bg-black/50 border border-blue-500/30 rounded px-2 py-1 text-blue-300 text-center font-mono focus:border-blue-500 focus:outline-none"
                        />
                        <span className="text-blue-300">essence</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Essence Market Management */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-purple-400 mb-3">Essence Market Management</h4>
                  <EssenceMarketAdmin />
                </div>
              </div>
            )}
          </div>
          )}

          {/* Offers System */}
          {activeTab === 'offers-system' && (
          <div id="section-offers-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('offers-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <h3 className="text-xl font-bold text-yellow-400">Offers System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('offers-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('offers-system') && (
              <div className="p-4 border-t border-gray-700/50 space-y-4">
                <p className="text-gray-400 mb-4">Player-to-player offer negotiation and trade system</p>

                {/* Offer Window Criteria */}
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-orange-400 mb-3">Offer Window Interface</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="text-yellow-300 font-semibold text-xs">Required Fields</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Offer Amount:</span>
                          <span className="text-gray-300">Numeric input with validation</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Message (Optional):</span>
                          <span className="text-gray-300">140 char limit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expiration:</span>
                          <span className="text-gray-300">24h / 48h / 7d / 30d</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bundle Items:</span>
                          <span className="text-gray-300">Multi-select up to 5</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-blue-300 font-semibold text-xs">Validation Rules</h5>
                      <div className="bg-black/30 rounded p-3 space-y-2 text-xs text-gray-400">
                        <div>✓ Min offer: 10% of listing price</div>
                        <div>✓ Max offer: 200% of listing price</div>
                        <div>✓ User must have sufficient funds</div>
                        <div>✓ Cannot offer on own items</div>
                        <div>✓ Max 3 active offers per item</div>
                        <div>✓ Cooldown: 5 min between offers</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Offer Status & Notifications */}
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3">Offer Management</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Offer States</div>
                      <div className="space-y-1">
                        <div className="text-yellow-300">• Pending</div>
                        <div className="text-green-300">• Accepted</div>
                        <div className="text-red-300">• Rejected</div>
                        <div className="text-gray-500">• Expired</div>
                        <div className="text-blue-300">• Counter-offered</div>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Notifications</div>
                      <div className="text-gray-500">
                        • New offer received<br/>
                        • Offer accepted/rejected<br/>
                        • Counter-offer made<br/>
                        • Offer expiring soon<br/>
                        • Outbid notification
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-gray-300 font-semibold mb-1">Quick Actions</div>
                      <div className="text-gray-500">
                        • Accept<br/>
                        • Reject<br/>
                        • Counter (±50%)<br/>
                        • Message buyer<br/>
                        • Block user
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Pricing Suggestions */}
                <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-pink-400 mb-3">AI Offer Suggestions</h4>
                  <div className="text-xs space-y-2">
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Fair Price Range:</span>
                      <span className="text-green-300 ml-2">Based on last 30 sales of similar items</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Win Probability:</span>
                      <span className="text-yellow-300 ml-2">Calculate % chance seller accepts</span>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <span className="text-gray-400">Suggested Counter:</span>
                      <span className="text-blue-300 ml-2">AI-powered negotiation helper</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Variations */}
          {activeTab === 'variations' && (
          <div id="section-variations" className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('variations')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <h3 className="text-xl font-bold text-yellow-400">Variations</h3>
              </div>
              <span className="text-gray-400">{expandedSections.has('variations') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('variations') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">Configure and manage Mek variations system</p>

                {/* Image Sync Configuration Subsection */}
                <div className="mb-4 bg-black/40 border border-purple-500/30 rounded-lg">
                  <button
                    onClick={() => toggleSection('variations-image-sync')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🖼️</span>
                      <h4 className="text-md font-bold text-purple-400">Image Sync Configuration</h4>
                      <span className="px-2 py-0.5 bg-orange-600/30 text-orange-400 text-xs font-bold rounded">SETUP</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-image-sync') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-image-sync') && (
                    <div className="p-4 border-t border-purple-500/20">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Folder Path
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={variationsImageFolder}
                              onChange={(e) => handleVariationsFolderChange(e.target.value)}
                              placeholder="e.g., C:\Assets\Mek-Variations or /public/images/variations"
                              className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                console.log('Browse for folder clicked');
                              }}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 transition-colors"
                            >
                              Browse
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Specify the folder containing variation images (heads, bodies, traits)
                          </p>
                        </div>

                        {variationsImageFolder && (
                          <div className="bg-black/30 rounded p-3 border border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-400">Current Path:</span>
                              <span className="text-xs text-green-400">✓ Set</span>
                            </div>
                            <code className="text-xs text-yellow-300 break-all">{variationsImageFolder}</code>
                          </div>
                        )}

                        {/* Search Field */}
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Search Variations
                          </label>
                          <input
                            type="text"
                            placeholder="Search by name, ID, or category..."
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variation Search & Browse Subsection */}
                <div className="mb-4 bg-black/40 border border-cyan-500/30 rounded-lg">
                  <button
                    onClick={() => toggleSection('variations-search')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      <h4 className="text-md font-bold text-cyan-400">Search & Browse All Variations</h4>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs font-bold rounded">288 VARIATIONS</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-search') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-search') && (
                    <div className="p-4 border-t border-cyan-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Search and filter all 291 variations by name, style, or group. Track image progress for heads, bodies, and traits.
                      </p>
                      <VariationsHub />
                    </div>
                  )}
                </div>

                {/* Variation Buff Assignment Subsection */}
                <div className="mb-4 ml-6 bg-black/70 border border-yellow-500/20 rounded">
                  <button
                    onClick={() => toggleSection('variations-buff-assignment')}
                    className="w-full p-3 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💪</span>
                      <h4 className="text-sm font-semibold text-yellow-300">Variation Buff Percentages</h4>
                      <span className="px-2 py-0.5 bg-blue-600/30 text-blue-400 text-xs font-bold rounded">NEW</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expandedSections.has('variations-buff-assignment') ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections.has('variations-buff-assignment') && (
                    <div className="p-4 border-t border-yellow-500/20">
                      <p className="text-sm text-gray-400 mb-4">
                        Assign buff percentages to all 300+ variations based on rarity using min/max values with curve interpolation.
                      </p>

                      {/* Min/Max Configuration */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Min Buff % (Common)
                          </label>
                          <input
                            type="number"
                            value={buffPercentages.minPercent}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, minPercent: parseInt(e.target.value) || 5 }))}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Max Buff % (Legendary)
                          </label>
                          <input
                            type="number"
                            value={buffPercentages.maxPercent}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, maxPercent: parseInt(e.target.value) || 50 }))}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-yellow-400"
                          />
                        </div>
                      </div>

                      {/* Curve Type Selection */}
                      <div className="mb-4">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Interpolation Curve
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['linear', 'exponential', 'logarithmic'].map((curve: any) => (
                            <button
                              key={curve}
                              onClick={() => setBuffPercentages(prev => ({ ...prev, curveType: curve as any }))}
                              className={`px-3 py-2 rounded border transition-all text-sm capitalize ${
                                buffPercentages.curveType === curve
                                  ? 'border-yellow-400 bg-yellow-900/30 text-yellow-300'
                                  : 'border-gray-600 bg-gray-800/30 text-gray-400 hover:border-yellow-500/50'
                              }`}
                            >
                              {curve}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Curve Factor (for exponential) */}
                      {buffPercentages.curveType === 'exponential' && (
                        <div className="mb-4">
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
                            Curve Factor
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="7"
                            step="0.1"
                            value={buffPercentages.curveFactor}
                            onChange={(e) => setBuffPercentages(prev => ({ ...prev, curveFactor: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Gentle (0.5)</span>
                            <span className="text-yellow-400">{buffPercentages.curveFactor.toFixed(1)}</span>
                            <span>Steep (7.0)</span>
                          </div>
                        </div>
                      )}

                      {/* Variation Search */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700 mb-4">
                        <h5 className="text-sm font-bold text-cyan-300 mb-3">Search Specific Variation</h5>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={variationSearch}
                            onChange={(e) => setVariationSearch(e.target.value)}
                            placeholder="Search for a variation (e.g., Gold, Hacker, ???)..."
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                          />

                          {/* Search Results */}
                          {variationSearch.length > 0 && (
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {(() => {
                                // Combine all variations and assign ranks based on rarity
                                const allVariationsData: any[] = [];

                                // Add all heads
                                VARIATIONS_BY_TYPE.heads.forEach((v: any, i: number) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'head',
                                    rank: 0 // Will be assigned after sorting
                                  });
                                });

                                // Add all bodies
                                VARIATIONS_BY_TYPE.bodies.forEach((v: any, i: number) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'body',
                                    rank: 0
                                  });
                                });

                                // Add all traits
                                VARIATIONS_BY_TYPE.traits.forEach((v: any, i: number) => {
                                  allVariationsData.push({
                                    ...v,
                                    category: 'item',
                                    rank: 0
                                  });
                                });

                                // Create a map of variation names to their copy counts and ranks
                                const copyCountMap: Record<string, number> = {};

                                // Add all heads with their copy counts
                                variationsData.heads.forEach((v: any, index: number) => {
                                  copyCountMap[v.name] = v.copies;
                                });

                                // Add bodies with their copy counts if available
                                if (variationsData.bodies) {
                                  variationsData.bodies.forEach((v: any) => {
                                    copyCountMap[v.name] = v.copies;
                                  });
                                }

                                // Add items with their copy counts if available
                                if (variationsData.items) {
                                  variationsData.items.forEach((v: any) => {
                                    copyCountMap[v.name] = v.copies;
                                  });
                                }

                                // Assign ranks based on copy count (fewer copies = lower rank = rarer)
                                allVariationsData.forEach((v: any) => {
                                  const copies = copyCountMap[v.name] || 50; // Default to 50 if not found
                                  // Invert: fewer copies = lower rank
                                  // 1 copy = rank ~1-10
                                  // 132 copies = rank ~300
                                  if (copies === 1) {
                                    v.rank = Math.floor(Math.random() * 10) + 1; // Rank 1-10 for 1-of-1s
                                  } else {
                                    v.rank = copies * 2.3; // Scale up for proper distribution
                                  }
                                });

                                // Sort by rank (lower rank = rarer)
                                allVariationsData.sort((a: any, b: any) => a.rank - b.rank);

                                const filtered = allVariationsData.filter((v: any) =>
                                  v.name.toLowerCase().includes(variationSearch.toLowerCase())
                                ).slice(0, 10); // Show max 10 results

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-xs text-gray-500 italic px-2 py-1">
                                      No variations found matching "{variationSearch}"
                                    </div>
                                  );
                                }

                                return filtered.map((variation: any) => (
                                  <button
                                    key={`${variation.category}-${variation.name}`}
                                    onClick={() => {
                                      setSelectedVariation(variation);
                                      setVariationSearch('');
                                    }}
                                    className="w-full text-left px-2 py-1 bg-gray-800/30 hover:bg-gray-700/50 rounded transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-500 font-mono">#{variation.rank}</span>
                                      <span className="text-xs text-gray-300">{variation.name}</span>
                                      <span className="text-[10px] text-gray-500 uppercase">({variation.category})</span>
                                    </div>
                                  </button>
                                ));
                              })()}
                            </div>
                          )}

                          {/* Selected Variation Display */}
                          {selectedVariation && (
                            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/50 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h6 className="text-sm font-bold text-cyan-300">{selectedVariation.name}</h6>
                                  <span className="text-[10px] text-gray-400 uppercase">{selectedVariation.category} • Rank #{selectedVariation.rank}</span>
                                </div>
                                <button
                                  onClick={() => setSelectedVariation(null)}
                                  className="text-gray-500 hover:text-gray-300 text-xs"
                                >
                                  ✕
                                </button>
                              </div>

                              {(() => {
                                // Calculate buff percentage for selected variation
                                const totalVariations = 288;
                                const normalizedRank = selectedVariation.rank / totalVariations;
                                let interpolatedValue: number;

                                switch (buffPercentages.curveType) {
                                  case 'linear':
                                    interpolatedValue = normalizedRank;
                                    break;
                                  case 'exponential':
                                    interpolatedValue = Math.pow(normalizedRank, buffPercentages.curveFactor);
                                    break;
                                  case 'logarithmic':
                                    interpolatedValue = Math.log(1 + normalizedRank * 9) / Math.log(10);
                                    break;
                                  default:
                                    interpolatedValue = normalizedRank;
                                }

                                const buffPercent = Math.round(
                                  buffPercentages.minPercent +
                                  (buffPercentages.maxPercent - buffPercentages.minPercent) * interpolatedValue
                                );

                                // Determine rarity tier
                                let rarityTier = 'Common';
                                let tierColor = 'text-green-400';
                                if (buffPercent > 45) {
                                  rarityTier = 'Legendary';
                                  tierColor = 'text-red-400';
                                } else if (buffPercent > 35) {
                                  rarityTier = 'Epic';
                                  tierColor = 'text-orange-400';
                                } else if (buffPercent > 20) {
                                  rarityTier = 'Rare';
                                  tierColor = 'text-purple-400';
                                } else if (buffPercent > 10) {
                                  rarityTier = 'Uncommon';
                                  tierColor = 'text-blue-400';
                                }

                                return (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-400">Buff Percentage:</span>
                                      <span className={`text-2xl font-bold ${tierColor}`}>{buffPercent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-gray-400">Rarity Tier:</span>
                                      <span className={`text-sm font-semibold ${tierColor}`}>{rarityTier}</span>
                                    </div>
                                    <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden mt-2">
                                      <div
                                        className={`h-full bg-gradient-to-r ${
                                          rarityTier === 'Legendary' ? 'from-red-600 to-red-400' :
                                          rarityTier === 'Epic' ? 'from-orange-600 to-orange-400' :
                                          rarityTier === 'Rare' ? 'from-purple-600 to-purple-400' :
                                          rarityTier === 'Uncommon' ? 'from-blue-600 to-blue-400' :
                                          'from-green-600 to-green-400'
                                        } transition-all duration-500`}
                                        style={{ width: `${(buffPercent / buffPercentages.maxPercent) * 100}%` }}
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Sample Visualization */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700 mb-4">
                        <h5 className="text-sm font-bold text-yellow-300 mb-3">
                          Complete Distribution (All {(() => {
                            let count = 0;
                            if (variationsData.heads) count += variationsData.heads.length;
                            if (variationsData.bodies) count += variationsData.bodies.length;
                            if (variationsData.traits) count += variationsData.traits.length;
                            return count;
                          })()} Variations)
                        </h5>
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {(() => {
                            // Get ALL variations with their actual copy counts
                            const allVariationsWithCounts: any[] = [];

                            // Add all heads from variationsData
                            if (variationsData.heads) {
                              variationsData.heads.forEach((v: any) => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'head'
                                });
                              });
                            }

                            // Add all bodies from variationsData
                            if (variationsData.bodies) {
                              variationsData.bodies.forEach((v: any) => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'body'
                                });
                              });
                            }

                            // Add all traits (items) from variationsData
                            if (variationsData.traits) {
                              variationsData.traits.forEach((v: any) => {
                                allVariationsWithCounts.push({
                                  name: v.name,
                                  copies: v.copies,
                                  category: 'trait'
                                });
                              });
                            }

                            // Sort primarily by copies (ascending = rarest first)
                            // For 1-of-1s, use Mek rank for tiebreaking
                            const sampleVariations = allVariationsWithCounts.sort((a: any, b: any) => {
                              if (a.copies !== b.copies) {
                                return a.copies - b.copies;
                              }
                              // For same copy count (especially 1-of-1s), use Mek rank if available
                              const aRank = getVariationTrueRank(a.name);
                              const bRank = getVariationTrueRank(b.name);
                              return aRank - bRank;
                            });

                            // Sort by copies (fewer = rarer = should appear first)
                            sampleVariations.sort((a: any, b: any) => a.copies - b.copies);

                            // Calculate rank based on copies and Mek ranks for tiebreaking
                            const variationsWithRanks = sampleVariations.map((v: any) => {
                              // Use the true rank function if available in our mapping
                              const trueRank = getVariationTrueRank(v.name);

                              // If not in mapping, calculate based on copies
                              const rank = trueRank !== 100 ? trueRank : (
                                v.copies === 1 ? 10 : // Unknown 1-of-1s get rank 10
                                20 + (v.copies * 2)    // Others get calculated rank
                              );

                              return { ...v, rank };
                            });

                            // Sort variations by rank for proper ordering
                            variationsWithRanks.sort((a: any, b: any) => a.rank - b.rank);

                            // Re-assign sequential ranks from 1 to N
                            variationsWithRanks.forEach((v: any, index: number) => {
                              v.rank = index + 1;
                            });

                            const totalVariations = variationsWithRanks.length;

                            return variationsWithRanks.map((variation: any) => {
                              // INVERTED: Lower rank (rarer) = HIGHER percentage
                              // Normalize rank: 0 = rarest, 1 = most common
                              const normalizedRank = (variation.rank - 1) / (totalVariations - 1);

                              // INVERT the interpolation
                              let interpolatedValue: number;

                              switch (buffPercentages.curveType) {
                                case 'linear':
                                  interpolatedValue = 1 - normalizedRank; // INVERTED
                                  break;
                                case 'exponential':
                                  interpolatedValue = 1 - Math.pow(normalizedRank, buffPercentages.curveFactor); // INVERTED
                                  break;
                                case 'logarithmic':
                                  interpolatedValue = 1 - (Math.log(1 + normalizedRank * 9) / Math.log(10)); // INVERTED
                                  break;
                                default:
                                  interpolatedValue = 1 - normalizedRank; // INVERTED
                              }

                              const buffPercent = Math.round(
                                buffPercentages.minPercent +
                                (buffPercentages.maxPercent - buffPercentages.minPercent) * interpolatedValue
                              );

                              // Determine color based on buff percentage
                              let colorClass = 'text-gray-400';
                              let bgClass = 'bg-gray-800/20';
                              if (buffPercent <= 10) {
                                colorClass = 'text-green-400';
                                bgClass = 'bg-green-900/20';
                              } else if (buffPercent <= 20) {
                                colorClass = 'text-blue-400';
                                bgClass = 'bg-blue-900/20';
                              } else if (buffPercent <= 35) {
                                colorClass = 'text-purple-400';
                                bgClass = 'bg-purple-900/20';
                              } else if (buffPercent <= 45) {
                                colorClass = 'text-orange-400';
                                bgClass = 'bg-orange-900/20';
                              } else {
                                colorClass = 'text-red-400';
                                bgClass = 'bg-red-900/20';
                              }

                              return (
                                <div key={`${variation.category}-${variation.name}`} className={`flex items-center justify-between px-2 py-1 rounded ${bgClass}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-mono">#{Math.round(variation.rank)}</span>
                                    <span className="text-xs text-gray-300">{variation.name}</span>
                                    <span className="text-[9px] text-gray-600">
                                      ({variation.copies} {variation.copies === 1 ? 'copy' : 'copies'})
                                      {variation.category && <span className="text-gray-700"> • {variation.category}</span>}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-black/30 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full ${bgClass.replace('/20', '/60')} transition-all duration-300`}
                                        style={{ width: `${(buffPercent / buffPercentages.maxPercent) * 100}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${colorClass} w-10 text-right`}>{buffPercent}%</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="bg-black/30 rounded p-4 border border-gray-700">
                        <h5 className="text-sm font-bold text-yellow-300 mb-3">Rarity Distribution Preview</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Common (70% of variations):</span>
                            <span className="text-green-400">{buffPercentages.minPercent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Uncommon (20%):</span>
                            <span className="text-blue-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.25)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rare (7%):</span>
                            <span className="text-purple-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.5)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Epic (2.5%):</span>
                            <span className="text-orange-400">
                              {Math.round(buffPercentages.minPercent + (buffPercentages.maxPercent - buffPercentages.minPercent) * 0.75)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Legendary (0.5%):</span>
                            <span className="text-red-400">{buffPercentages.maxPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={async () => {
                            console.log('Applying buff percentages:', buffPercentages);

                            // Save configuration
                            await saveBuffConfiguration({
                              minPercent: buffPercentages.minPercent,
                              maxPercent: buffPercentages.maxPercent,
                              curveType: buffPercentages.curveType,
                              curveFactor: buffPercentages.curveFactor
                            });

                            // Apply to all variations
                            const result = await applyBuffsToVariations({
                              minPercent: buffPercentages.minPercent,
                              maxPercent: buffPercentages.maxPercent,
                              curveType: buffPercentages.curveType,
                              curveFactor: buffPercentages.curveFactor
                            });

                            console.log('Applied buffs to variations:', result);
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
                        >
                          Apply to All Variations
                        </button>
                        <button
                          onClick={() => {
                            console.log('Variation buffs:', variationBuffs);
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Placeholder for future features */}
                <div className="bg-gray-800/20 rounded p-4 border border-gray-700/30">
                  <p className="text-sm text-gray-500">Additional variation features will be added here...</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Jobs System */}
          {activeTab === 'jobs-system' && (
          <div id="section-jobs-system" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('jobs-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <h3 className="text-xl font-bold text-yellow-400">Jobs System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('jobs-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('jobs-system') && (
              <div className="p-4 border-t border-gray-700/50">
                {/* Sub-Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-700/50 pb-3 mb-6">
                  <button
                    onClick={() => setSlotsSubTab('job-builder')}
                    className={`px-4 py-2 font-bold uppercase tracking-wider transition-all ${
                      slotsSubTab === 'job-builder'
                        ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                        : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-yellow-500/50'
                    }`}
                  >
                    Job Builder
                  </button>
                  <button
                    onClick={() => setSlotsSubTab('tenure-config')}
                    className={`px-4 py-2 font-bold uppercase tracking-wider transition-all ${
                      slotsSubTab === 'tenure-config'
                        ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                        : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-yellow-500/50'
                    }`}
                  >
                    Tenure Config
                  </button>
                </div>

                {/* Job Builder Sub-Tab */}
                {slotsSubTab === 'job-builder' && (
                  <JobBuilder />
                )}

                {/* Tenure Config Sub-Tab */}
                {slotsSubTab === 'tenure-config' && (
                  <>
                <p className="text-gray-400 mb-4">Configure tenure requirements for slot leveling across all slot types</p>

                {/* Slot Type Selector - Button Group */}
                <div className="mb-6">
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Slot Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedSlotType('basic')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'basic'
                          ? 'bg-green-500/30 border-2 border-green-500 text-green-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-green-500/50'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setSelectedSlotType('advanced')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'advanced'
                          ? 'bg-blue-500/30 border-2 border-blue-500 text-blue-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-blue-500/50'
                      }`}
                    >
                      Advanced
                    </button>
                    <button
                      onClick={() => setSelectedSlotType('master')}
                      className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                        selectedSlotType === 'master'
                          ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-400'
                          : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-purple-500/50'
                      }`}
                    >
                      Master
                    </button>
                  </div>
                </div>

                {/* Save Configuration Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full px-4 py-3 bg-green-500/20 border-2 border-green-500/50 rounded text-green-400 font-bold uppercase tracking-wider hover:bg-green-500/30 hover:border-green-500 transition-all"
                  >
                    💾 Save Configuration
                  </button>
                </div>

                {/* Interpolation Controls */}
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider">Auto-Fill Tool</h5>
                  <p className="text-xs text-gray-400 mb-3">Enter values in Level 1→2 and Level 9→10, then click Interpolate to auto-fill middle values</p>

                  <div className="space-y-4">
                    {/* Curve Factor Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                          Curve (Exponential Growth)
                        </label>
                        <span className="text-sm font-bold text-yellow-300">
                          {slotCurveFactor.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={slotCurveFactor}
                        onChange={(e) => setSlotCurveFactor(parseFloat(e.target.value))}
                        className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slower Growth (0.5)</span>
                        <span>Linear (1.0)</span>
                        <span>Faster Growth (3.0)</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Rounding
                        </label>
                        <select
                          value={slotRoundingOption}
                          onChange={(e) => setSlotRoundingOption(Number(e.target.value) as 10 | 100 | 1000)}
                          className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-yellow-300 focus:border-yellow-500 focus:outline-none"
                        >
                          <option value={10}>Tens</option>
                          <option value={100}>Hundreds</option>
                          <option value={1000}>Thousands</option>
                        </select>
                      </div>

                      <button
                        onClick={interpolateSlotValues}
                        className="px-6 py-2 bg-yellow-500/20 border-2 border-yellow-500/50 rounded text-yellow-400 font-bold uppercase tracking-wider hover:bg-yellow-500/30 hover:border-yellow-500 transition-all"
                      >
                        Interpolate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leveling Requirements Grid */}
                <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4 uppercase tracking-wider">
                    {selectedSlotType.charAt(0).toUpperCase() + selectedSlotType.slice(1)} Slot Leveling Requirements
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">Tenure cost required to upgrade each level</p>

                  <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index: any) => (
                      <div key={index} className="bg-black/50 border border-gray-600/50 rounded p-3">
                        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                          Level {index + 1} → {index + 2}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={slotsConfig[selectedSlotType][index] === 0 ? '' : slotsConfig[selectedSlotType][index].toLocaleString()}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, '');

                            if (rawValue === '') {
                              setSlotsConfig(prev => ({
                                ...prev,
                                [selectedSlotType]: prev[selectedSlotType].map((val: any, i: number) =>
                                  i === index ? 0 : val
                                )
                              }));
                              return;
                            }

                            if (!/^\d+$/.test(rawValue)) {
                              return;
                            }

                            const numValue = parseInt(rawValue, 10);
                            if (!isNaN(numValue)) {
                              setSlotsConfig(prev => ({
                                ...prev,
                                [selectedSlotType]: prev[selectedSlotType].map((val: any, i: number) =>
                                  i === index ? numValue : val
                                )
                              }));
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            const firstValue = slotsConfig[selectedSlotType][0];
                            const lastValue = slotsConfig[selectedSlotType][8];

                            if (firstValue > 0 && lastValue > 0) {
                              interpolateSlotValues();
                            }
                          }}
                          className="w-full px-3 py-2 bg-black/50 border border-yellow-500/50 rounded text-yellow-300 text-center font-bold focus:border-yellow-500 focus:outline-none"
                        />
                        <p className="text-xs text-yellow-400 mt-1 text-center font-semibold">
                          {slotsConfig[selectedSlotType][index].toLocaleString()} tenure
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {formatTenureDuration(slotsConfig[selectedSlotType][index], tenurePerSecond)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary Display */}
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
                    <h5 className="text-sm font-bold text-yellow-400 mb-2 uppercase tracking-wider">Total Tenure Required</h5>
                    <p className="text-xs text-gray-400 mb-2">To reach Level 10 from Level 1 (assumes Mek slotted entire time)</p>
                    <div className="text-2xl font-bold text-yellow-300 text-center">
                      {slotsConfig[selectedSlotType].reduce((sum: any, val: any) => sum + val, 0).toLocaleString()} Tenure
                    </div>
                    <div className="text-lg font-bold text-blue-400 text-center mt-2">
                      {formatTenureDuration(slotsConfig[selectedSlotType].reduce((sum: any, val: any) => sum + val, 0), tenurePerSecond)}
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
          )}

          {/* Gold Backup System */}
          {activeTab === 'gold-backup-system' && (
          <div id="section-gold-backup-system" className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('gold-backup-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💾</span>
                <h3 className="text-xl font-bold text-yellow-400">Gold Backup System</h3>
                <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs font-bold rounded">IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('gold-backup-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('gold-backup-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <p className="text-gray-400 mb-4">
                  Comprehensive disaster recovery system for user gold states. Create manual backups, automatic daily snapshots, and restore from any point in time.
                </p>
                <GoldBackupAdmin />
              </div>
            )}
          </div>
          )}

          {/* Player Management */}
          {activeTab === 'wallet-management' && (
          <div id="section-wallet-management" className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  View and manage all connected players. Reset verification status for testing or permanently remove players from the system.
                </p>

                {/* Player Management Component with built-in tabs */}
                <WalletManagementAdmin />
              </div>
          </div>
          )}

          {/* Port Monitor */}
          {activeTab === 'port-monitor' && (
          <div id="section-port-monitor" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Monitor which processes are using dev server ports. Quickly identify and kill zombie processes that cause "EADDRINUSE" errors.
                </p>

                <PortMonitor />
              </div>
          </div>
          )}

          {/* SourceKey Migration */}
          {activeTab === 'sourcekey-migration' && (
          <div id="section-sourcekey-migration" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Fix missing sourceKey fields in goldMining records. This enables Mek images to load correctly in the selector.
                </p>

                <SourceKeyMigrationAdmin />
              </div>
          </div>
          )}

          {/* Claude Manager */}
          {activeTab === 'claude-manager' && (
          <div id="section-claude-manager" className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  View and manage Claude Code agents, slash commands, and markdown documents. See both project-specific and computer-wide Claude files.
                </p>

                <ClaudeManagerAdmin />
              </div>
          </div>
          )}

          {/* Notification System */}
          {activeTab === 'notification-system' && (
          <div id="section-notification-system" className="bg-black/50 backdrop-blur border-2 border-orange-500/30 rounded-lg shadow-lg shadow-black/50">
            <button
              onClick={() => toggleSection('notification-system')}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <h3 className="text-xl font-bold text-yellow-400">Notification System</h3>
                <span className="px-2 py-1 bg-gray-600/30 text-gray-400 text-xs font-bold rounded">NOT IMPLEMENTED</span>
              </div>
              <span className="text-gray-400">{expandedSections.has('notification-system') ? '▼' : '▶'}</span>
            </button>
            {expandedSections.has('notification-system') && (
              <div className="p-4 border-t border-gray-700/50">
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <h4 className="text-lg font-semibold text-orange-400 mb-2">Notification System</h4>
                  <p className="text-sm text-gray-400">
                    Coming soon: In-game notifications, alerts, and messaging system configuration
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* NFT Admin */}
          {activeTab === 'nft-admin' && (
          <div id="section-nft-admin" className="bg-black/50 backdrop-blur border-2 border-purple-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Manage NFT campaigns, eligibility, and distribution for commemorative tokens and event-based NFTs.
                </p>

                {/* NFT Sub-Tabs */}
                <NFTAdminTabs client={httpClient} />
              </div>
          </div>
          )}

          {/* Route Configuration */}
          {activeTab === 'route-config' && (
          <div id="section-route-config" className="bg-black/50 backdrop-blur border-2 border-cyan-500/30 rounded-lg shadow-lg shadow-black/50">
            <RouteVisualization />
          </div>
          )}

          {/* Overlay Editor */}
          {activeTab === 'overlay-editor' && (
          <div id="section-overlay-editor" className="bg-black/50 backdrop-blur border-2 border-yellow-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4">
                <p className="text-gray-400 mb-4">
                  Create and edit interactive zones and sprite positions on game images.
                </p>

                <OverlayEditor />
              </div>
          </div>
          )}

          {/* Navigation Preview */}
          {activeTab === 'navigation-preview' && (
          <div id="section-navigation-preview" className="bg-black/50 backdrop-blur border-2 border-blue-500/30 rounded-lg shadow-lg shadow-black/50">
            <div className="p-4 space-y-6">
                <p className="text-gray-400 mb-4">
                  Preview and test navigation overlays with interactive zones. Select a saved overlay from the Overlay Editor to display it as a sticky navigation bar.
                </p>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Overlay Selector */}
                  <div>
                    <label className="mek-label-uppercase block mb-2">Select Navigation Overlay</label>
                    <select
                      value={selectedNavigationOverlay}
                      onChange={(e) => setSelectedNavigationOverlay(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-blue-500/50 rounded text-white"
                    >
                      <option value="">-- Select an overlay --</option>
                      {allOverlays?.map((overlay: any) => (
                        <option key={overlay._id} value={overlay.imageKey}>
                          {overlay.imageKey} ({overlay.zones.length} zones)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Scale Slider */}
                  {selectedNavigationOverlay && selectedOverlayData && (
                    <div>
                      <label className="mek-label-uppercase block mb-2">
                        Navigation Scale: {Math.round(navigationScale * 100)}%
                      </label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.01"
                          value={navigationScale}
                          onChange={(e) => setNavigationScale(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          onClick={() => setNavigationScale(1)}
                          className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 hover:bg-blue-500/30 text-sm"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Original size: {selectedOverlayData.imageWidth} × {selectedOverlayData.imageHeight}px
                        <br />
                        Scaled size: {Math.round(selectedOverlayData.imageWidth * navigationScale)} × {Math.round(selectedOverlayData.imageHeight * navigationScale)}px
                      </div>
                    </div>
                  )}

                  {/* Save and Deploy Buttons */}
                  {selectedNavigationOverlay && selectedOverlayData && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveNavigationConfig}
                        className="flex-1 px-4 py-3 bg-blue-600/20 border-2 border-blue-500/50 rounded text-blue-400 font-bold hover:bg-blue-600/30 transition-colors"
                      >
                        💾 Save Configuration
                      </button>
                      <button
                        onClick={handleDeployNavigation}
                        disabled={!navigationConfig}
                        className="flex-1 px-4 py-3 bg-green-600/20 border-2 border-green-500/50 rounded text-green-400 font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚀 Deploy to Site
                      </button>
                      {activeNavigationConfig && (
                        <button
                          onClick={handleDeactivateNavigation}
                          className="px-4 py-3 bg-red-600/20 border-2 border-red-500/50 rounded text-red-400 font-bold hover:bg-red-600/30 transition-colors"
                        >
                          ⏸️ Deactivate
                        </button>
                      )}
                    </div>
                  )}

                  {/* Status Message */}
                  {navigationStatusMessage && (
                    <div className={`p-3 rounded border-2 ${
                      navigationStatusMessage.type === 'success' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                      navigationStatusMessage.type === 'error' ? 'bg-red-900/30 border-red-500/50 text-red-400' :
                      'bg-blue-900/30 border-blue-500/50 text-blue-400'
                    }`}>
                      {navigationStatusMessage.text}
                    </div>
                  )}

                  {/* Deployment Status Indicator */}
                  {activeNavigationConfig && (
                    <div className="bg-green-900/20 border-2 border-green-500/50 rounded p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-bold text-green-400">Navigation Active</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Overlay: {activeNavigationConfig.overlayImageKey} •
                            Scale: {Math.round(activeNavigationConfig.scale * 100)}% •
                            Deployed: {new Date(activeNavigationConfig.deployedAt || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {navigationConfig && !activeNavigationConfig && (
                    <div className="bg-yellow-900/20 border-2 border-yellow-500/50 rounded p-3 text-yellow-400 text-sm">
                      ℹ️ Configuration saved but not deployed. Click "Deploy to Site" to make it active.
                    </div>
                  )}
                </div>

                {/* Preview Area */}
                {selectedNavigationOverlay && selectedOverlayData ? (
                  <div className="space-y-4">
                    <div className="mek-label-uppercase text-blue-400">Sticky Navigation Preview</div>

                    {/* Sticky Navigation Container */}
                    <div
                      className="relative border-2 border-blue-500/50 rounded bg-black/80"
                      style={{
                        position: 'sticky',
                        top: '20px',
                        zIndex: 100
                      }}
                    >
                      {/* Base Image */}
                      <div
                        className="relative"
                        style={{
                          width: selectedOverlayData.imageWidth * navigationScale,
                          height: selectedOverlayData.imageHeight * navigationScale,
                        }}
                      >
                        <img
                          src={selectedOverlayData.imagePath}
                          alt="Navigation Backplate"
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                          }}
                        />

                        {/* Render Zones */}
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "zone")
                          .map((zone: any) => (
                            <div
                              key={zone.id}
                              style={{
                                position: 'absolute',
                                left: zone.x * navigationScale,
                                top: zone.y * navigationScale,
                                width: (zone.width || 0) * navigationScale,
                                height: (zone.height || 0) * navigationScale,
                                border: '2px solid rgba(59, 130, 246, 0.5)',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                cursor: 'pointer',
                              }}
                              className="hover:bg-blue-500/30 transition-colors"
                              title={zone.label || zone.type}
                            >
                              <div className="text-xs text-blue-400 font-bold p-1 bg-black/50">
                                {zone.label || zone.type}
                              </div>
                            </div>
                          ))}

                        {/* Render Sprites */}
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "sprite")
                          .map((sprite: any) => {
                            const spriteScaleValue = sprite.metadata?.spriteScale || 1;
                            return (
                              <div
                                key={sprite.id}
                                style={{
                                  position: 'absolute',
                                  left: sprite.x * navigationScale,
                                  top: sprite.y * navigationScale,
                                  transform: `scale(${spriteScaleValue * navigationScale})`,
                                  transformOrigin: 'top left',
                                  border: '1px solid rgba(250, 182, 23, 0.3)',
                                  pointerEvents: 'none',
                                }}
                              >
                                {sprite.overlayImage && (
                                  <img src={sprite.overlayImage} alt={sprite.label} style={{ display: 'block' }} />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Zone List */}
                    <div className="bg-black/50 border border-blue-500/30 rounded p-4">
                      <h4 className="mek-label-uppercase text-blue-400 mb-3">
                        Interactive Zones ({selectedOverlayData.zones.filter((z: any) => z.mode === "zone").length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedOverlayData.zones
                          .filter((zone: any) => zone.mode === "zone")
                          .map((zone: any) => (
                            <div
                              key={zone.id}
                              className="p-3 bg-black/50 border border-blue-500/30 rounded"
                            >
                              <div className="text-sm font-bold text-blue-400">
                                {zone.label || zone.type}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Position: ({Math.round(zone.x * navigationScale)}, {Math.round(zone.y * navigationScale)})
                                <br />
                                Size: {Math.round((zone.width || 0) * navigationScale)} × {Math.round((zone.height || 0) * navigationScale)}px
                                <br />
                                Type: {zone.type}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Scroll Test Area */}
                    <div className="bg-black/30 border border-gray-700 rounded p-4">
                      <div className="mek-label-uppercase text-gray-400 mb-2">Scroll Test Area</div>
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>Scroll down to see the sticky navigation stay at the top of the page.</p>
                        {Array.from({ length: 20 }).map((_: any, i: number) => (
                          <p key={i}>Test content line {i + 1}...</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12 border border-gray-700 rounded">
                    Select an overlay from the dropdown above to preview it as a sticky navigation bar.
                  </div>
                )}
              </div>
          </div>
          )}

          {/* Components */}
          {activeTab === 'components' && (
          <div id="section-components" className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50">
            <div className="p-6 space-y-8">
                <p className="text-zinc-300 mb-6">
                  Transformed UI components from external libraries (CodePen, shadcn, v0.dev) converted to Mek Tycoon's industrial design system using expert transformation documents.
                </p>

                {/* Component Grid - reversed so newest components appear at top */}
                <div className="mek-components-grid-reversed">

                  {/* Cube Spinner */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Cube Spinner
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-wrap items-center justify-center gap-8 min-h-[300px]">
                      <CubeSpinner color="gold" size={44} />
                      <CubeSpinner color="cyan" size={44} />
                      <CubeSpinner color="lime" size={44} />
                      <CubeSpinner color="purple" size={44} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by AqFox</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS-in-JS</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Lime, Purple variants</div>
                      <div><span className="text-zinc-500">Features:</span> 3D cube rotation, preserve-3d, translucent faces</div>
                    </div>
                  </div>

                  {/* Comet Loader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Comet Loader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <CometLoader />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold & Lime</div>
                    </div>
                  </div>

                  {/* Triangle Kaleidoscope */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Triangle Kaleidoscope
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black rounded-lg flex items-center justify-center min-h-[400px] overflow-hidden">
                      <div className="w-full h-[400px]">
                        <TriangleKaleidoscope />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SCSS/Compass</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript</div>
                      <div><span className="text-zinc-500">Features:</span> Polygon clip-path, screen blend mode</div>
                    </div>
                  </div>

                  {/* PreLoader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        PreLoader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative bg-black rounded-lg flex items-center justify-center min-h-[300px] overflow-hidden" style={{ transform: 'translateZ(0)' }}>
                      <div className="w-full h-[300px]">
                        <PreLoader />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Ripple animation, SVG logo, backdrop blur</div>
                    </div>
                  </div>

                  {/* Animated Border Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Animated Border Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <AnimatedBorderButton>
                        Click Me
                      </AnimatedBorderButton>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Blue → Gold (#fab617)</div>
                      <div><span className="text-zinc-500">Features:</span> Sequential border animations with staggered delays</div>
                    </div>
                  </div>

                  {/* Gradient Blur Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Gradient Blur Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-wrap items-center justify-center gap-4 min-h-[300px]">
                      <GradientBlurButton color="gold">Gold</GradientBlurButton>
                      <GradientBlurButton color="cyan">Cyan</GradientBlurButton>
                      <GradientBlurButton color="lime">Lime</GradientBlurButton>
                      <GradientBlurButton color="purple">Purple</GradientBlurButton>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Spacious74</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Lime, Purple variants</div>
                      <div><span className="text-zinc-500">Features:</span> Gradient border, blur glow on hover, press feedback</div>
                    </div>
                  </div>

                  {/* Industrial Flip Card */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Industrial Flip Card
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Card
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <IndustrialFlipCard
                        title="TACTICAL"
                        badge="ELITE"
                        footer="UNIT READY"
                        icon="⚙️"
                        backText="HOVER ME"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External React/styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + CSS</div>
                      <div><span className="text-zinc-500">Colors:</span> Yellow/gold theme with glass-morphism</div>
                      <div><span className="text-zinc-500">Features:</span> 3D flip animation, rotating border glow, blur circles, scan line effect</div>
                    </div>
                  </div>

                  {/* Spinning Gradient Card */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Spinning Gradient Card
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Card
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-wrap items-center justify-center gap-6 min-h-[380px]">
                      <SpinningGradientCard color="gold" title="GOLD" subtitle="mek" brandText="MEK" brandSubtext="card" />
                      <SpinningGradientCard color="cyan" title="CYAN" subtitle="mek" brandText="MEK" brandSubtext="card" />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by monkey_8812</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Purple, Lime variants</div>
                      <div><span className="text-zinc-500">Features:</span> Spinning gradient orb, glass-morphism layers, customizable content</div>
                    </div>
                  </div>

                  {/* Discord Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Discord Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <DiscordButton />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External React/styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Indigo gradient with glass-morphism</div>
                      <div><span className="text-zinc-500">Features:</span> Backdrop blur, hover animations, Discord icon, social button</div>
                    </div>
                  </div>

                  {/* Generating Loader */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Generating Loader
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Loader
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <GeneratingLoader />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS Modules</div>
                      <div><span className="text-zinc-500">Colors:</span> Purple/pink gradient ring with white text</div>
                      <div><span className="text-zinc-500">Features:</span> Rotating gradient ring, letter-by-letter animation, staggered delays</div>
                    </div>
                  </div>

                  {/* Text Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Text Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <TextSwitch />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Dark background with yellow (#ffb500) checked state</div>
                      <div><span className="text-zinc-500">Features:</span> Text label transitions, sliding thumb, opacity/transform animations</div>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Hover Tooltip
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <HoverTooltip />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> White with pink border (#ffe4e4)</div>
                      <div><span className="text-zinc-500">Features:</span> Hover reveal, animated lines, pulse background, diagonal line transform</div>
                    </div>
                  </div>

                  {/* Fill Text Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Fill Text Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <FillTextButton />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + inline styles</div>
                      <div><span className="text-zinc-500">Colors:</span> Green (#37FF8B) fill with stroke outline</div>
                      <div><span className="text-zinc-500">Features:</span> Text stroke effect, left-to-right fill animation, drop-shadow glow, webkit-text-stroke</div>
                    </div>
                  </div>

                  {/* Floating Label Input */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Floating Label Input
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Input
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <FloatingLabelInput />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External styled-components</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + CSS Modules</div>
                      <div><span className="text-zinc-500">Colors:</span> Blue (#5264AE) focus state with gray border</div>
                      <div><span className="text-zinc-500">Features:</span> Material Design floating label, center-expand bar animation, highlight flash, peer utility</div>
                    </div>
                  </div>

                  {/* Pro Mode Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Pro Mode Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <ProModeToggle />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Safety guard, 3D transforms, hazard stripes</div>
                    </div>
                  </div>

                  {/* Power Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <PowerSwitch />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D lever, rotating halves, glowing indicator</div>
                    </div>
                  </div>

                  {/* Nebula Checkbox */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Nebula Checkbox
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <NebulaCheckbox />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (Uiverse)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Square→Star transform, nebula glow, sparkles</div>
                    </div>
                  </div>

                  {/* Power Button Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Button Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <PowerButtonSwitch enableVibration={true} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (by @oguzyagizkara)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Sliding button, icon transitions, haptic feedback</div>
                    </div>
                  </div>

                  {/* Color Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Color Toggle Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[300px] text-[2em]">
                      <ColorToggleSwitch color="red" />
                      <ColorToggleSwitch color="yellow" />
                      <ColorToggleSwitch color="blue" />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS (SCSS)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D ball, radial gradients, 3 color variants</div>
                    </div>
                  </div>

                  {/* Dotted Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Dotted Toggle Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-[#e8e1d6] rounded-lg p-8 flex flex-col items-center justify-center gap-2 min-h-[300px] text-[3em]">
                      <DottedToggleSwitch />
                      <DottedToggleSwitch checked={true} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 12-dot grip pattern, 3D shadows, beige theme</div>
                    </div>
                  </div>

                  {/* Mechanical Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Mechanical Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                      {/* Industrial textured background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"></div>
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.1) 2px, rgba(250, 182, 23, 0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(250, 182, 23, 0.1) 2px, rgba(250, 182, 23, 0.1) 4px)'
                      }}></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,182,23,0.05),transparent_50%)]"></div>

                      {/* Toggle component with relative positioning */}
                      <div className="relative z-10">
                        <MechanicalToggle
                          checked={mechanicalToggleChecked}
                          onChange={setMechanicalToggleChecked}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS (SCSS)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS Module</div>
                      <div><span className="text-zinc-500">Features:</span> Red knob rotation, metallic handle, gray→green base, gold accents</div>
                    </div>
                  </div>

                  {/* Power Switch Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Power Switch Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview - Interactive toggle */}
                    <div className="bg-black/60 rounded-lg p-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Click to Toggle</div>
                        <PowerSwitchToggle
                          checked={powerSwitchToggleChecked}
                          onChange={setPowerSwitchToggleChecked}
                        />
                        <div className="text-xs text-yellow-400">
                          Status: {powerSwitchToggleChecked ? 'ON (Glowing)' : 'OFF (Dim)'}
                        </div>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS/SVG</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind v3</div>
                      <div><span className="text-zinc-500">Features:</span> Click animation, line bounce, circle rotation (partial→full), radial glow when ON</div>
                      <div><span className="text-zinc-500">Colors:</span> White → Gold (#fab617)</div>
                    </div>
                  </div>

                  {/* Glow Toggle */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glow Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
                      <div style={{ transform: 'scale(0.3)' }}>
                        <GlowToggle />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS (exact transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Sliding cyan/gray gradient track, ||| thumb with cyan radial glow when ON, gray background when OFF, 3s demo animation on load</div>
                    </div>
                  </div>

                  {/* Radial Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Radial Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="relative rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                      <RadialSwitch
                        options={['off', 'on']}
                        defaultIndex={radialSwitchIndex}
                        onChange={(index) => setRadialSwitchIndex(index)}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SASS (CodePen)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Circular rotating switch, gradient ring, animated handle</div>
                    </div>
                  </div>

                  {/* Glass Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glass Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #27272a 0px, #27272a 20px, #fab617 20px, #fab617 40px)'
                      }}
                    >
                      <GlassButton
                        text="Generate"
                        onClick={() => console.log('Glass button clicked')}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Glassmorphism with backdrop blur, rotating conic gradient border (hover: -75deg → -125deg), linear gradient shine on ::after, 3D rotation on active, shadow glow effect</div>
                    </div>
                  </div>

                  {/* Glass Button Sharp */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glass Button Sharp
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #27272a 0px, #27272a 20px, #fab617 20px, #fab617 40px)'
                      }}
                    >
                      <GlassButtonSharp
                        text="Generate"
                        onClick={() => console.log('Glass button sharp clicked')}
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> External HTML/CSS</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> Sharp edges (border-radius: 0), glassmorphism with backdrop blur, rotating conic gradient border, linear gradient shine, 3D rotation on active</div>
                    </div>
                  </div>

                  {/* Isometric Social Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Isometric Social Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex flex-wrap items-center justify-center gap-4 min-h-[400px]"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #1e293b 0px, #1e293b 20px, #0f172a 20px, #0f172a 40px)'
                      }}
                    >
                      <IsometricSocialButton
                        iconClass="fab fa-facebook"
                        label="Facebook"
                        onClick={() => console.log('Facebook clicked')}
                        mekImage="/mek-images/500px/ht2-bi1-lg2.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-twitter"
                        label="Twitter"
                        onClick={() => console.log('Twitter clicked')}
                        mekImage="/mek-images/500px/cl3-jg1-nm1.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-instagram"
                        label="Instagram"
                        onClick={() => console.log('Instagram clicked')}
                        mekImage="/mek-images/500px/ki3-cb1-ji1.webp"
                      />
                      <IsometricSocialButton
                        iconClass="fab fa-youtube"
                        label="Youtube"
                        onClick={() => console.log('Youtube clicked')}
                        mekImage="/mek-images/500px/ed3-dc1-il1.webp"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Pug/SCSS (exact transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> 3D isometric transform (perspective 1000px, rotate -30deg, skew 25deg), ::before creates left cube face (skewY -45deg), ::after creates bottom face (skewX -45deg), hover lifts button with translate(20px, -20px) and extends shadow from -20px to -50px</div>
                      <div><span className="text-zinc-500">Note:</span> Preserves original typos: "dislpay" (display) and "scewY" (skewY) in CSS</div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Close Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div
                      className="rounded-lg p-8 flex items-center justify-center min-h-[300px]"
                      style={{
                        background: '#1E272D'
                      }}
                    >
                      <CloseButton onClick={() => console.log('Close button clicked')} />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> HTML/SCSS (exact CSS transplant)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/CSS</div>
                      <div><span className="text-zinc-500">Features:</span> X made from two 3px × 37.5px bars rotated 45deg/-45deg, hover rotates bars in opposite direction (-45deg/45deg), color changes from white (rgba 255,255,255,0.7) to cyan (#22d3ee) with glow, "close" label fades in (opacity 0→1), all transitions 300ms ease-in</div>
                    </div>
                  </div>

                  {/* Glow Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glow Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-6 flex flex-col items-center justify-center gap-6 min-h-[400px]">
                      {/* Gold Variants - Different Shapes */}
                      <div className="text-xs text-yellow-400 uppercase tracking-wider mb-1">Gold Shapes</div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <GlowButton shape="rounded" color="gold">Rounded</GlowButton>
                        <GlowButton shape="pill" color="gold">Pill</GlowButton>
                        <GlowButton shape="sharp" color="gold">Sharp</GlowButton>
                        <GlowButton shape="angled" color="gold">Angled</GlowButton>
                        <GlowButton shape="hexagon" color="gold">Hexagon</GlowButton>
                      </div>

                      {/* Cyan Variants - Different Shapes */}
                      <div className="text-xs text-cyan-400 uppercase tracking-wider mt-4 mb-1">Cyan Shapes</div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <GlowButton shape="rounded" color="cyan">Rounded</GlowButton>
                        <GlowButton shape="pill" color="cyan">Pill</GlowButton>
                        <GlowButton shape="sharp" color="cyan">Sharp</GlowButton>
                        <GlowButton shape="angled" color="cyan">Angled</GlowButton>
                        <GlowButton shape="hexagon" color="cyan">Hexagon</GlowButton>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Allyhere</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold (#fab617) and Cyan (#00d4ff)</div>
                      <div><span className="text-zinc-500">Shapes:</span> rounded, pill, sharp, angled, hexagon</div>
                      <div><span className="text-zinc-500">Features:</span> Animated gradient (325deg), inset shadows, hover animation, focus ring</div>
                    </div>
                  </div>

                  {/* Glow Card */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glow Card
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Card
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-6 flex flex-wrap items-center justify-center gap-6 min-h-[400px]">
                      {/* Gold Variant */}
                      <GlowCard color="gold" size="sm" title="GOLD" />

                      {/* Cyan Variant */}
                      <GlowCard color="cyan" size="sm" title="CYAN" />

                      {/* White Variant */}
                      <GlowCard color="white" size="sm" title="WHITE" />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Spacious74</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, White variants</div>
                      <div><span className="text-zinc-500">Shapes:</span> rounded, sharp, angled</div>
                      <div><span className="text-zinc-500">Features:</span> Animated dot orbiting border, radial gradients, light ray effect, grid lines, gradient text</div>
                    </div>
                  </div>

                  {/* Rotary Dial */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Rotary Dial
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-6 flex flex-wrap items-center justify-center gap-8 min-h-[350px]">
                      {/* 3 Options - Gold */}
                      <div className="flex flex-col items-center gap-2">
                        <RotaryDial
                          color="gold"
                          size="sm"
                          options={['LOW', 'MED', 'HIGH']}
                          defaultIndex={1}
                          onChange={(idx, label) => console.log('3-option dial:', label)}
                        />
                        <span className="text-xs text-yellow-400 uppercase tracking-wider">3 Options</span>
                      </div>

                      {/* 6 Options - Cyan */}
                      <div className="flex flex-col items-center gap-2">
                        <RotaryDial
                          color="cyan"
                          size="sm"
                          options={['OFF', '1', '2', '3', '4', '5']}
                          defaultIndex={3}
                          onChange={(idx, label) => console.log('6-option dial:', label)}
                        />
                        <span className="text-xs text-cyan-400 uppercase tracking-wider">6 Options</span>
                      </div>

                      {/* 10 Options - Silver */}
                      <div className="flex flex-col items-center gap-2">
                        <RotaryDial
                          color="silver"
                          size="sm"
                          options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']}
                          defaultIndex={5}
                          onChange={(idx, label) => console.log('10-option dial:', label)}
                        />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">10 Options</span>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Pradeepsaranbishnoi</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Silver variants</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm, md, lg</div>
                      <div><span className="text-zinc-500">Features:</span> Dynamic N-position rotary selector (any number of options), center pointer indicator, animated light/dot, 3D layered rings, auto-calculated divider lines, clickable labels</div>
                    </div>
                  </div>

                  {/* Glow Radio Stack */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glow Radio Stack
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-6 flex flex-wrap items-center justify-center gap-12 min-h-[250px]">
                      {/* Vertical Gold */}
                      <div className="flex flex-col items-center gap-4">
                        <GlowRadioStack
                          color="gold"
                          size="md"
                          options={['Low', 'Med', 'High']}
                          defaultIndex={1}
                          onChange={(idx, label) => console.log('Gold stack:', label)}
                        />
                        <span className="text-xs text-yellow-400 uppercase tracking-wider">Vertical</span>
                      </div>

                      {/* Vertical Cyan */}
                      <div className="flex flex-col items-center gap-4">
                        <GlowRadioStack
                          color="cyan"
                          size="md"
                          options={['1', '2', '3', '4', '5']}
                          defaultIndex={2}
                          onChange={(idx, label) => console.log('Cyan stack:', label)}
                        />
                        <span className="text-xs text-cyan-400 uppercase tracking-wider">5 Options</span>
                      </div>

                      {/* Horizontal Silver */}
                      <div className="flex flex-col items-center gap-4">
                        <GlowRadioStack
                          color="silver"
                          size="md"
                          orientation="horizontal"
                          options={['A', 'B', 'C', 'D']}
                          defaultIndex={0}
                          onChange={(idx, label) => console.log('Silver stack:', label)}
                        />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Horizontal</span>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Shoh2008</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Silver variants</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm, md, lg</div>
                      <div><span className="text-zinc-500">Features:</span> Positional glow indicator (above/at/below selection), scale animation on click, vertical/horizontal orientation, labeled options</div>
                    </div>
                  </div>

                  {/* Mek Carousel 3D - Full Width */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4 mek-component-full-width">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Mek Carousel 3D
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Display
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[450px]">
                      <MekCarousel3D
                        color="cyan"
                        size="lg"
                        speed="slow"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by ilkhoeri</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + Next.js Image</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Silver variants</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm, md, lg</div>
                      <div><span className="text-zinc-500">Features:</span> 3D perspective rotation, configurable speed (slow/normal/fast), adjustable tilt angle, Mek NFT images, glow reflection effect, GPU-accelerated (will-change, backface-visibility)</div>
                    </div>
                  </div>

                  {/* Mek Carousel 3D Square - Full Width */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4 mek-component-full-width">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Mek Carousel 3D Square
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Display
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[550px]">
                      <MekCarousel3DSquare
                        color="cyan"
                        size="lg"
                        speed="slow"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by ilkhoeri</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + Next.js Image</div>
                      <div><span className="text-zinc-500">Aspect Ratio:</span> Square (1:1) - for square Mek images</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Silver variants</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm (100px), md (140px), lg (180px)</div>
                      <div><span className="text-zinc-500">Features:</span> GPU-accelerated 3D rotation (will-change, backface-visibility), priority image loading, configurable speed/tilt</div>
                    </div>
                  </div>

                  {/* Star Burst Button */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Star Burst Button
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Button
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-black/60 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                      <StarBurstButton onClick={() => console.log('StarBurst clicked!')}>
                        Click Me
                      </StarBurstButton>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by augustin_4687</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind + CSS</div>
                      <div><span className="text-zinc-500">Colors:</span> Yellow (#facc15) with stone-800 (#292524) and stone-50 (#fafaf9)</div>
                      <div><span className="text-zinc-500">Features:</span> Rotating star-burst clip-path (40-point polygon), layered box-shadow stack (yellow/dark/light), hover press animation, animated dotted pattern overlay, focus/active outline states</div>
                    </div>
                  </div>

                  {/* Glowing Power Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glowing Power Switch
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex items-center justify-center gap-6 flex-wrap min-h-[300px]">
                      <div className="flex flex-col items-center gap-2">
                        <GlowingPowerSwitch glowColor="rgb(0, 212, 255)" />
                        <span className="text-xs text-zinc-500">Complete Blue</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <GlowingPowerSwitch glowColor="rgb(250, 182, 23)" />
                        <span className="text-xs text-zinc-500">Gold glow</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <GlowingPowerSwitch glowColor="rgb(74, 222, 128)" />
                        <span className="text-xs text-zinc-500">Green glow</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <GlowingPowerSwitch />
                        <span className="text-xs text-zinc-500">Default (white)</span>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by vinodjangid07</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Cyan glow (rgb(151, 243, 255)) default, configurable via glowColor prop</div>
                      <div><span className="text-zinc-500">Features:</span> Multi-layer box-shadow glow effect (inset + outer), power icon SVG with drop-shadow, smooth transitions, keyboard accessible, controlled/uncontrolled modes</div>
                    </div>
                  </div>

                  {/* Keycap Radio Group */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Keycap Radio Group
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-6 min-h-[400px]">
                      {/* 3 buttons */}
                      <div className="flex flex-col items-center gap-2">
                        <KeycapRadioGroup
                          options={[
                            { value: 'low', label: 'LOW' },
                            { value: 'mid', label: 'MID' },
                            { value: 'high', label: 'HIGH' },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                        <span className="text-xs text-zinc-500">3 buttons (blue)</span>
                      </div>
                      {/* 5 buttons */}
                      <div className="flex flex-col items-center gap-2">
                        <KeycapRadioGroup
                          options={[
                            { value: '1', label: '1' },
                            { value: '2', label: '2' },
                            { value: '3', label: '3' },
                            { value: '4', label: '4' },
                            { value: '5', label: '5' },
                          ]}
                          size="md"
                          accentColor="#fab617"
                          onChange={(val) => console.log('Selected:', val)}
                        />
                        <span className="text-xs text-zinc-500">5 buttons - medium (gold)</span>
                      </div>
                      {/* 7 buttons */}
                      <div className="flex flex-col items-center gap-2">
                        <KeycapRadioGroup
                          options={[
                            { value: 'sun', label: 'SUN' },
                            { value: 'mon', label: 'MON' },
                            { value: 'tue', label: 'TUE' },
                            { value: 'wed', label: 'WED' },
                            { value: 'thu', label: 'THU' },
                            { value: 'fri', label: 'FRI' },
                            { value: 'sat', label: 'SAT' },
                          ]}
                          size="sm"
                          accentColor="#00d4ff"
                          onChange={(val) => console.log('Selected:', val)}
                        />
                        <span className="text-xs text-zinc-500">7 buttons - small (complete blue)</span>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by m1her</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Blue (#258ac3) default, configurable via accentColor prop</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm (45px), md (58px), lg (70px default)</div>
                      <div><span className="text-zinc-500">Features:</span> 3D keycap press (perspective rotateX), back-side reveal, hover lift animation with glow, glowing text shadow, controlled/uncontrolled</div>
                    </div>
                  </div>

                  {/* Color Palette Picker */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Color Palette Picker
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[300px]">
                      {/* Mek Tycoon palette */}
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-xs text-zinc-500 mb-2">Mek Tycoon Colors</span>
                        <ColorPalettePicker
                          colors={[
                            { color: '#fab617', name: 'Primary Yellow' },
                            { color: '#00d4ff', name: 'Complete Blue' },
                            { color: '#22c55e', name: 'Success Green' },
                            { color: '#ef4444', name: 'Error Red' },
                            { color: '#a855f7', name: 'Purple' },
                            { color: '#f97316', name: 'Orange' },
                            { color: '#06b6d4', name: 'Cyan' },
                          ]}
                          onSelect={(color, name) => console.log('Selected:', name, color)}
                        />
                      </div>
                      {/* Rainbow palette */}
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-xs text-zinc-500 mb-2">Rainbow</span>
                        <ColorPalettePicker
                          colors={[
                            { color: '#ef4444', name: '#ef4444' },
                            { color: '#f97316', name: '#f97316' },
                            { color: '#eab308', name: '#eab308' },
                            { color: '#22c55e', name: '#22c55e' },
                            { color: '#06b6d4', name: '#06b6d4' },
                            { color: '#3b82f6', name: '#3b82f6' },
                            { color: '#8b5cf6', name: '#8b5cf6' },
                            { color: '#ec4899', name: '#ec4899' },
                          ]}
                          onSelect={(color) => console.log('Copied:', color)}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Cobp</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D perspective container, cascading hover scale effect (1.5x hovered, 1.3x adjacent, 1.15x next), tooltip on hover, click-to-copy with feedback, smooth cubic-bezier transitions</div>
                    </div>
                  </div>

                  {/* Color Palette Picker Smooth */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Color Palette (Smooth)
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                      {/* Mek Tycoon palette - Smooth */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-zinc-500">Mek Tycoon Colors (Smooth Z-Index)</span>
                        <ColorPalettePickerSmooth
                          colors={[
                            { color: '#fab617', name: 'Primary Yellow' },
                            { color: '#00d4ff', name: 'Complete Blue' },
                            { color: '#22c55e', name: 'Success Green' },
                            { color: '#ef4444', name: 'Error Red' },
                            { color: '#a855f7', name: 'Purple' },
                            { color: '#f97316', name: 'Orange' },
                            { color: '#06b6d4', name: 'Cyan' },
                          ]}
                          onSelect={(color, name) => console.log('Selected:', name, color)}
                        />
                      </div>
                      {/* Rainbow palette - Smooth */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-zinc-500">Rainbow (Smooth Z-Index)</span>
                        <ColorPalettePickerSmooth
                          colors={[
                            { color: '#ef4444', name: '#ef4444' },
                            { color: '#f97316', name: '#f97316' },
                            { color: '#eab308', name: '#eab308' },
                            { color: '#22c55e', name: '#22c55e' },
                            { color: '#06b6d4', name: '#06b6d4' },
                            { color: '#3b82f6', name: '#3b82f6' },
                            { color: '#8b5cf6', name: '#8b5cf6' },
                            { color: '#ec4899', name: '#ec4899' },
                          ]}
                          onSelect={(color) => console.log('Copied:', color)}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Cobp (improved)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Animation:</span> Sequential: slide UP first (35px), THEN scale (1.4x) - no overlap</div>
                      <div><span className="text-zinc-500">Hover Fix:</span> Stable invisible hit zone (48x70px) prevents flickering</div>
                      <div><span className="text-zinc-500">Mobile:</span> Gradient slider to scrub through colors (showSlider prop)</div>
                    </div>
                  </div>

                  {/* Flip Toggle Switch */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        3D Flip Toggle
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[280px]">
                      {/* Size variants */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Small</span>
                        <FlipToggleSwitch size="sm" leftLabel="OFF" rightLabel="ON" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Medium (Default)</span>
                        <FlipToggleSwitch size="md" leftLabel="OFF" rightLabel="ON" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Large with Custom Color</span>
                        <FlipToggleSwitch size="lg" leftLabel="NO" rightLabel="YES" accentColor="#fab617" />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by r7chardgh</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> 3D flip effect using rotateY/rotateX, perspective transforms, size variants (sm/md/lg), customizable labels and accent color</div>
                    </div>
                  </div>

                  {/* Glider Radio */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glider Radio
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-wrap items-start justify-center gap-12 min-h-[300px]">
                      {/* Gold variant */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500 mb-2">Gold</span>
                        <GliderRadio
                          color="gold"
                          options={[
                            { value: 'easy', label: 'Easy Mode' },
                            { value: 'normal', label: 'Normal Mode' },
                            { value: 'hard', label: 'Hard Mode' },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                      {/* Cyan variant */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500 mb-2">Cyan</span>
                        <GliderRadio
                          color="cyan"
                          options={[
                            { value: 'bronze', label: 'Bronze' },
                            { value: 'silver', label: 'Silver' },
                            { value: 'gold', label: 'Gold' },
                            { value: 'platinum', label: 'Platinum' },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                      {/* Lime variant */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500 mb-2">Lime</span>
                        <GliderRadio
                          color="lime"
                          options={[
                            { value: 'option1', label: 'First Choice' },
                            { value: 'option2', label: 'Second Choice' },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Smit-Prajapati</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Lime, Purple variants</div>
                      <div><span className="text-zinc-500">Features:</span> Vertical sliding glider, cubic-bezier bounce animation, glow blur effect, dynamic option count</div>
                    </div>
                  </div>

                  {/* Pressed Button Radio */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Pressed Button Radio
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[300px]">
                      {/* Small */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Small</span>
                        <PressedButtonRadio
                          size="sm"
                          options={[
                            { value: 'off', label: 'OFF' },
                            { value: 'on', label: 'ON' },
                          ]}
                        />
                      </div>
                      {/* Medium (default) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Medium (Default)</span>
                        <PressedButtonRadio
                          options={[
                            { value: 'easy', label: 'Easy' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'hard', label: 'Hard' },
                          ]}
                          glowColor="#fab617"
                        />
                      </div>
                      {/* Large */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Large with Custom Glow</span>
                        <PressedButtonRadio
                          size="lg"
                          options={[
                            { value: 'bronze', label: 'Bronze' },
                            { value: 'silver', label: 'Silver' },
                            { value: 'gold', label: 'Gold' },
                            { value: 'plat', label: 'Platinum' },
                          ]}
                          glowColor="#22c55e"
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by m1her</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Pressed button effect with shadow removal on select, glow behind active item, size variants (sm/md/lg), custom glow color</div>
                    </div>
                  </div>

                  {/* Glowing Border Input */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Glowing Border Input
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Input
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-10 min-h-[350px]">
                      {/* Purple (default) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Purple (Default)</span>
                        <GlowingBorderInput
                          placeholder="Search Mekanisms..."
                          accentColor="purple"
                        />
                      </div>
                      {/* Cyan */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Cyan</span>
                        <GlowingBorderInput
                          placeholder="Find variations..."
                          accentColor="cyan"
                          showFilterButton={false}
                        />
                      </div>
                      {/* Gold */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Gold</span>
                        <GlowingBorderInput
                          placeholder="Search marketplace..."
                          accentColor="gold"
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by Lakshay-art</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Multi-layer rotating conic gradient border, hover/focus animations, filter button with spinning border, color variants (purple/cyan/gold), glow effects</div>
                    </div>
                  </div>

                  {/* Progressive Blur */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Progressive Blur
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Effect
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-4 flex flex-col gap-6 min-h-[400px]">
                      {/* Bottom blur example */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Bottom Blur (30%)</span>
                        <div className="relative w-full h-[150px] overflow-hidden rounded-lg">
                          <img
                            src={getMediaUrl("/mek-images/500px/bc2-dm1-ap1.webp")}
                            alt="Demo"
                            className="w-full h-full object-cover"
                          />
                          <ProgressiveBlur position="bottom" height="30%" />
                        </div>
                      </div>

                      {/* Top blur example */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Top Blur (25%)</span>
                        <div className="relative w-full h-[150px] overflow-hidden rounded-lg">
                          <img
                            src={getMediaUrl("/mek-images/500px/dp2-bf4-il2.webp")}
                            alt="Demo"
                            className="w-full h-full object-cover"
                          />
                          <ProgressiveBlur position="top" height="25%" />
                        </div>
                      </div>

                      {/* Both blur example */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Both Edges</span>
                        <div className="relative w-full h-[150px] overflow-hidden rounded-lg">
                          <img
                            src={getMediaUrl("/mek-images/500px/hb1-gn1-hn1.webp")}
                            alt="Demo"
                            className="w-full h-full object-cover"
                          />
                          <ProgressiveBlur position="both" />
                        </div>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Motion Primitives</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Features:</span> Multi-layer backdrop blur with mask gradients, configurable position (top/bottom/both), adjustable height, customizable blur levels [0.5, 1, 2, 4, 8, 16, 32, 64]</div>
                    </div>
                  </div>

                  {/* Number Ticker */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Number Ticker
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Animation
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[300px]">
                      {/* Large gold counter */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Gold Counter (Count Up)</span>
                        <div className="flex items-baseline gap-1">
                          <NumberTicker
                            value={1234567}
                            className="text-5xl font-bold text-yellow-400"
                          />
                          <span className="text-yellow-400/60 text-xl">G</span>
                        </div>
                      </div>

                      {/* Percentage with decimals */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Percentage (2 decimals, delayed)</span>
                        <div className="flex items-baseline">
                          <NumberTicker
                            value={97.85}
                            decimalPlaces={2}
                            delay={0.5}
                            className="text-4xl font-bold text-cyan-400"
                          />
                          <span className="text-cyan-400/60 text-2xl ml-1">%</span>
                        </div>
                      </div>

                      {/* Count down */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Countdown (from 100)</span>
                        <NumberTicker
                          value={0}
                          startValue={100}
                          direction="down"
                          delay={1}
                          className="text-3xl font-bold text-red-400"
                        />
                      </div>

                      {/* Small inline example */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Inline Usage</span>
                        <p className="text-zinc-300">
                          You have collected{' '}
                          <NumberTicker value={42} className="text-green-400 font-bold" />{' '}
                          Mekanisms worth{' '}
                          <NumberTicker value={8500} className="text-yellow-400 font-bold" />{' '}
                          gold.
                        </p>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Motion Primitives (vanilla React port)</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript (no dependencies)</div>
                      <div><span className="text-zinc-500">Features:</span> Spring physics animation, count up/down direction, configurable delay, decimal places, Intl.NumberFormat support, triggers on scroll into view</div>
                    </div>
                  </div>

                  {/* Mek Flip Card */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Mek Flip Card
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Card
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-wrap items-center justify-center gap-8 min-h-[350px]">
                      {/* Gold variant */}
                      <MekFlipCard
                        color="gold"
                        imageSrc="/mek-images/500px/bc2-dm1-ap1.webp"
                        badge="LEGENDARY"
                        title="Bumblebee"
                        subtitle="#0042"
                        description="A rare gold-plated Mekanism with enhanced power core."
                        footer="MEK TYCOON 2025"
                      />
                      {/* Cyan variant */}
                      <MekFlipCard
                        color="cyan"
                        imageSrc="/mek-images/500px/dp2-bf4-il2.webp"
                        badge="EPIC"
                        title="Deep Sea"
                        subtitle="#0108"
                        description="Ocean-forged circuits with aquatic defense systems."
                        footer="MEK TYCOON 2025"
                      />
                      {/* Purple variant */}
                      <MekFlipCard
                        color="purple"
                        imageSrc="/mek-images/500px/hb1-gn1-hn1.webp"
                        badge="RARE"
                        title="Phantom"
                        subtitle="#0256"
                        description="Shadow-class unit with stealth capabilities."
                        footer="MEK TYCOON 2025"
                      />
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by ElSombrero2</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Lime, Purple variants</div>
                      <div><span className="text-zinc-500">Features:</span> 3D flip on hover, rotating gradient border, floating orbs animation, mek image display, badge/title/description overlay</div>
                    </div>
                  </div>

                  {/* Push Button Radio */}
                  <div className="mek-card-industrial mek-border-sharp-gold rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
                      <h3 className="font-orbitron text-lg font-bold text-yellow-400 uppercase tracking-wider">
                        Push Button Radio
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        Control
                      </span>
                    </div>

                    {/* Component Preview */}
                    <div className="bg-zinc-900 rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[300px]">
                      {/* Cyan (default) */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Cyan - Medium</span>
                        <PushButtonRadio
                          color="cyan"
                          options={[
                            { value: 'star', icon: <PushButtonIcons.Star /> },
                            { value: 'heart', icon: <PushButtonIcons.Heart /> },
                            { value: 'bolt', icon: <PushButtonIcons.Bolt /> },
                            { value: 'flame', icon: <PushButtonIcons.Flame /> },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                      {/* Gold - Large */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Gold - Large</span>
                        <PushButtonRadio
                          color="gold"
                          size="lg"
                          options={[
                            { value: 'check', icon: <PushButtonIcons.Check /> },
                            { value: 'gear', icon: <PushButtonIcons.Gear /> },
                            { value: 'star', icon: <PushButtonIcons.Star /> },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                      {/* Purple - Small */}
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-500">Purple - Small</span>
                        <PushButtonRadio
                          color="purple"
                          size="sm"
                          options={[
                            { value: 'heart', icon: <PushButtonIcons.Heart /> },
                            { value: 'star', icon: <PushButtonIcons.Star /> },
                            { value: 'flame', icon: <PushButtonIcons.Flame /> },
                            { value: 'bolt', icon: <PushButtonIcons.Bolt /> },
                            { value: 'gear', icon: <PushButtonIcons.Gear /> },
                          ]}
                          onChange={(val) => console.log('Selected:', val)}
                        />
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div><span className="text-zinc-500">Source:</span> Uiverse.io by adamgiebl</div>
                      <div><span className="text-zinc-500">Transformed:</span> React/TypeScript/Tailwind</div>
                      <div><span className="text-zinc-500">Colors:</span> Gold, Cyan, Lime, Purple variants</div>
                      <div><span className="text-zinc-500">Sizes:</span> sm (40px), md (50px), lg (60px)</div>
                      <div><span className="text-zinc-500">Features:</span> 3D push effect with shadow/edge/front layers, bright flash glow on click, hover lift, glow shadow, includes 6 built-in icons</div>
                    </div>
                  </div>

                </div>
              </div>
          </div>
          )}

          {activeTab === 'deployments' && (
          <div id="section-deployments" className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50">
            <div className="p-6">
              <DeploymentsAdmin />
            </div>
          </div>
          )}

          {activeTab === 'new-styling' && (
          <div id="section-new-styling" className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50">
            <NewStylingAdmin />
          </div>
          )}

          {activeTab === 'messaging-system' && (
          <div id="section-messaging-system" className="mek-card-industrial mek-border-sharp-gold rounded-lg shadow-lg shadow-black/50 overflow-hidden">
            <MessagingSystemAdmin />
          </div>
          )}

          {activeTab === 'rarity-bias' && (
          <RarityBiasAdmin />
          )}

          {activeTab === 'universal-background' && (
            <UniversalBackgroundAdmin />
          )}

          {activeTab === 'coach-marks' && (
            <CoachMarksAdmin />
          )}

        </div>
      </div>

      {/* Game Data Lightbox */}
      <GameDataLightbox
        isOpen={showGameDataLightbox}
        onClose={() => setShowGameDataLightbox(false)}
      />

      {/* Slot Configuration Save Modal */}
      {mounted && showSaveModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-black/90 border-2 border-green-500/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg shadow-green-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider">Save Slot Configuration</h3>
            <p className="text-sm text-gray-400 mb-4">
              This will save all 3 slot types (Basic, Advanced, Master) together.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter configuration name..."
              className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/50 rounded text-yellow-300 mb-6 focus:border-yellow-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveName.trim()) {
                  handleSaveConfiguration();
                } else if (e.key === 'Escape') {
                  setShowSaveModal(false);
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveConfiguration}
                disabled={!saveName.trim()}
                className="flex-1 px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 font-bold uppercase tracking-wider rounded hover:bg-green-500/30 hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600/20 border-2 border-gray-500/50 text-gray-400 font-bold uppercase tracking-wider rounded hover:bg-gray-600/30 hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Production Bypass Links Lightbox */}
      {mounted && showBypassLinks && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
          onClick={() => setShowBypassLinks(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Production Bypass Links</h2>
              <button
                onClick={() => setShowBypassLinks(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Click the copy icon to copy URL with bypass parameter
            </p>
            <div className="space-y-2">
              {BYPASS_LINKS.map((link: any) => {
                const fullUrl = `${PRODUCTION_URL}${link.path}?bypass=${BYPASS_SECRET}`;
                return (
                  <div
                    key={link.path}
                    className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
                  >
                    <div>
                      <div className="text-white font-medium">{link.name}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[300px]">{fullUrl}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(fullUrl);
                        setCopiedUrl(link.path);
                        setTimeout(() => setCopiedUrl(null), 2000);
                      }}
                      className="ml-2 p-2 hover:bg-gray-700 rounded transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === link.path ? (
                        <span className="text-green-400 text-sm">Copied!</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 hover:text-white">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Campaign Manager Component (Always uses Production)
function CampaignManagerWithDatabase({
  campaigns,
  onToggleCleanup,
  onRunCleanup,
  onSyncCounters,
  onVerifyWithNMKR,
  onBackfillSoldNFTData,
  onBackfillImages,
  onFetchFromNMKR,
  cleaningCampaignId,
  syncingCampaignId,
  verifyingCampaignId,
  backfillRunning,
  backfillImagesRunning,
  fetchingFromNMKRCampaignId,
  client,
  mutationsEnabled
}: {
  campaigns: any[];
  onToggleCleanup: (campaignId: string, enabled: boolean) => Promise<void>;
  onRunCleanup: (campaignId: string) => Promise<void>;
  onSyncCounters: (campaignId: string) => Promise<void>;
  onVerifyWithNMKR: (campaignId: string, campaignName: string, nmkrProjectId?: string) => Promise<void>;
  onBackfillSoldNFTData: () => Promise<void>;
  onBackfillImages: (campaignId: string, nmkrProjectId: string) => Promise<void>;
  onFetchFromNMKR: (campaignId: string, nmkrProjectId: string) => Promise<void>;
  cleaningCampaignId: string | null;
  syncingCampaignId: string | null;
  verifyingCampaignId: string | null;
  backfillRunning: boolean;
  backfillImagesRunning: string | null;
  fetchingFromNMKRCampaignId: string | null;
  client: any;
  mutationsEnabled: boolean;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const [snapshots, setSnapshots] = useState<Array<{ _id: string; snapshotName: string; eligibleUsers?: any[] }>>([]);
  const [assigningSnapshotCampaignId, setAssigningSnapshotCampaignId] = useState<string | null>(null);
  const [updatingMintLimitCampaignId, setUpdatingMintLimitCampaignId] = useState<string | null>(null);

  // Auto-select first campaign when campaigns load or change
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0]._id);
    }
  }, [campaigns, selectedCampaignId]);

  // Fetch snapshots for the dropdown
  useEffect(() => {
    if (!client) return;
    const fetchSnapshots = async () => {
      try {
        const data = await client.query(api.whitelists.getAllSnapshots, {});
        setSnapshots(data || []);
      } catch (error) {
        console.error('[CampaignManagerWithDatabase] Error fetching snapshots:', error);
      }
    };
    fetchSnapshots();
  }, [client]);

  // Handle snapshot assignment
  const handleSnapshotAssignment = async (campaignId: string, snapshotId: string | null) => {
    if (!client) return;
    if (!mutationsEnabled) {
      alert('Please click "Enable Editing" first to modify campaign settings.');
      return;
    }
    setAssigningSnapshotCampaignId(campaignId);
    try {
      await client.mutation(api.campaigns.assignEligibilitySnapshot, {
        campaignId,
        snapshotId: snapshotId || undefined,
      });
    } catch (error) {
      console.error('[CampaignManagerWithDatabase] Error assigning snapshot:', error);
    } finally {
      setAssigningSnapshotCampaignId(null);
    }
  };

  const handleMintLimitToggle = async (campaignId: string, allowMultipleMints: boolean) => {
    if (!client) return;
    if (!mutationsEnabled) {
      alert('Please click "Enable Editing" first to modify campaign settings.');
      return;
    }
    setUpdatingMintLimitCampaignId(campaignId);
    try {
      await client.mutation(api.campaigns.updateAllowMultipleMints, {
        campaignId,
        allowMultipleMints,
      });
    } catch (error) {
      console.error('[CampaignManagerWithDatabase] Error updating mint limit:', error);
    } finally {
      setUpdatingMintLimitCampaignId(null);
    }
  };

  const selectedCampaign = campaigns.find((c: any) => c._id === selectedCampaignId);

  return (
    <div className="space-y-6">
      {/* Campaign Cards */}
      {campaigns.length === 0 ? (
        <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-400">
            No campaigns found in production database.
          </div>
        </div>
      ) : (
        campaigns.map((campaign: any) => (
          <div key={campaign._id}>
            <div
              className={`bg-black/30 border rounded-lg p-6 cursor-pointer transition-all ${
                selectedCampaignId === campaign._id
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                  : 'border-yellow-500/30 hover:border-yellow-500/60'
              }`}
              onClick={() => setSelectedCampaignId(
                selectedCampaignId === campaign._id ? undefined : campaign._id
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">{campaign.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{campaign.description || 'No description'}</p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold ${
                  campaign.status === 'active' ? 'bg-green-900/30 text-green-400' :
                  campaign.status === 'paused' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-gray-900/30 text-gray-400'
                }`}>
                  {campaign.status.toUpperCase()}
                </div>
              </div>

              {/* Eligibility Snapshot Selector */}
              <div className={`mb-4 p-3 bg-black/40 rounded border ${mutationsEnabled ? 'border-purple-500/30' : 'border-gray-600/30 opacity-60'}`} onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs text-gray-400 mb-2">
                  Eligibility Snapshot
                  <span className="text-purple-400 ml-2">(Who can claim from this campaign)</span>
                  {!mutationsEnabled && <span className="text-red-400 ml-2">(Enable editing first)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={campaign.eligibilitySnapshotId || ""}
                    onChange={(e) => handleSnapshotAssignment(campaign._id, e.target.value || null)}
                    disabled={!mutationsEnabled || assigningSnapshotCampaignId === campaign._id}
                    className={`flex-1 bg-black/50 border border-gray-600 rounded p-2 text-sm text-white ${!mutationsEnabled ? 'cursor-not-allowed' : ''}`}
                  >
                    <option value="">-- No Snapshot (Claims Disabled) --</option>
                    {snapshots.map((snapshot: any) => (
                      <option key={snapshot._id} value={snapshot._id}>
                        {snapshot.snapshotName} ({snapshot.eligibleUsers?.length || 0} users)
                      </option>
                    ))}
                  </select>
                  {assigningSnapshotCampaignId === campaign._id && (
                    <span className="text-xs text-purple-400 animate-pulse">Saving...</span>
                  )}
                </div>
                {campaign.eligibilitySnapshotId ? (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ Users in this snapshot can claim NFTs from this campaign
                  </p>
                ) : (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠ No snapshot assigned - nobody can claim from this campaign
                  </p>
                )}
              </div>

              {/* Mint Limit Toggle */}
              <div className={`mb-4 p-3 bg-black/40 rounded border ${mutationsEnabled ? 'border-orange-500/30' : 'border-gray-600/30 opacity-60'}`} onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs text-gray-400 mb-2">
                  Mint Limit per Corporation
                  <span className="text-orange-400 ml-2">(How many times each corp can claim)</span>
                  {!mutationsEnabled && <span className="text-red-400 ml-2">(Enable editing first)</span>}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMintLimitToggle(campaign._id, false)}
                    disabled={!mutationsEnabled || updatingMintLimitCampaignId === campaign._id}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      !mutationsEnabled ? 'opacity-50 cursor-not-allowed' :
                      !campaign.allowMultipleMints
                        ? 'bg-orange-600 text-white border-2 border-orange-400'
                        : 'bg-black/50 text-gray-400 border border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    One per Corp
                  </button>
                  <button
                    onClick={() => handleMintLimitToggle(campaign._id, true)}
                    disabled={!mutationsEnabled || updatingMintLimitCampaignId === campaign._id}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      !mutationsEnabled ? 'opacity-50 cursor-not-allowed' :
                      campaign.allowMultipleMints
                        ? 'bg-green-600 text-white border-2 border-green-400'
                        : 'bg-black/50 text-gray-400 border border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    Unlimited
                  </button>
                  {updatingMintLimitCampaignId === campaign._id && (
                    <span className="text-xs text-orange-400 animate-pulse">Saving...</span>
                  )}
                </div>
                {campaign.allowMultipleMints ? (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ Corporations can mint multiple NFTs from this campaign (good for testing)
                  </p>
                ) : (
                  <p className="text-xs text-orange-400 mt-2">
                    ⚠ Each corporation can only mint once from this campaign
                  </p>
                )}
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-black/50 rounded p-3">
                  <div className="text-xs text-gray-400">Total NFTs</div>
                  <div className="text-lg font-bold text-white">{campaign.totalNFTs}</div>
                </div>
                <div className="bg-black/50 rounded p-3">
                  <div className="text-xs text-gray-400">Available</div>
                  <div className="text-lg font-bold text-green-400">{campaign.availableNFTs}</div>
                </div>
                <div className="bg-black/50 rounded p-3">
                  <div className="text-xs text-gray-400">Reserved</div>
                  <div className="text-lg font-bold text-yellow-400">{campaign.reservedNFTs}</div>
                </div>
                <div className="bg-black/50 rounded p-3">
                  <div className="text-xs text-gray-400">Sold</div>
                  <div className="text-lg font-bold text-cyan-400">{campaign.soldNFTs}</div>
                </div>
              </div>

              {/* Cleanup Toggle Button */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCleanup(
                      campaign._id,
                      campaign.enableReservationCleanup === false
                    );
                  }}
                  className="text-xs text-gray-400 hover:text-yellow-400 transition-colors underline"
                  title="Toggle automatic cleanup of expired reservations"
                >
                  {campaign.enableReservationCleanup !== false ? '🗑️ Disable Cleanup' : '✅ Enable Cleanup'}
                </button>
                <span className="text-xs text-gray-500">
                  (Cron runs hourly)
                </span>
                <span className="text-gray-600">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunCleanup(campaign._id);
                  }}
                  disabled={cleaningCampaignId === campaign._id}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors underline disabled:opacity-50"
                  title="Manually run cleanup to release any expired reservations now"
                >
                  {cleaningCampaignId === campaign._id ? '⏳ Cleaning...' : '🧹 Run Cleanup Now'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncCounters(campaign._id);
                  }}
                  disabled={syncingCampaignId === campaign._id}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline disabled:opacity-50"
                  title="Recalculate counters from actual inventory (fixes mismatched counts)"
                >
                  {syncingCampaignId === campaign._id ? '⏳ Syncing...' : '🔄 Sync Counters'}
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerifyWithNMKR(campaign._id, campaign.name, campaign.nmkrProjectId);
                  }}
                  disabled={verifyingCampaignId === campaign._id}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline disabled:opacity-50"
                  title="Query NMKR API to verify inventory statuses match"
                >
                  {verifyingCampaignId === campaign._id ? '⏳ Verifying...' : '🔍 Verify with NMKR'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBackfillSoldNFTData();
                  }}
                  disabled={backfillRunning}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors underline disabled:opacity-50"
                  title="Populate Claimed By and Corporation for sold NFTs from reservation records"
                >
                  {backfillRunning ? '⏳ Backfilling...' : '📋 Backfill Data'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (campaign.nmkrProjectId) {
                      onBackfillImages(campaign._id, campaign.nmkrProjectId);
                    } else {
                      alert('⚠️ This campaign has no NMKR Project ID configured.');
                    }
                  }}
                  disabled={backfillImagesRunning === campaign._id}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline disabled:opacity-50"
                  title="Fetch and populate NFT images from NMKR"
                >
                  {backfillImagesRunning === campaign._id ? '⏳ Loading Images...' : '🖼️ Backfill Images'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (campaign.nmkrProjectId) {
                      onFetchFromNMKR(campaign._id, campaign.nmkrProjectId);
                    } else {
                      alert('⚠️ This campaign has no NMKR Project ID configured.');
                    }
                  }}
                  disabled={fetchingFromNMKRCampaignId === campaign._id}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors underline disabled:opacity-50"
                  title="Import new NFTs from NMKR into campaign inventory"
                >
                  {fetchingFromNMKRCampaignId === campaign._id ? '⏳ Importing...' : '📥 Import from NMKR'}
                </button>
                {selectedCampaignId === campaign._id && (
                  <span className="text-xs text-yellow-400 ml-auto">
                    👇 View NFTs below
                  </span>
                )}
              </div>
            </div>

            {/* NFT Inventory Table - shown when campaign is selected */}
            {selectedCampaignId === campaign._id && selectedCampaign && (
              <div className="mt-4 ml-8">
                <NFTInventoryTable
                  campaignId={campaign._id}
                  campaignName={campaign.name}
                  client={client}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// NFT Admin Sub-Tabs Component - SIMPLIFIED FOR SINGLE DATABASE
function NFTAdminTabs({ client }: { client: any }) {
  const [nftSubTab, setNftSubTab] = useState<'commemorative' | 'whitelist-manager' | 'json-generator' | 'campaigns'>('json-generator');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignUpdateTrigger, setCampaignUpdateTrigger] = useState(0);
  const [cleaningCampaignId, setCleaningCampaignId] = useState<string | null>(null);
  const [syncingCampaignId, setSyncingCampaignId] = useState<string | null>(null);
  const [mutationsEnabled, setMutationsEnabled] = useState(false);

  // NMKR Sync modal state
  const [nmkrSyncModalOpen, setNmkrSyncModalOpen] = useState(false);
  const [nmkrSyncCampaign, setNmkrSyncCampaign] = useState<{ id: string; name: string; nmkrProjectId?: string } | null>(null);
  const [nmkrDiscrepancies, setNmkrDiscrepancies] = useState<any[]>([]);
  const [nmkrSyncing, setNmkrSyncing] = useState(false);
  const [nmkrVerifying, setNmkrVerifying] = useState<string | null>(null);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillImagesRunning, setBackfillImagesRunning] = useState<string | null>(null);
  const [fetchingFromNMKRCampaignId, setFetchingFromNMKRCampaignId] = useState<string | null>(null);

  // Mutation confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    isLoading: false,
  });

  // Fetch campaigns from production database (only when campaigns tab is active)
  useEffect(() => {
    if (nftSubTab !== 'campaigns') return;
    if (!client) return;

    let cancelled = false;

    const fetchCampaigns = async () => {
      try {
        const data = await client.query(api.campaigns.getAllCampaigns, {});
        if (!cancelled) {
          setCampaigns(data || []);
        }
      } catch (error) {
        console.error('[NFTAdminTabs] Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [nftSubTab, client, campaignUpdateTrigger]);

  const handleToggleCleanup = async (campaignId: string, enabled: boolean) => {
    if (!client) return;

    if (!mutationsEnabled) {
      alert('Mutations are disabled. Enable editing first using the banner above.');
      return;
    }

    const campaign = campaigns.find((c: any) => c._id === campaignId);
    setConfirmDialog({
      isOpen: true,
      title: enabled ? 'Enable Reservation Cleanup' : 'Disable Reservation Cleanup',
      description: `This will ${enabled ? 'enable' : 'disable'} automatic cleanup of expired reservations for "${campaign?.name || 'this campaign'}".`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await client.mutation(api.commemorativeNFTReservationsCampaign.toggleCampaignReservationCleanup, {
            campaignId,
            enabled
          });
          setCampaignUpdateTrigger(prev => prev + 1);
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error: any) {
          console.error('[NFTAdminTabs] Error toggling cleanup:', error);
          alert(`Error: ${error.message}`);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleRunCleanup = async (campaignId: string) => {
    if (!client) return;

    if (!mutationsEnabled) {
      alert('Mutations are disabled. Enable editing first using the banner above.');
      return;
    }

    const campaign = campaigns.find((c: any) => c._id === campaignId);
    setConfirmDialog({
      isOpen: true,
      title: 'Run Cleanup Now',
      description: `This will immediately release any expired reservations for "${campaign?.name || 'this campaign'}" and sync counters.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        setCleaningCampaignId(campaignId);
        try {
          await client.mutation(api.commemorativeNFTReservationsCampaign.cleanupExpiredCampaignReservationsMutation, {
            campaignId
          });
          await client.mutation(api.commemorativeCampaigns.syncCampaignCounters, {
            campaignId
          });
          setCampaignUpdateTrigger(prev => prev + 1);
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error: any) {
          console.error('[NFTAdminTabs] Error running cleanup:', error);
          alert(`Error: ${error.message}`);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
        } finally {
          setCleaningCampaignId(null);
        }
      },
    });
  };

  const handleSyncCounters = async (campaignId: string) => {
    if (!client) return;

    if (!mutationsEnabled) {
      alert('Mutations are disabled. Enable editing first using the banner above.');
      return;
    }

    const campaign = campaigns.find((c: any) => c._id === campaignId);
    setConfirmDialog({
      isOpen: true,
      title: 'Sync Campaign Counters',
      description: `This will recalculate all counters (available, reserved, sold) for "${campaign?.name || 'this campaign'}" from actual inventory data.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        setSyncingCampaignId(campaignId);
        try {
          await client.mutation(api.commemorativeCampaigns.syncCampaignCounters, {
            campaignId
          });
          setCampaignUpdateTrigger(prev => prev + 1);
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error: any) {
          console.error('[NFTAdminTabs] Error syncing counters:', error);
          alert(`Error: ${error.message}`);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
        } finally {
          setSyncingCampaignId(null);
        }
      },
    });
  };

  // NMKR Verify handler - queries NMKR API and compares with Convex
  const handleVerifyWithNMKR = async (campaignId: string, campaignName: string, nmkrProjectId?: string) => {
    console.log('[🔍DEBUG] handleVerifyWithNMKR called with:', { campaignId, campaignName, nmkrProjectId });

    if (!nmkrProjectId) {
      alert('This campaign does not have an NMKR Project ID configured.');
      return;
    }

    setNmkrVerifying(campaignId);
    setNmkrSyncCampaign({ id: campaignId, name: campaignName, nmkrProjectId });

    try {
      // 1. Fetch NMKR statuses from our API route (keeps API key server-side)
      console.log('[🔍DEBUG] Making fetch to /api/nmkr/sync with projectUid:', nmkrProjectId);
      const response = await fetch('/api/nmkr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: nmkrProjectId }),
      });
      console.log('[🔍DEBUG] Response status:', response.status, response.ok);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch NMKR data');
      }

      const nmkrData = await response.json();
      console.log('[🔄NMKR] Fetched NMKR data:', nmkrData.summary);

      // 2. Query Convex to get discrepancies
      const discrepancies = await client.query(api.nmkrSync.getInventoryDiscrepancies, {
        campaignId,
        nmkrStatuses: nmkrData.statuses,
      });

      console.log('[🔄NMKR] Found discrepancies:', discrepancies.length);
      setNmkrDiscrepancies(discrepancies);
      setNmkrSyncModalOpen(true);
    } catch (error: any) {
      console.error('[🔄NMKR] Error verifying:', error);
      alert(`Error verifying with NMKR: ${error.message}`);
    } finally {
      setNmkrVerifying(null);
    }
  };

  // NMKR Sync single NFT handler
  const handleSyncSingleNFT = async (nftUid: string) => {
    if (!nmkrSyncCampaign?.nmkrProjectId) return;

    try {
      // Find the discrepancy for this NFT
      const discrepancy = nmkrDiscrepancies.find((d: any) => d.nftUid === nftUid);
      if (!discrepancy) return;

      console.log('[🔄NMKR] Attempting to sync NFT:', {
        nftUid,
        nmkrStatus: discrepancy.nmkrStatus,
        soldTo: discrepancy.nmkrSoldTo,
        targetDatabase: 'Sturgeon (production)',
      });

      // Sync the single NFT - IMPORTANT: Pass campaignId to ensure we update the correct record
      const result = await client.mutation(api.nmkrSync.syncSingleNFT, {
        nftUid,
        nmkrStatus: discrepancy.nmkrStatus,
        soldTo: discrepancy.nmkrSoldTo,
        campaignId: nmkrSyncCampaign.id as any, // Prevents updating orphaned records
      });

      console.log('[🔄NMKR] Sync result:', result);

      // Validate the result
      if (result && result.success) {
        console.log('[🔄NMKR] ✅ Successfully synced NFT:', {
          nftUid,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
        });

        // DIAGNOSTIC: Immediately re-query the inventory to see if it actually changed
        console.log('[🔄NMKR] 🔍 DIAGNOSTIC: Re-querying inventory to verify change...');
        try {
          const freshInventory = await client.query(api.commemorativeCampaigns.getCampaignInventory, {
            campaignId: nmkrSyncCampaign.id as any,
          });
          const updatedNft = freshInventory.find((n: any) => n.nftUid === nftUid);
          console.log('[🔄NMKR] 🔍 DIAGNOSTIC: Fresh query result for this NFT:', updatedNft ? {
            name: updatedNft.name,
            status: updatedNft.status,
            _id: updatedNft._id,
            nftUid: updatedNft.nftUid,
          } : 'NOT FOUND IN FRESH QUERY');

          if (updatedNft && updatedNft.status !== result.newStatus) {
            console.error('[🔄NMKR] ❌ MISMATCH! Mutation said newStatus:', result.newStatus, 'but fresh query shows:', updatedNft.status);
            console.error('[🔄NMKR] This could indicate:');
            console.error('[🔄NMKR] 1. Duplicate records in database');
            console.error('[🔄NMKR] 2. Query and mutation using different indexes/records');
            console.error('[🔄NMKR] 3. Different campaign IDs on Sturgeon vs local');
            alert(`⚠️ Data mismatch detected!\n\nMutation reported: ${result.newStatus}\nBut inventory query shows: ${updatedNft.status}\n\nThis indicates a database inconsistency. Check console for details.`);
          }
        } catch (verifyError) {
          console.error('[🔄NMKR] Error verifying change:', verifyError);
        }

        // Only remove from discrepancies if actually successful
        setNmkrDiscrepancies(prev => prev.filter((d: any) => d.nftUid !== nftUid));
        setCampaignUpdateTrigger(prev => prev + 1);
      } else {
        console.error('[🔄NMKR] ❌ Sync returned but was not successful:', result);
        alert(`Sync failed: The mutation returned but did not report success. Check console for details.`);
      }
    } catch (error: any) {
      console.error('[🔄NMKR] ❌ Error syncing NFT:', error);
      alert(`Error syncing NFT: ${error.message}\n\nThis might mean the nmkrSync functions are not deployed to Sturgeon (production). Check the Convex dashboard.`);
    }
  };

  // NMKR Sync all discrepancies handler
  const handleSyncAllNMKR = async () => {
    if (!nmkrSyncCampaign?.nmkrProjectId) return;

    setNmkrSyncing(true);
    try {
      // Re-fetch NMKR data to ensure fresh statuses
      const response = await fetch('/api/nmkr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: nmkrSyncCampaign.nmkrProjectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NMKR data');
      }

      const nmkrData = await response.json();

      // Sync all inventory
      await client.mutation(api.nmkrSync.syncCampaignInventory, {
        campaignId: nmkrSyncCampaign.id,
        nmkrStatuses: nmkrData.statuses,
      });

      // Clear discrepancies and close modal
      setNmkrDiscrepancies([]);
      setNmkrSyncModalOpen(false);
      setCampaignUpdateTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[🔄NMKR] Error syncing all:', error);
      alert(`Error syncing all: ${error.message}`);
    } finally {
      setNmkrSyncing(false);
    }
  };

  // Backfill sold NFT data handler - populates soldTo and companyNameAtSale from reservations
  const handleBackfillSoldNFTData = async () => {
    setBackfillRunning(true);
    try {
      const result = await client.mutation(api.commemorativeCampaigns.backfillSoldNFTData, {});
      console.log('[🔧BACKFILL] Result:', result);

      if (result.backfilled > 0) {
        alert(`✅ Backfilled ${result.backfilled} NFTs with missing data.\n\n${result.notFound > 0 ? `⚠️ ${result.notFound} NFTs could not be matched to reservations.` : 'All sold NFTs now have owner data.'}`);
      } else if (result.notFound > 0) {
        alert(`⚠️ Found ${result.notFound} sold NFTs with missing data, but no matching reservations were found.\n\nYou may need to use "Manual Set" for these NFTs.`);
      } else {
        alert('✅ All sold NFTs already have owner data. No backfill needed.');
      }

      setCampaignUpdateTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[🔧BACKFILL] Error:', error);
      alert(`Error backfilling data: ${error.message}`);
    } finally {
      setBackfillRunning(false);
    }
  };

  // Backfill images from NMKR handler
  const handleBackfillImages = async (campaignId: string, nmkrProjectId: string) => {
    setBackfillImagesRunning(campaignId);
    try {
      // Step 1: Fetch images from NMKR via API route
      console.log('[🖼️BACKFILL-IMAGES] Fetching images from NMKR...');
      const response = await fetch('/api/nmkr/backfill-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: nmkrProjectId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch images from NMKR');
      }

      const nmkrData = await response.json();
      console.log('[🖼️BACKFILL-IMAGES] NMKR response:', nmkrData);

      if (!nmkrData.images || nmkrData.images.length === 0) {
        alert('⚠️ No images found in NMKR for this project.');
        return;
      }

      // Step 2: Update inventory with images via Convex mutation
      console.log('[🖼️BACKFILL-IMAGES] Updating inventory with', nmkrData.images.length, 'images...');
      const result = await client.mutation(api.commemorativeCampaigns.backfillInventoryImages, {
        campaignId: campaignId as any,
        images: nmkrData.images.map((img: any) => ({
          nftUid: img.nftUid,
          imageUrl: img.imageUrl,
        })),
      });

      console.log('[🖼️BACKFILL-IMAGES] Result:', result);

      if (result.updated > 0) {
        alert(`✅ Updated ${result.updated} NFT images from NMKR.\n\n${result.skipped > 0 ? `⏭️ ${result.skipped} already had images.` : ''}${result.notFound > 0 ? `\n⚠️ ${result.notFound} NFTs not found in NMKR.` : ''}`);
      } else if (result.skipped > 0) {
        alert(`✅ All ${result.skipped} NFTs already have images. No update needed.`);
      } else {
        alert('⚠️ No images were updated. NFTs may not match NMKR UIDs.');
      }

      setCampaignUpdateTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('[🖼️BACKFILL-IMAGES] Error:', error);
      alert(`Error backfilling images: ${error.message}`);
    } finally {
      setBackfillImagesRunning(null);
    }
  };

  // Fetch all NFTs from NMKR and add to campaign inventory
  const handleFetchFromNMKR = async (campaignId: string, nmkrProjectId: string) => {
    if (!mutationsEnabled) {
      alert('Mutations are disabled. Enable editing first using the banner above.');
      return;
    }

    if (!nmkrProjectId) {
      alert('⚠️ This campaign has no NMKR Project ID configured.');
      return;
    }

    setFetchingFromNMKRCampaignId(campaignId);
    try {
      console.log('[🚀FETCH-NMKR] Fetching NFTs from NMKR project:', nmkrProjectId);

      // Fetch NFTs from NMKR API
      const response = await fetch('/api/nmkr/fetch-nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: nmkrProjectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch NFTs from NMKR');
      }

      const data = await response.json();
      console.log('[🚀FETCH-NMKR] NMKR response:', data);

      if (!data.nfts || data.nfts.length === 0) {
        alert('⚠️ No NFTs found in NMKR project.');
        return;
      }

      // Filter to only include "free" (available) NFTs
      const freeNfts = data.nfts.filter((nft: { state?: string }) => nft.state === 'free');

      if (freeNfts.length === 0) {
        alert(`⚠️ No available NFTs found.\n\n${data.nfts.length} total NFTs in NMKR, but all are reserved or sold.`);
        return;
      }

      console.log('[🚀FETCH-NMKR] Found', freeNfts.length, 'available NFTs. Adding to inventory...');

      // Use the new addNewNFTsToInventory mutation which handles duplicates
      const nfts = freeNfts.map((nft: { nftUid: string; nftNumber: number; name: string }) => ({
        nftUid: nft.nftUid,
        nftNumber: nft.nftNumber,
        name: nft.name,
        paymentUrl: undefined, // Will be generated by backend
      }));

      const result = await client.mutation(api.commemorativeNFTInventorySetup.addNewNFTsToInventory, {
        campaignId: campaignId as any,
        nfts,
      });

      console.log('[🚀FETCH-NMKR] Result:', result);

      if (result.success) {
        const msg = result.added > 0
          ? `✅ Successfully imported ${result.added} new NFTs from NMKR!${result.skipped > 0 ? `\n⏭️ ${result.skipped} already in inventory (skipped).` : ''}\n\nTotal inventory: ${result.total} NFTs`
          : `✅ All ${result.skipped} NFTs are already in inventory. No new NFTs to add.`;
        alert(msg);

        // Sync counters to update the stats
        await client.mutation(api.commemorativeCampaigns.syncCampaignCounters, {
          campaignId: campaignId as any,
        });

        setCampaignUpdateTrigger(prev => prev + 1);
      } else {
        alert(`❌ Import failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('[🚀FETCH-NMKR] Error:', error);
      alert(`Error fetching from NMKR: ${error.message}`);
    } finally {
      setFetchingFromNMKRCampaignId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b-2 border-yellow-500/30 pb-2">
        <button
          onClick={() => setNftSubTab('commemorative')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'commemorative'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          🏆 Commemorative
        </button>
        <button
          onClick={() => setNftSubTab('whitelist-manager')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'whitelist-manager'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          📋 Whitelist Manager
        </button>
        <button
          onClick={() => setNftSubTab('json-generator')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'json-generator'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          📦 JSON System
        </button>
        <button
          onClick={() => setNftSubTab('campaigns')}
          className={`px-6 py-3 font-bold uppercase tracking-wider transition-all ${
            nftSubTab === 'campaigns'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
              : 'bg-black/50 text-gray-400 hover:text-yellow-400 border border-yellow-500/30'
          }`}
        >
          🎯 Campaigns
        </button>
      </div>

      {/* Tab Content */}
      {nftSubTab === 'commemorative' && <CommemorativeToken1Admin />}
      {nftSubTab === 'whitelist-manager' && <WhitelistManagerAdmin />}
      {nftSubTab === 'json-generator' && <NMKRJSONGenerator />}
      {nftSubTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Production Banner for Campaigns */}
          <div
            className={`rounded-lg p-4 transition-all ${
              mutationsEnabled
                ? 'bg-red-900/30 border-2 border-red-500/50'
                : 'bg-emerald-900/20 border border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${mutationsEnabled ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75 ${mutationsEnabled ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </div>
                <div>
                  <div className={`font-bold ${mutationsEnabled ? 'text-red-400' : 'text-emerald-400'}`}>
                    Campaigns - Production Data
                  </div>
                  <div className="text-sm text-gray-400">
                    {mutationsEnabled
                      ? 'Editing LIVE data - Changes affect real users'
                      : 'Read-only mode - Viewing live production data'
                    }
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (mutationsEnabled) {
                    setMutationsEnabled(false);
                  } else {
                    if (confirm('Enable editing on PRODUCTION data?\n\nChanges will immediately affect the live website and real users.')) {
                      setMutationsEnabled(true);
                    }
                  }
                }}
                className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                  mutationsEnabled
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
                }`}
              >
                {mutationsEnabled ? 'Disable Editing' : 'Enable Editing'}
              </button>
            </div>
            {mutationsEnabled && (
              <div className="mt-3 pt-3 border-t border-red-500/30">
                <div className="flex items-start gap-2 text-sm text-red-300">
                  <span>You are editing <strong>PRODUCTION</strong> data. All changes immediately affect the live site and real users.</span>
                </div>
              </div>
            )}
          </div>

          <CampaignManagerWithDatabase
            campaigns={campaigns}
            onToggleCleanup={handleToggleCleanup}
            onRunCleanup={handleRunCleanup}
            onSyncCounters={handleSyncCounters}
            onVerifyWithNMKR={handleVerifyWithNMKR}
            onBackfillSoldNFTData={handleBackfillSoldNFTData}
            onBackfillImages={handleBackfillImages}
            onFetchFromNMKR={handleFetchFromNMKR}
            cleaningCampaignId={cleaningCampaignId}
            syncingCampaignId={syncingCampaignId}
            verifyingCampaignId={nmkrVerifying}
            backfillRunning={backfillRunning}
            backfillImagesRunning={backfillImagesRunning}
            fetchingFromNMKRCampaignId={fetchingFromNMKRCampaignId}
            client={client}
            mutationsEnabled={mutationsEnabled}
          />
        </div>
      )}

      {/* Mutation Confirmation Dialog */}
      <MutationConfirmDialog
        isOpen={confirmDialog.isOpen}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        dangerLevel="medium"
        isLoading={confirmDialog.isLoading}
        confirmButtonText="Confirm"
      />

      {/* NMKR Sync Modal */}
      <NMKRSyncModal
        isOpen={nmkrSyncModalOpen}
        onClose={() => {
          setNmkrSyncModalOpen(false);
          setNmkrDiscrepancies([]);
        }}
        campaignName={nmkrSyncCampaign?.name || ''}
        discrepancies={nmkrDiscrepancies}
        onSyncAll={handleSyncAllNMKR}
        onSyncSingle={handleSyncSingleNFT}
        isSyncing={nmkrSyncing}
      />
    </div>
  );
}