/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accordionCraftingTree from "../accordionCraftingTree.js";
import type * as addTotalActiveContracts from "../addTotalActiveContracts.js";
import type * as adminUsers from "../adminUsers.js";
import type * as attributeRarity from "../attributeRarity.js";
import type * as attributeRarityManual from "../attributeRarityManual.js";
import type * as bank from "../bank.js";
import type * as buffCategories from "../buffCategories.js";
import type * as buffManager from "../buffManager.js";
import type * as buffs from "../buffs.js";
import type * as chipConfigurations from "../chipConfigurations.js";
import type * as chips from "../chips.js";
import type * as cleanupDifficultyConfigs from "../cleanupDifficultyConfigs.js";
import type * as contracts from "../contracts.js";
import type * as crafting from "../crafting.js";
import type * as crons from "../crons.js";
import type * as deployedNodeData from "../deployedNodeData.js";
import type * as devToolbar from "../devToolbar.js";
import type * as difficultyConfigs from "../difficultyConfigs.js";
import type * as eventNodeRewards from "../eventNodeRewards.js";
import type * as fixMek3412To000 from "../fixMek3412To000.js";
import type * as gameConstants from "../gameConstants.js";
import type * as gameItemsSearch from "../gameItemsSearch.js";
import type * as getAllSourceKeys from "../getAllSourceKeys.js";
import type * as goldTracking from "../goldTracking.js";
import type * as goldTrackingOptimized from "../goldTrackingOptimized.js";
import type * as importFullMekCollection from "../importFullMekCollection.js";
import type * as initializeCache from "../initializeCache.js";
import type * as investments from "../investments.js";
import type * as leaderboard from "../leaderboard.js";
import type * as leaderboardOptimized from "../leaderboardOptimized.js";
import type * as loans from "../loans.js";
import type * as marketplace from "../marketplace.js";
import type * as mechanismTiers from "../mechanismTiers.js";
import type * as mekTalentTrees from "../mekTalentTrees.js";
import type * as mekTreeBuffTables from "../mekTreeBuffTables.js";
import type * as mekTreeTemplates from "../mekTreeTemplates.js";
import type * as meks from "../meks.js";
import type * as migrateBuffCategories from "../migrateBuffCategories.js";
import type * as migrationUtils from "../migrationUtils.js";
import type * as migrations from "../migrations.js";
import type * as normalMekRewards from "../normalMekRewards.js";
import type * as optimizedQueries from "../optimizedQueries.js";
import type * as saves from "../saves.js";
import type * as seedBuffCategories from "../seedBuffCategories.js";
import type * as seedData from "../seedData.js";
import type * as seedMarketplace from "../seedMarketplace.js";
import type * as seedMeks from "../seedMeks.js";
import type * as seedShopListings from "../seedShopListings.js";
import type * as spells from "../spells.js";
import type * as stocks from "../stocks.js";
import type * as storyNodes from "../storyNodes.js";
import type * as storyTrees from "../storyTrees.js";
import type * as sunspotActions from "../sunspotActions.js";
import type * as sunspotAntiCheat from "../sunspotAntiCheat.js";
import type * as sunspots from "../sunspots.js";
import type * as talentTree from "../talentTree.js";
import type * as updateVariationImages from "../updateVariationImages.js";
import type * as usernames from "../usernames.js";
import type * as users from "../users.js";
import type * as variationsReference from "../variationsReference.js";
import type * as walletAuth from "../walletAuth.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accordionCraftingTree: typeof accordionCraftingTree;
  addTotalActiveContracts: typeof addTotalActiveContracts;
  adminUsers: typeof adminUsers;
  attributeRarity: typeof attributeRarity;
  attributeRarityManual: typeof attributeRarityManual;
  bank: typeof bank;
  buffCategories: typeof buffCategories;
  buffManager: typeof buffManager;
  buffs: typeof buffs;
  chipConfigurations: typeof chipConfigurations;
  chips: typeof chips;
  cleanupDifficultyConfigs: typeof cleanupDifficultyConfigs;
  contracts: typeof contracts;
  crafting: typeof crafting;
  crons: typeof crons;
  deployedNodeData: typeof deployedNodeData;
  devToolbar: typeof devToolbar;
  difficultyConfigs: typeof difficultyConfigs;
  eventNodeRewards: typeof eventNodeRewards;
  fixMek3412To000: typeof fixMek3412To000;
  gameConstants: typeof gameConstants;
  gameItemsSearch: typeof gameItemsSearch;
  getAllSourceKeys: typeof getAllSourceKeys;
  goldTracking: typeof goldTracking;
  goldTrackingOptimized: typeof goldTrackingOptimized;
  importFullMekCollection: typeof importFullMekCollection;
  initializeCache: typeof initializeCache;
  investments: typeof investments;
  leaderboard: typeof leaderboard;
  leaderboardOptimized: typeof leaderboardOptimized;
  loans: typeof loans;
  marketplace: typeof marketplace;
  mechanismTiers: typeof mechanismTiers;
  mekTalentTrees: typeof mekTalentTrees;
  mekTreeBuffTables: typeof mekTreeBuffTables;
  mekTreeTemplates: typeof mekTreeTemplates;
  meks: typeof meks;
  migrateBuffCategories: typeof migrateBuffCategories;
  migrationUtils: typeof migrationUtils;
  migrations: typeof migrations;
  normalMekRewards: typeof normalMekRewards;
  optimizedQueries: typeof optimizedQueries;
  saves: typeof saves;
  seedBuffCategories: typeof seedBuffCategories;
  seedData: typeof seedData;
  seedMarketplace: typeof seedMarketplace;
  seedMeks: typeof seedMeks;
  seedShopListings: typeof seedShopListings;
  spells: typeof spells;
  stocks: typeof stocks;
  storyNodes: typeof storyNodes;
  storyTrees: typeof storyTrees;
  sunspotActions: typeof sunspotActions;
  sunspotAntiCheat: typeof sunspotAntiCheat;
  sunspots: typeof sunspots;
  talentTree: typeof talentTree;
  updateVariationImages: typeof updateVariationImages;
  usernames: typeof usernames;
  users: typeof users;
  variationsReference: typeof variationsReference;
  walletAuth: typeof walletAuth;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
