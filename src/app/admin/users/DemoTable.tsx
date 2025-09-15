'use client';

import React from 'react';

interface DataField {
  category: string;
  field: string;
  defaultValue: string | number;
  description: string;
  storedIn?: string;
}

const playerDataFields: DataField[] = [
  // Account & Authentication
  { category: 'Account', field: 'Wallet Address', defaultValue: 'addr1...xyz', description: 'Cardano wallet address - primary identifier', storedIn: 'users' },
  { category: 'Account', field: 'Wallet Name', defaultValue: 'Nami', description: 'Wallet provider (Nami, Eternl, Flint)', storedIn: 'users' },
  { category: 'Account', field: 'Wallet Verified', defaultValue: 'false', description: 'Ownership verified via signature', storedIn: 'users' },
  { category: 'Account', field: 'Username', defaultValue: '-', description: 'Optional username', storedIn: 'users' },
  { category: 'Account', field: 'Display Name', defaultValue: '-', description: 'Public display name', storedIn: 'users' },
  { category: 'Account', field: 'Bio', defaultValue: '-', description: 'Player biography text', storedIn: 'users' },
  { category: 'Account', field: 'Avatar', defaultValue: 'default.png', description: 'Profile picture URL', storedIn: 'users' },
  { category: 'Account', field: 'Profile Frame', defaultValue: 'default', description: 'Decorative frame on profile', storedIn: 'users' },
  { category: 'Account', field: 'Role', defaultValue: 'user', description: 'user/moderator/admin', storedIn: 'users' },
  { category: 'Account', field: 'Is Online', defaultValue: 'true', description: 'Currently online status', storedIn: 'users' },
  { category: 'Account', field: 'Is Banned', defaultValue: 'false', description: 'Account ban status', storedIn: 'users' },

  // Resources
  { category: 'Resources', field: 'Gold', defaultValue: 100, description: 'Primary currency', storedIn: 'users' },
  { category: 'Resources', field: 'Gold Per Hour', defaultValue: 50, description: 'Passive gold rate', storedIn: 'users' },
  { category: 'Resources', field: 'Pending Gold', defaultValue: 0, description: 'Uncollected gold', storedIn: 'users' },
  { category: 'Resources', field: 'Last Gold Collection', defaultValue: 'timestamp', description: 'Last collection time', storedIn: 'users' },
  { category: 'Resources', field: 'Employee Count', defaultValue: 0, description: 'Meks generating gold', storedIn: 'users' },

  // Essence (15 types)
  { category: 'Essence', field: 'Stone', defaultValue: 10, description: 'Common crafting material', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Disco', defaultValue: 5, description: 'Music themed essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Paul', defaultValue: 0, description: 'Rare event essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Cartoon', defaultValue: 5, description: 'Animated essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Candy', defaultValue: 5, description: 'Sweet essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Tiles', defaultValue: 5, description: 'Geometric essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Moss', defaultValue: 5, description: 'Natural essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Bullish', defaultValue: 0, description: 'Market essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Journalist', defaultValue: 0, description: 'Information essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Laser', defaultValue: 0, description: 'High-tech essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Flashbulb', defaultValue: 0, description: 'Photography essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Accordion', defaultValue: 0, description: 'Musical essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Turret', defaultValue: 0, description: 'Defensive essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Drill', defaultValue: 0, description: 'Industrial essence', storedIn: 'users.totalEssence' },
  { category: 'Essence', field: 'Security', defaultValue: 0, description: 'Protection essence', storedIn: 'users.totalEssence' },

  // Progression
  { category: 'Progression', field: 'Level', defaultValue: 1, description: 'Player level', storedIn: 'users' },
  { category: 'Progression', field: 'Experience', defaultValue: 0, description: 'XP points', storedIn: 'users' },

  // Slots & Limits
  { category: 'Slots', field: 'Base Contract Slots', defaultValue: 2, description: 'Starting contracts', storedIn: 'users' },
  { category: 'Slots', field: 'Total Contract Slots', defaultValue: 2, description: 'After buffs', storedIn: 'users' },
  { category: 'Slots', field: 'Crafting Slots', defaultValue: 1, description: 'Simultaneous crafts', storedIn: 'users' },
  { category: 'Slots', field: 'Chip Slots/Mek', defaultValue: 3, description: 'Chips per Mek', storedIn: 'users' },
  { category: 'Slots', field: 'Inventory Tabs', defaultValue: 1, description: '1-5 tabs, 20 slots each', storedIn: 'users' },
  { category: 'Slots', field: 'Tab 2 Cost', defaultValue: 100, description: 'Gold to unlock tab 2', storedIn: 'users.inventoryTabCosts' },
  { category: 'Slots', field: 'Tab 3 Cost', defaultValue: 500, description: 'Gold to unlock tab 3', storedIn: 'users.inventoryTabCosts' },
  { category: 'Slots', field: 'Tab 4 Cost', defaultValue: 2000, description: 'Gold to unlock tab 4', storedIn: 'users.inventoryTabCosts' },
  { category: 'Slots', field: 'Tab 5 Cost', defaultValue: 10000, description: 'Gold to unlock tab 5', storedIn: 'users.inventoryTabCosts' },

  // Meks & Collections
  { category: 'Meks', field: 'Mek Asset IDs', defaultValue: '["MEK#0001", "MEK#0002"]', description: 'Array of owned Mek asset IDs from blockchain', storedIn: 'meks.assetId[]' },
  { category: 'Meks', field: 'Employee Mek IDs', defaultValue: '["mek_abc123", "mek_def456"]', description: 'Array of Convex IDs for employed Meks', storedIn: 'meks._id[] where isEmployee=true' },
  { category: 'Meks', field: 'Mek Chip Slots', defaultValue: '{mek_abc123: [chip_1, chip_2, null]}', description: 'Object mapping Mek IDs to chip arrays', storedIn: 'meks.chipSlots{}' },
  { category: 'Meks', field: 'Total Owned', defaultValue: 0, description: 'Count of Mek NFTs', storedIn: 'meks (count)' },
  { category: 'Meks', field: 'Total Employees', defaultValue: 0, description: 'Count of employee Meks', storedIn: 'meks (filter count)' },
  { category: 'Meks', field: 'Highest Level', defaultValue: 1, description: 'Most advanced Mek level', storedIn: 'meks (max)' },

  // Banking & Finance
  { category: 'Banking', field: 'Balance', defaultValue: 0, description: 'Gold in bank', storedIn: 'bankAccounts' },
  { category: 'Banking', field: 'Interest Rate', defaultValue: '1%', description: 'Daily interest', storedIn: 'bankAccounts' },
  { category: 'Banking', field: 'Interest Earned', defaultValue: 0, description: 'Lifetime interest', storedIn: 'bankAccounts' },
  { category: 'Banking', field: 'Max Loan', defaultValue: 1000, description: 'Borrowing limit', storedIn: 'bankAccounts' },
  { category: 'Banking', field: 'Active Loans', defaultValue: 0, description: 'Outstanding loans', storedIn: 'loans (count)' },

  // Stocks & Investments
  { category: 'Investments', field: 'Stock Value', defaultValue: 0, description: 'Total holdings value', storedIn: 'stockHoldings' },
  { category: 'Investments', field: 'MEK Shares', defaultValue: 0, description: 'MEK company stock', storedIn: 'stockHoldings' },
  { category: 'Investments', field: 'ESS Shares', defaultValue: 0, description: 'ESS company stock', storedIn: 'stockHoldings' },
  { category: 'Investments', field: 'MRK Shares', defaultValue: 0, description: 'MRK (sunspot) stock', storedIn: 'stockHoldings' },
  { category: 'Investments', field: 'Fixed Deposits', defaultValue: 0, description: 'Term deposits', storedIn: 'investments' },
  { category: 'Investments', field: 'Returns', defaultValue: 0, description: 'Investment profit', storedIn: 'investments' },

  // Contracts & Missions
  { category: 'Contracts', field: 'Active Contract IDs', defaultValue: '["contract_001", "contract_002"]', description: 'Array of currently running contract IDs', storedIn: 'activeContracts._id[]' },
  { category: 'Contracts', field: 'Contract End Times', defaultValue: '{contract_001: 1704067200, contract_002: 1704153600}', description: 'Object mapping contract IDs to end timestamps', storedIn: 'activeContracts.endsAt{}' },
  { category: 'Contracts', field: 'Time Remaining', defaultValue: '{contract_001: "2h 15m", contract_002: "45m"}', description: 'Calculated time remaining per contract', storedIn: 'calculated from endsAt' },
  { category: 'Contracts', field: 'Completed Count', defaultValue: 0, description: 'Total contracts finished', storedIn: 'contracts (count)' },
  { category: 'Contracts', field: 'Player Success Rate', defaultValue: '75%', description: 'Average success rate of all contracts booked', storedIn: 'calculated' },
  { category: 'Contracts', field: 'Contract Success Rate', defaultValue: '85%', description: 'How often each contract type succeeds', storedIn: 'contractStats.successRate' },
  { category: 'Contracts', field: 'Total Rewards', defaultValue: 0, description: 'Gold earned from contracts', storedIn: 'contracts (sum)' },

  // Inventory & Items
  { category: 'Inventory', field: 'Item IDs by Tab', defaultValue: '{tab1: ["item_123", "item_456"], tab2: []}', description: 'Object with arrays of item IDs per tab', storedIn: 'inventory.tabs{}' },
  { category: 'Inventory', field: 'Item Stack Sizes', defaultValue: '{item_123: 5, item_456: 1}', description: 'Object mapping item IDs to quantities (max 99 per stack)', storedIn: 'inventory.stacks{}' },
  { category: 'Inventory', field: 'Heads', defaultValue: '["head_camera_01", "head_disco_02"]', description: 'Array of crafted head IDs', storedIn: 'inventory.heads[]' },
  { category: 'Inventory', field: 'Bodies', defaultValue: '["body_metal_01", "body_glass_02"]', description: 'Array of crafted body IDs', storedIn: 'inventory.bodies[]' },
  { category: 'Inventory', field: 'Traits', defaultValue: '["trait_fast_01", "trait_strong_02"]', description: 'Array of crafted trait IDs', storedIn: 'inventory.traits[]' },
  { category: 'Inventory', field: 'Consumables', defaultValue: '["potion_xp_01", "boost_gold_01"]', description: 'Array of consumable item IDs', storedIn: 'inventory.consumables[]' },

  // Chips & Equipment
  { category: 'Chips', field: 'Chip Instance IDs', defaultValue: '["chip_abc", "chip_def", "chip_ghi"]', description: 'Array of all owned chip IDs', storedIn: 'chipInstances._id[]' },
  { category: 'Chips', field: 'Chip Assignments', defaultValue: '{chip_abc: "mek_123", chip_def: null}', description: 'Object mapping chips to equipped Meks', storedIn: 'chipInstances.equippedTo{}' },
  { category: 'Chips', field: 'Chip Stats', defaultValue: '{chip_abc: {rank: "S", buffs: [...]}}', description: 'Object with chip properties and buff arrays', storedIn: 'chipInstances.stats{}' },
  { category: 'Chips', field: 'Universal Chips', defaultValue: '["chip_uni_01", "chip_uni_02"]', description: 'Array of universal chip IDs', storedIn: 'chipInstances._id[] where universal=true' },

  // Buffs & Effects
  { category: 'Buffs', field: 'Active Buff IDs', defaultValue: '["buff_gold_01", "buff_xp_02"]', description: 'Array of active buff effect IDs', storedIn: 'activeBuffs._id[]' },
  { category: 'Buffs', field: 'Buff Expiry Times', defaultValue: '{buff_gold_01: 1704067200, buff_xp_02: 1704153600}', description: 'Object mapping buffs to expiry timestamps', storedIn: 'activeBuffs.expiresAt{}' },
  { category: 'Buffs', field: 'Buff Sources', defaultValue: '{buff_gold_01: "chip_abc", buff_xp_02: "achievement_123"}', description: 'Object mapping buffs to their sources', storedIn: 'activeBuffs.source{}' },
  { category: 'Buffs', field: 'Stacked Values', defaultValue: '{goldRate: 150, xpMultiplier: 1.25}', description: 'Object with calculated total buff values', storedIn: 'calculated from activeBuffs' },
  { category: 'Buffs', field: 'Craft Speed', defaultValue: '-0%', description: 'Faster crafting', storedIn: 'activeBuffs.craftSpeed' },
  { category: 'Buffs', field: 'Market Discount', defaultValue: '-0%', description: 'Purchase discount', storedIn: 'activeBuffs.marketDiscount' },

  // Talent Trees
  { category: 'Talent', field: 'Tree Configs', defaultValue: '{mek_123: {nodes: [...], spent: 100}}', description: 'Object mapping Mek IDs to tree data', storedIn: 'mekTalentTrees.trees{}' },
  { category: 'Talent', field: 'Unlocked Node IDs', defaultValue: '["node_01", "node_02", "node_05"]', description: 'Array of all unlocked node IDs across all trees', storedIn: 'mekTalentTrees.unlockedNodes[]' },
  { category: 'Talent', field: 'Node Levels', defaultValue: '{node_01: 3, node_02: 1}', description: 'Object mapping node IDs to upgrade levels', storedIn: 'mekTalentTrees.nodeLevels{}' },
  { category: 'Talent', field: 'Available XP', defaultValue: '{mek_123: 50, mek_456: 100}', description: 'Object mapping Mek IDs to unspent XP', storedIn: 'mekTalentTrees.availableXP{}' },

  // Achievements & Progress
  { category: 'Achievements', field: 'Achievement IDs', defaultValue: '[]', description: 'Array of unlocked achievement IDs [ach_001, ach_002, ...]', storedIn: 'achievements.achievementId' },
  { category: 'Achievements', field: 'Unlock Timestamps', defaultValue: '[]', description: 'When each achievement was earned', storedIn: 'achievements.unlockedAt' },
  { category: 'Achievements', field: 'Progress Values', defaultValue: '{}', description: 'Progress toward incomplete achievements {ach_003: 75%}', storedIn: 'achievements.progress' },
  { category: 'Achievements', field: 'Total Unlocked', defaultValue: 0, description: 'Count of achievements earned', storedIn: 'achievements (count)' },
  { category: 'Achievements', field: 'Total Points', defaultValue: 0, description: 'Sum of achievement points', storedIn: 'calculated' },
  { category: 'Achievements', field: 'Badge IDs', defaultValue: '[]', description: 'Special collection badges earned', storedIn: 'achievements (filtered)' },

  // Market & Trading
  { category: 'Market', field: 'Listings', defaultValue: 0, description: 'Items for sale', storedIn: 'marketListings' },
  { category: 'Market', field: 'Sales', defaultValue: 0, description: 'Successful sales', storedIn: 'transactions' },
  { category: 'Market', field: 'Purchases', defaultValue: 0, description: 'Items bought', storedIn: 'transactions' },
  { category: 'Market', field: 'Volume', defaultValue: 0, description: 'Gold traded', storedIn: 'transactions' },
  { category: 'Market', field: 'Reputation', defaultValue: 'neutral', description: 'Market standing', storedIn: 'calculated' },

  // Story & Campaigns
  { category: 'Story', field: 'Completed Nodes', defaultValue: '["story_1_1", "story_1_2", "story_1_3"]', description: 'Array of completed story node IDs', storedIn: 'storyProgress.completedNodes[]' },
  { category: 'Story', field: 'Node Attempts', defaultValue: '{story_1_1: 1, story_1_2: 3}', description: 'Object mapping nodes to attempt counts', storedIn: 'storyProgress.attempts{}' },
  { category: 'Story', field: 'Boss Victories', defaultValue: '["boss_ch1", "boss_ch2"]', description: 'Array of defeated boss IDs', storedIn: 'storyProgress.defeatedBosses[]' },
  { category: 'Story', field: 'Rewards Claimed', defaultValue: '{story_1_1: ["gold:100", "essence:stone:5"]}', description: 'Object mapping nodes to claimed rewards', storedIn: 'storyProgress.claimedRewards{}' },

  // Timestamps
  { category: 'Timestamps', field: 'Created', defaultValue: 'timestamp', description: 'Account created', storedIn: 'users' },
  { category: 'Timestamps', field: 'Last Login', defaultValue: 'timestamp', description: 'Recent login', storedIn: 'users' },
  { category: 'Timestamps', field: 'Updated', defaultValue: 'timestamp', description: 'Profile update', storedIn: 'users' },
  { category: 'Timestamps', field: 'Season Start', defaultValue: 'timestamp', description: 'Season began', storedIn: 'seasonal' },

  // Special Events
  { category: 'Events', field: 'Participation', defaultValue: 0, description: 'Events joined', storedIn: 'events' },
  { category: 'Events', field: 'Event Rewards', defaultValue: 0, description: 'Event prizes', storedIn: 'events' },
  { category: 'Events', field: 'Season Rank', defaultValue: 'unranked', description: 'Current rank', storedIn: 'seasonal' },
  { category: 'Events', field: 'Tournaments', defaultValue: 0, description: 'Tournament wins', storedIn: 'tournaments' },
];

export default function DemoTable() {
  let currentCategory = '';

  return (
    <div className="mek-card-industrial mek-border-sharp-gold p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-500 mb-2 font-orbitron uppercase">
          Player Data Reference Table
        </h2>
        <p className="text-gray-400 text-xs">
          Complete list of all player data fields. Storage locations may span multiple Convex tables.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-yellow-500/50 sticky top-0 bg-black">
            <tr>
              <th className="py-1 px-2 text-yellow-500 font-orbitron uppercase w-[15%]">Field</th>
              <th className="py-1 px-2 text-yellow-500 font-orbitron uppercase w-[12%]">Default</th>
              <th className="py-1 px-2 text-yellow-500 font-orbitron uppercase w-[50%]">Description</th>
              <th className="py-1 px-2 text-yellow-500 font-orbitron uppercase w-[23%]">Storage</th>
            </tr>
          </thead>
          <tbody>
            {playerDataFields.map((field, index) => {
              const isNewCategory = field.category !== currentCategory;
              if (isNewCategory) {
                currentCategory = field.category;
              }

              return (
                <React.Fragment key={`row-${index}`}>
                  {isNewCategory && (
                    <tr className="border-t-2 border-yellow-500/30">
                      <td colSpan={4} className="py-1 px-2 text-yellow-500/80 font-bold text-xs uppercase bg-yellow-500/5">
                        {field.category}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-900 hover:bg-yellow-500/5 transition-colors">
                    <td className="py-1 px-2 font-medium">{field.field}</td>
                    <td className="py-1 px-2">
                      <span className="text-blue-400 font-mono">
                        {typeof field.defaultValue === 'number' ? field.defaultValue.toLocaleString() : field.defaultValue}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-gray-400">{field.description}</td>
                    <td className="py-1 px-2">
                      <span className="text-yellow-500/60 font-mono" title={field.storedIn}>
                        {field.storedIn || 'TBD'}
                      </span>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-500/20">
        <h3 className="text-sm font-bold text-yellow-500/80 mb-2">Storage Legend</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="text-yellow-500/60 font-bold mb-1">Table Names</h4>
            <div className="text-gray-400 space-y-1">
              <div>• <span className="text-yellow-500/60">users</span> = Main profile table</div>
              <div>• <span className="text-yellow-500/60">meks</span> = NFT ownership table</div>
              <div>• <span className="text-yellow-500/60">inventory</span> = Items & equipment</div>
              <div>• <span className="text-yellow-500/60">achievements</span> = Progress tracking</div>
              <div>• <span className="text-yellow-500/60">activeBuffs</span> = Temporary effects</div>
            </div>
          </div>
          <div>
            <h4 className="text-yellow-500/60 font-bold mb-1">Data Structure Notation</h4>
            <div className="text-gray-400 space-y-1">
              <div>• <span className="text-yellow-500/60">[]</span> = Array of values</div>
              <div>• <span className="text-yellow-500/60">{`{}`}</span> = Object/map structure</div>
              <div>• <span className="text-yellow-500/60">(count)</span> = Count of records</div>
              <div>• <span className="text-yellow-500/60">(sum)</span> = Sum of values</div>
              <div>• <span className="text-yellow-500/60">where X=Y</span> = Filtered by condition</div>
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-yellow-500/5 rounded border border-yellow-500/20">
          <p className="text-xs text-gray-400">
            <span className="text-yellow-500/60 font-bold">Example:</span> <code className="text-blue-400">meks._id[] where isEmployee=true</code> means
            "Array of _id values from meks table where isEmployee field equals true"
          </p>
        </div>
      </div>
    </div>
  );
}