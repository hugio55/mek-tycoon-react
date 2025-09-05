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
import type * as bank from "../bank.js";
import type * as buffManager from "../buffManager.js";
import type * as buffs from "../buffs.js";
import type * as contracts from "../contracts.js";
import type * as crafting from "../crafting.js";
import type * as crons from "../crons.js";
import type * as fixMek3412To000 from "../fixMek3412To000.js";
import type * as getAllSourceKeys from "../getAllSourceKeys.js";
import type * as goldTracking from "../goldTracking.js";
import type * as goldTrackingOptimized from "../goldTrackingOptimized.js";
import type * as initializeCache from "../initializeCache.js";
import type * as investments from "../investments.js";
import type * as leaderboard from "../leaderboard.js";
import type * as leaderboardOptimized from "../leaderboardOptimized.js";
import type * as loans from "../loans.js";
import type * as marketplace from "../marketplace.js";
import type * as mekTalentTrees from "../mekTalentTrees.js";
import type * as mekTreeBuffTables from "../mekTreeBuffTables.js";
import type * as mekTreeTemplates from "../mekTreeTemplates.js";
import type * as meks from "../meks.js";
import type * as migrationUtils from "../migrationUtils.js";
import type * as migrations from "../migrations.js";
import type * as optimizedQueries from "../optimizedQueries.js";
import type * as saves from "../saves.js";
import type * as seedData from "../seedData.js";
import type * as seedMeks from "../seedMeks.js";
import type * as seedShopListings from "../seedShopListings.js";
import type * as spells from "../spells.js";
import type * as stocks from "../stocks.js";
import type * as storyNodes from "../storyNodes.js";
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
  bank: typeof bank;
  buffManager: typeof buffManager;
  buffs: typeof buffs;
  contracts: typeof contracts;
  crafting: typeof crafting;
  crons: typeof crons;
  fixMek3412To000: typeof fixMek3412To000;
  getAllSourceKeys: typeof getAllSourceKeys;
  goldTracking: typeof goldTracking;
  goldTrackingOptimized: typeof goldTrackingOptimized;
  initializeCache: typeof initializeCache;
  investments: typeof investments;
  leaderboard: typeof leaderboard;
  leaderboardOptimized: typeof leaderboardOptimized;
  loans: typeof loans;
  marketplace: typeof marketplace;
  mekTalentTrees: typeof mekTalentTrees;
  mekTreeBuffTables: typeof mekTreeBuffTables;
  mekTreeTemplates: typeof mekTreeTemplates;
  meks: typeof meks;
  migrationUtils: typeof migrationUtils;
  migrations: typeof migrations;
  optimizedQueries: typeof optimizedQueries;
  saves: typeof saves;
  seedData: typeof seedData;
  seedMeks: typeof seedMeks;
  seedShopListings: typeof seedShopListings;
  spells: typeof spells;
  stocks: typeof stocks;
  storyNodes: typeof storyNodes;
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
