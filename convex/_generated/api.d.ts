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
import type * as actions_verifyCardanoSignature from "../actions/verifyCardanoSignature.js";
import type * as actions_verifyCardanoSignatureSimple from "../actions/verifyCardanoSignatureSimple.js";
import type * as activeMissions from "../activeMissions.js";
import type * as addTotalActiveContracts from "../addTotalActiveContracts.js";
import type * as addressConversion from "../addressConversion.js";
import type * as adminUsers from "../adminUsers.js";
import type * as adminVerificationReset from "../adminVerificationReset.js";
import type * as attributeRarity from "../attributeRarity.js";
import type * as attributeRarityManual from "../attributeRarityManual.js";
import type * as auditLogs from "../auditLogs.js";
import type * as bank from "../bank.js";
import type * as blockchainVerification from "../blockchainVerification.js";
import type * as blockfrostConfig from "../blockfrostConfig.js";
import type * as blockfrostNftFetcher from "../blockfrostNftFetcher.js";
import type * as blockfrostService from "../blockfrostService.js";
import type * as buffCategories from "../buffCategories.js";
import type * as buffManager from "../buffManager.js";
import type * as buffs from "../buffs.js";
import type * as chipConfigurations from "../chipConfigurations.js";
import type * as chips from "../chips.js";
import type * as cleanupDifficultyConfigs from "../cleanupDifficultyConfigs.js";
import type * as comprehensiveWalletFix from "../comprehensiveWalletFix.js";
import type * as contracts from "../contracts.js";
import type * as crafting from "../crafting.js";
import type * as crons from "../crons.js";
import type * as debugGold from "../debugGold.js";
import type * as debugGoldDisplay from "../debugGoldDisplay.js";
import type * as debugGoldInvariants from "../debugGoldInvariants.js";
import type * as debugLeaderboard from "../debugLeaderboard.js";
import type * as debugLeaderboardCache from "../debugLeaderboardCache.js";
import type * as debugSnapshotData from "../debugSnapshotData.js";
import type * as debugWalletSnapshot from "../debugWalletSnapshot.js";
import type * as definitiveWalletFix from "../definitiveWalletFix.js";
import type * as deleteMockAccounts from "../deleteMockAccounts.js";
import type * as deleteZeroMekAccounts from "../deleteZeroMekAccounts.js";
import type * as deployedNodeData from "../deployedNodeData.js";
import type * as devToolbar from "../devToolbar.js";
import type * as difficultyConfigs from "../difficultyConfigs.js";
import type * as discordIntegration from "../discordIntegration.js";
import type * as discordSync from "../discordSync.js";
import type * as durationConfigs from "../durationConfigs.js";
import type * as eventNodeRewards from "../eventNodeRewards.js";
import type * as finalDuplicateCleanup from "../finalDuplicateCleanup.js";
import type * as finalWalletFix from "../finalWalletFix.js";
import type * as fixBadSnapshots from "../fixBadSnapshots.js";
import type * as fixGoldRateCalculation from "../fixGoldRateCalculation.js";
import type * as fixMek3412To000 from "../fixMek3412To000.js";
import type * as fixWalletDuplicates from "../fixWalletDuplicates.js";
import type * as fixWalletSnapshot from "../fixWalletSnapshot.js";
import type * as gameConstants from "../gameConstants.js";
import type * as gameItemsSearch from "../gameItemsSearch.js";
import type * as getAllMekHolders from "../getAllMekHolders.js";
import type * as getAllSourceKeys from "../getAllSourceKeys.js";
import type * as getTop50MekHolders from "../getTop50MekHolders.js";
import type * as getWalletAssetsFlexible from "../getWalletAssetsFlexible.js";
import type * as goldBackupScheduler from "../goldBackupScheduler.js";
import type * as goldBackups from "../goldBackups.js";
import type * as goldCheckpointing from "../goldCheckpointing.js";
import type * as goldCheckpointingActions from "../goldCheckpointingActions.js";
import type * as goldLeaderboard from "../goldLeaderboard.js";
import type * as goldMining from "../goldMining.js";
import type * as goldMiningSnapshot from "../goldMiningSnapshot.js";
import type * as goldTracking from "../goldTracking.js";
import type * as goldTrackingOptimized from "../goldTrackingOptimized.js";
import type * as importFullMekCollection from "../importFullMekCollection.js";
import type * as initializeCache from "../initializeCache.js";
import type * as investments from "../investments.js";
import type * as leaderboard from "../leaderboard.js";
import type * as leaderboardOptimized from "../leaderboardOptimized.js";
import type * as leaderboardUpdater from "../leaderboardUpdater.js";
import type * as lib_devLog from "../lib/devLog.js";
import type * as lib_goldCalculations from "../lib/goldCalculations.js";
import type * as listAllGoldMiningAccounts from "../listAllGoldMiningAccounts.js";
import type * as loans from "../loans.js";
import type * as manualWalletMerge from "../manualWalletMerge.js";
import type * as marketplace from "../marketplace.js";
import type * as mechanismTiers from "../mechanismTiers.js";
import type * as mekGoldRates from "../mekGoldRates.js";
import type * as mekLeveling from "../mekLeveling.js";
import type * as mekSuccessRates from "../mekSuccessRates.js";
import type * as mekTalentTrees from "../mekTalentTrees.js";
import type * as mekTreeBuffTables from "../mekTreeBuffTables.js";
import type * as mekTreeTableSaves from "../mekTreeTableSaves.js";
import type * as mekTreeTables from "../mekTreeTables.js";
import type * as mekTreeTemplates from "../mekTreeTemplates.js";
import type * as meks from "../meks.js";
import type * as metadataResolution from "../metadataResolution.js";
import type * as migrateBuffCategories from "../migrateBuffCategories.js";
import type * as migrationUtils from "../migrationUtils.js";
import type * as migrations from "../migrations.js";
import type * as multiWalletAggregation from "../multiWalletAggregation.js";
import type * as nodeFeeVersions from "../nodeFeeVersions.js";
import type * as nodeFees from "../nodeFees.js";
import type * as normalMekRewards from "../normalMekRewards.js";
import type * as offlineAccumulation from "../offlineAccumulation.js";
import type * as optimizedQueries from "../optimizedQueries.js";
import type * as saves from "../saves.js";
import type * as securityMonitoring from "../securityMonitoring.js";
import type * as seedBuffCategories from "../seedBuffCategories.js";
import type * as seedData from "../seedData.js";
import type * as seedMarketplace from "../seedMarketplace.js";
import type * as seedMeks from "../seedMeks.js";
import type * as seedShopListings from "../seedShopListings.js";
import type * as smartContractArchitecture from "../smartContractArchitecture.js";
import type * as snapshotHistory from "../snapshotHistory.js";
import type * as spells from "../spells.js";
import type * as stocks from "../stocks.js";
import type * as storageMonitoring from "../storageMonitoring.js";
import type * as storyNodes from "../storyNodes.js";
import type * as storyTrees from "../storyTrees.js";
import type * as sunspotActions from "../sunspotActions.js";
import type * as sunspotAntiCheat from "../sunspotAntiCheat.js";
import type * as sunspots from "../sunspots.js";
import type * as talentTree from "../talentTree.js";
import type * as updateVariationImages from "../updateVariationImages.js";
import type * as userStats from "../userStats.js";
import type * as usernames from "../usernames.js";
import type * as users from "../users.js";
import type * as validateGoldInvariants from "../validateGoldInvariants.js";
import type * as variationBuffs from "../variationBuffs.js";
import type * as variationsReference from "../variationsReference.js";
import type * as walletAuth from "../walletAuth.js";
import type * as walletAuthentication from "../walletAuthentication.js";

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
  "actions/verifyCardanoSignature": typeof actions_verifyCardanoSignature;
  "actions/verifyCardanoSignatureSimple": typeof actions_verifyCardanoSignatureSimple;
  activeMissions: typeof activeMissions;
  addTotalActiveContracts: typeof addTotalActiveContracts;
  addressConversion: typeof addressConversion;
  adminUsers: typeof adminUsers;
  adminVerificationReset: typeof adminVerificationReset;
  attributeRarity: typeof attributeRarity;
  attributeRarityManual: typeof attributeRarityManual;
  auditLogs: typeof auditLogs;
  bank: typeof bank;
  blockchainVerification: typeof blockchainVerification;
  blockfrostConfig: typeof blockfrostConfig;
  blockfrostNftFetcher: typeof blockfrostNftFetcher;
  blockfrostService: typeof blockfrostService;
  buffCategories: typeof buffCategories;
  buffManager: typeof buffManager;
  buffs: typeof buffs;
  chipConfigurations: typeof chipConfigurations;
  chips: typeof chips;
  cleanupDifficultyConfigs: typeof cleanupDifficultyConfigs;
  comprehensiveWalletFix: typeof comprehensiveWalletFix;
  contracts: typeof contracts;
  crafting: typeof crafting;
  crons: typeof crons;
  debugGold: typeof debugGold;
  debugGoldDisplay: typeof debugGoldDisplay;
  debugGoldInvariants: typeof debugGoldInvariants;
  debugLeaderboard: typeof debugLeaderboard;
  debugLeaderboardCache: typeof debugLeaderboardCache;
  debugSnapshotData: typeof debugSnapshotData;
  debugWalletSnapshot: typeof debugWalletSnapshot;
  definitiveWalletFix: typeof definitiveWalletFix;
  deleteMockAccounts: typeof deleteMockAccounts;
  deleteZeroMekAccounts: typeof deleteZeroMekAccounts;
  deployedNodeData: typeof deployedNodeData;
  devToolbar: typeof devToolbar;
  difficultyConfigs: typeof difficultyConfigs;
  discordIntegration: typeof discordIntegration;
  discordSync: typeof discordSync;
  durationConfigs: typeof durationConfigs;
  eventNodeRewards: typeof eventNodeRewards;
  finalDuplicateCleanup: typeof finalDuplicateCleanup;
  finalWalletFix: typeof finalWalletFix;
  fixBadSnapshots: typeof fixBadSnapshots;
  fixGoldRateCalculation: typeof fixGoldRateCalculation;
  fixMek3412To000: typeof fixMek3412To000;
  fixWalletDuplicates: typeof fixWalletDuplicates;
  fixWalletSnapshot: typeof fixWalletSnapshot;
  gameConstants: typeof gameConstants;
  gameItemsSearch: typeof gameItemsSearch;
  getAllMekHolders: typeof getAllMekHolders;
  getAllSourceKeys: typeof getAllSourceKeys;
  getTop50MekHolders: typeof getTop50MekHolders;
  getWalletAssetsFlexible: typeof getWalletAssetsFlexible;
  goldBackupScheduler: typeof goldBackupScheduler;
  goldBackups: typeof goldBackups;
  goldCheckpointing: typeof goldCheckpointing;
  goldCheckpointingActions: typeof goldCheckpointingActions;
  goldLeaderboard: typeof goldLeaderboard;
  goldMining: typeof goldMining;
  goldMiningSnapshot: typeof goldMiningSnapshot;
  goldTracking: typeof goldTracking;
  goldTrackingOptimized: typeof goldTrackingOptimized;
  importFullMekCollection: typeof importFullMekCollection;
  initializeCache: typeof initializeCache;
  investments: typeof investments;
  leaderboard: typeof leaderboard;
  leaderboardOptimized: typeof leaderboardOptimized;
  leaderboardUpdater: typeof leaderboardUpdater;
  "lib/devLog": typeof lib_devLog;
  "lib/goldCalculations": typeof lib_goldCalculations;
  listAllGoldMiningAccounts: typeof listAllGoldMiningAccounts;
  loans: typeof loans;
  manualWalletMerge: typeof manualWalletMerge;
  marketplace: typeof marketplace;
  mechanismTiers: typeof mechanismTiers;
  mekGoldRates: typeof mekGoldRates;
  mekLeveling: typeof mekLeveling;
  mekSuccessRates: typeof mekSuccessRates;
  mekTalentTrees: typeof mekTalentTrees;
  mekTreeBuffTables: typeof mekTreeBuffTables;
  mekTreeTableSaves: typeof mekTreeTableSaves;
  mekTreeTables: typeof mekTreeTables;
  mekTreeTemplates: typeof mekTreeTemplates;
  meks: typeof meks;
  metadataResolution: typeof metadataResolution;
  migrateBuffCategories: typeof migrateBuffCategories;
  migrationUtils: typeof migrationUtils;
  migrations: typeof migrations;
  multiWalletAggregation: typeof multiWalletAggregation;
  nodeFeeVersions: typeof nodeFeeVersions;
  nodeFees: typeof nodeFees;
  normalMekRewards: typeof normalMekRewards;
  offlineAccumulation: typeof offlineAccumulation;
  optimizedQueries: typeof optimizedQueries;
  saves: typeof saves;
  securityMonitoring: typeof securityMonitoring;
  seedBuffCategories: typeof seedBuffCategories;
  seedData: typeof seedData;
  seedMarketplace: typeof seedMarketplace;
  seedMeks: typeof seedMeks;
  seedShopListings: typeof seedShopListings;
  smartContractArchitecture: typeof smartContractArchitecture;
  snapshotHistory: typeof snapshotHistory;
  spells: typeof spells;
  stocks: typeof stocks;
  storageMonitoring: typeof storageMonitoring;
  storyNodes: typeof storyNodes;
  storyTrees: typeof storyTrees;
  sunspotActions: typeof sunspotActions;
  sunspotAntiCheat: typeof sunspotAntiCheat;
  sunspots: typeof sunspots;
  talentTree: typeof talentTree;
  updateVariationImages: typeof updateVariationImages;
  userStats: typeof userStats;
  usernames: typeof usernames;
  users: typeof users;
  validateGoldInvariants: typeof validateGoldInvariants;
  variationBuffs: typeof variationBuffs;
  variationsReference: typeof variationsReference;
  walletAuth: typeof walletAuth;
  walletAuthentication: typeof walletAuthentication;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
