/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accordionCraftingTree from "../accordionCraftingTree.js";
import type * as actions_verifyCardanoSignature from "../actions/verifyCardanoSignature.js";
import type * as actions_verifyCardanoSignatureSimple from "../actions/verifyCardanoSignatureSimple.js";
import type * as activeMissions from "../activeMissions.js";
import type * as activityLogs from "../activityLogs.js";
import type * as addTotalActiveContracts from "../addTotalActiveContracts.js";
import type * as addressConversion from "../addressConversion.js";
import type * as adminDiagnosticMeks from "../adminDiagnosticMeks.js";
import type * as adminEssence from "../adminEssence.js";
import type * as adminMarketplace from "../adminMarketplace.js";
import type * as adminMigration from "../adminMigration.js";
import type * as adminUnlockSlot from "../adminUnlockSlot.js";
import type * as adminUsers from "../adminUsers.js";
import type * as airdrop from "../airdrop.js";
import type * as analysisVariationCoverage from "../analysisVariationCoverage.js";
import type * as attributeRarity from "../attributeRarity.js";
import type * as attributeRarityManual from "../attributeRarityManual.js";
import type * as auditLogs from "../auditLogs.js";
import type * as betaSignups from "../betaSignups.js";
import type * as blockchainVerification from "../blockchainVerification.js";
import type * as blockfrostConfig from "../blockfrostConfig.js";
import type * as blockfrostNftFetcher from "../blockfrostNftFetcher.js";
import type * as blockfrostService from "../blockfrostService.js";
import type * as buffCategories from "../buffCategories.js";
import type * as buffManager from "../buffManager.js";
import type * as buffs from "../buffs.js";
import type * as campaigns from "../campaigns.js";
import type * as chipConfigurations from "../chipConfigurations.js";
import type * as chips from "../chips.js";
import type * as cleanupDifficultyConfigs from "../cleanupDifficultyConfigs.js";
import type * as coachMarks from "../coachMarks.js";
import type * as coachMarksAdmin from "../coachMarksAdmin.js";
import type * as commemorative from "../commemorative.js";
import type * as commemorativeCampaignMigration from "../commemorativeCampaignMigration.js";
import type * as commemorativeCampaigns from "../commemorativeCampaigns.js";
import type * as commemorativeNFTClaims from "../commemorativeNFTClaims.js";
import type * as commemorativeNFTInventorySetup from "../commemorativeNFTInventorySetup.js";
import type * as commemorativeNFTReservations from "../commemorativeNFTReservations.js";
import type * as commemorativeNFTReservationsCampaign from "../commemorativeNFTReservationsCampaign.js";
import type * as commemorativePaymentTracking from "../commemorativePaymentTracking.js";
import type * as commemorativeTokenCounters from "../commemorativeTokenCounters.js";
import type * as componentLibrarySchema from "../componentLibrarySchema.js";
import type * as componentTransformations from "../componentTransformations.js";
import type * as contracts from "../contracts.js";
import type * as corporationAuth from "../corporationAuth.js";
import type * as crafting from "../crafting.js";
import type * as crons from "../crons.js";
import type * as deduplicateMeks from "../deduplicateMeks.js";
import type * as deployedNodeData from "../deployedNodeData.js";
import type * as devToolbar from "../devToolbar.js";
import type * as diagnosticAllEssenceWallets from "../diagnosticAllEssenceWallets.js";
import type * as diagnosticCampaigns from "../diagnosticCampaigns.js";
import type * as difficultyConfigs from "../difficultyConfigs.js";
import type * as durationConfigs from "../durationConfigs.js";
import type * as essence from "../essence.js";
import type * as eventNodeRewards from "../eventNodeRewards.js";
import type * as files from "../files.js";
import type * as fixCampaignProjectId from "../fixCampaignProjectId.js";
import type * as fixLightningId from "../fixLightningId.js";
import type * as fixProjectIdFormat from "../fixProjectIdFormat.js";
import type * as gameConstants from "../gameConstants.js";
import type * as gameItemsSearch from "../gameItemsSearch.js";
import type * as getAllMekHolders from "../getAllMekHolders.js";
import type * as getAllSourceKeys from "../getAllSourceKeys.js";
import type * as getWalletAssetsFlexible from "../getWalletAssetsFlexible.js";
import type * as importFullMekCollection from "../importFullMekCollection.js";
import type * as initializeCache from "../initializeCache.js";
import type * as jobIncome from "../jobIncome.js";
import type * as jobs from "../jobs.js";
import type * as landingDebugSettings from "../landingDebugSettings.js";
import type * as landingDebugSettingsMobile from "../landingDebugSettingsMobile.js";
import type * as landingDebugUnified from "../landingDebugUnified.js";
import type * as levelColors from "../levelColors.js";
import type * as lib_accumulationHelpers from "../lib/accumulationHelpers.js";
import type * as lib_devLog from "../lib/devLog.js";
import type * as lib_essenceCalculations from "../lib/essenceCalculations.js";
import type * as lib_essenceHelpers from "../lib/essenceHelpers.js";
import type * as lib_essenceWarningHelpers from "../lib/essenceWarningHelpers.js";
import type * as lib_nftFetchingService from "../lib/nftFetchingService.js";
import type * as lib_queryCache from "../lib/queryCache.js";
import type * as lib_sessionUtils from "../lib/sessionUtils.js";
import type * as lib_tenureCalculations from "../lib/tenureCalculations.js";
import type * as lib_userEssenceHelpers from "../lib/userEssenceHelpers.js";
import type * as loaderSettings from "../loaderSettings.js";
import type * as marketplace from "../marketplace.js";
import type * as mechanismTiers from "../mechanismTiers.js";
import type * as mekSuccessRates from "../mekSuccessRates.js";
import type * as mekTreeBuffTables from "../mekTreeBuffTables.js";
import type * as mekTreeCategories from "../mekTreeCategories.js";
import type * as mekTreeTableSaves from "../mekTreeTableSaves.js";
import type * as mekTreeTables from "../mekTreeTables.js";
import type * as mekTreeTemplates from "../mekTreeTemplates.js";
import type * as meks from "../meks.js";
import type * as meksProtection from "../meksProtection.js";
import type * as messageAttachments from "../messageAttachments.js";
import type * as messaging from "../messaging.js";
import type * as migrateDesktopSettings from "../migrateDesktopSettings.js";
import type * as migratePhaseImages from "../migratePhaseImages.js";
import type * as migrations_migrateReservationsToInventory from "../migrations/migrateReservationsToInventory.js";
import type * as migrations_verifyMigration from "../migrations/verifyMigration.js";
import type * as monitoringSummaryGenerator from "../monitoringSummaryGenerator.js";
import type * as multiWalletAggregation from "../multiWalletAggregation.js";
import type * as navigation from "../navigation.js";
import type * as nftEligibility from "../nftEligibility.js";
import type * as nmkr from "../nmkr.js";
import type * as nmkrSync from "../nmkrSync.js";
import type * as nodeFeeVersions from "../nodeFeeVersions.js";
import type * as nodeFees from "../nodeFees.js";
import type * as normalMekRewards from "../normalMekRewards.js";
import type * as notifications from "../notifications.js";
import type * as overlays from "../overlays.js";
import type * as phase1Veterans from "../phase1Veterans.js";
import type * as phaseCards from "../phaseCards.js";
import type * as phaseILightbox from "../phaseILightbox.js";
import type * as profanityFilter from "../profanityFilter.js";
import type * as publicCorporation from "../publicCorporation.js";
import type * as restoreMeksFromBackup from "../restoreMeksFromBackup.js";
import type * as saves from "../saves.js";
import type * as seedBuffCategories from "../seedBuffCategories.js";
import type * as seedData from "../seedData.js";
import type * as sessionManagement from "../sessionManagement.js";
import type * as siteSettings from "../siteSettings.js";
import type * as slotConfigurations from "../slotConfigurations.js";
import type * as smartContractArchitecture from "../smartContractArchitecture.js";
import type * as storyClimbOptimized from "../storyClimbOptimized.js";
import type * as storyNodes from "../storyNodes.js";
import type * as storyTrees from "../storyTrees.js";
import type * as tenureConfig from "../tenureConfig.js";
import type * as testSessionManagement from "../testSessionManagement.js";
import type * as tradeFloor from "../tradeFloor.js";
import type * as updateTop30Ranks from "../updateTop30Ranks.js";
import type * as updateVariationImages from "../updateVariationImages.js";
import type * as updateVariationSourceKeys from "../updateVariationSourceKeys.js";
import type * as userData from "../userData.js";
import type * as users from "../users.js";
import type * as variationBuffs from "../variationBuffs.js";
import type * as variationsReference from "../variationsReference.js";
import type * as verifyMigration from "../verifyMigration.js";
import type * as walletAuthentication from "../walletAuthentication.js";
import type * as walletSession from "../walletSession.js";
import type * as webhooks from "../webhooks.js";
import type * as whitelists from "../whitelists.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  activityLogs: typeof activityLogs;
  addTotalActiveContracts: typeof addTotalActiveContracts;
  addressConversion: typeof addressConversion;
  adminDiagnosticMeks: typeof adminDiagnosticMeks;
  adminEssence: typeof adminEssence;
  adminMarketplace: typeof adminMarketplace;
  adminMigration: typeof adminMigration;
  adminUnlockSlot: typeof adminUnlockSlot;
  adminUsers: typeof adminUsers;
  airdrop: typeof airdrop;
  analysisVariationCoverage: typeof analysisVariationCoverage;
  attributeRarity: typeof attributeRarity;
  attributeRarityManual: typeof attributeRarityManual;
  auditLogs: typeof auditLogs;
  betaSignups: typeof betaSignups;
  blockchainVerification: typeof blockchainVerification;
  blockfrostConfig: typeof blockfrostConfig;
  blockfrostNftFetcher: typeof blockfrostNftFetcher;
  blockfrostService: typeof blockfrostService;
  buffCategories: typeof buffCategories;
  buffManager: typeof buffManager;
  buffs: typeof buffs;
  campaigns: typeof campaigns;
  chipConfigurations: typeof chipConfigurations;
  chips: typeof chips;
  cleanupDifficultyConfigs: typeof cleanupDifficultyConfigs;
  coachMarks: typeof coachMarks;
  coachMarksAdmin: typeof coachMarksAdmin;
  commemorative: typeof commemorative;
  commemorativeCampaignMigration: typeof commemorativeCampaignMigration;
  commemorativeCampaigns: typeof commemorativeCampaigns;
  commemorativeNFTClaims: typeof commemorativeNFTClaims;
  commemorativeNFTInventorySetup: typeof commemorativeNFTInventorySetup;
  commemorativeNFTReservations: typeof commemorativeNFTReservations;
  commemorativeNFTReservationsCampaign: typeof commemorativeNFTReservationsCampaign;
  commemorativePaymentTracking: typeof commemorativePaymentTracking;
  commemorativeTokenCounters: typeof commemorativeTokenCounters;
  componentLibrarySchema: typeof componentLibrarySchema;
  componentTransformations: typeof componentTransformations;
  contracts: typeof contracts;
  corporationAuth: typeof corporationAuth;
  crafting: typeof crafting;
  crons: typeof crons;
  deduplicateMeks: typeof deduplicateMeks;
  deployedNodeData: typeof deployedNodeData;
  devToolbar: typeof devToolbar;
  diagnosticAllEssenceWallets: typeof diagnosticAllEssenceWallets;
  diagnosticCampaigns: typeof diagnosticCampaigns;
  difficultyConfigs: typeof difficultyConfigs;
  durationConfigs: typeof durationConfigs;
  essence: typeof essence;
  eventNodeRewards: typeof eventNodeRewards;
  files: typeof files;
  fixCampaignProjectId: typeof fixCampaignProjectId;
  fixLightningId: typeof fixLightningId;
  fixProjectIdFormat: typeof fixProjectIdFormat;
  gameConstants: typeof gameConstants;
  gameItemsSearch: typeof gameItemsSearch;
  getAllMekHolders: typeof getAllMekHolders;
  getAllSourceKeys: typeof getAllSourceKeys;
  getWalletAssetsFlexible: typeof getWalletAssetsFlexible;
  importFullMekCollection: typeof importFullMekCollection;
  initializeCache: typeof initializeCache;
  jobIncome: typeof jobIncome;
  jobs: typeof jobs;
  landingDebugSettings: typeof landingDebugSettings;
  landingDebugSettingsMobile: typeof landingDebugSettingsMobile;
  landingDebugUnified: typeof landingDebugUnified;
  levelColors: typeof levelColors;
  "lib/accumulationHelpers": typeof lib_accumulationHelpers;
  "lib/devLog": typeof lib_devLog;
  "lib/essenceCalculations": typeof lib_essenceCalculations;
  "lib/essenceHelpers": typeof lib_essenceHelpers;
  "lib/essenceWarningHelpers": typeof lib_essenceWarningHelpers;
  "lib/nftFetchingService": typeof lib_nftFetchingService;
  "lib/queryCache": typeof lib_queryCache;
  "lib/sessionUtils": typeof lib_sessionUtils;
  "lib/tenureCalculations": typeof lib_tenureCalculations;
  "lib/userEssenceHelpers": typeof lib_userEssenceHelpers;
  loaderSettings: typeof loaderSettings;
  marketplace: typeof marketplace;
  mechanismTiers: typeof mechanismTiers;
  mekSuccessRates: typeof mekSuccessRates;
  mekTreeBuffTables: typeof mekTreeBuffTables;
  mekTreeCategories: typeof mekTreeCategories;
  mekTreeTableSaves: typeof mekTreeTableSaves;
  mekTreeTables: typeof mekTreeTables;
  mekTreeTemplates: typeof mekTreeTemplates;
  meks: typeof meks;
  meksProtection: typeof meksProtection;
  messageAttachments: typeof messageAttachments;
  messaging: typeof messaging;
  migrateDesktopSettings: typeof migrateDesktopSettings;
  migratePhaseImages: typeof migratePhaseImages;
  "migrations/migrateReservationsToInventory": typeof migrations_migrateReservationsToInventory;
  "migrations/verifyMigration": typeof migrations_verifyMigration;
  monitoringSummaryGenerator: typeof monitoringSummaryGenerator;
  multiWalletAggregation: typeof multiWalletAggregation;
  navigation: typeof navigation;
  nftEligibility: typeof nftEligibility;
  nmkr: typeof nmkr;
  nmkrSync: typeof nmkrSync;
  nodeFeeVersions: typeof nodeFeeVersions;
  nodeFees: typeof nodeFees;
  normalMekRewards: typeof normalMekRewards;
  notifications: typeof notifications;
  overlays: typeof overlays;
  phase1Veterans: typeof phase1Veterans;
  phaseCards: typeof phaseCards;
  phaseILightbox: typeof phaseILightbox;
  profanityFilter: typeof profanityFilter;
  publicCorporation: typeof publicCorporation;
  restoreMeksFromBackup: typeof restoreMeksFromBackup;
  saves: typeof saves;
  seedBuffCategories: typeof seedBuffCategories;
  seedData: typeof seedData;
  sessionManagement: typeof sessionManagement;
  siteSettings: typeof siteSettings;
  slotConfigurations: typeof slotConfigurations;
  smartContractArchitecture: typeof smartContractArchitecture;
  storyClimbOptimized: typeof storyClimbOptimized;
  storyNodes: typeof storyNodes;
  storyTrees: typeof storyTrees;
  tenureConfig: typeof tenureConfig;
  testSessionManagement: typeof testSessionManagement;
  tradeFloor: typeof tradeFloor;
  updateTop30Ranks: typeof updateTop30Ranks;
  updateVariationImages: typeof updateVariationImages;
  updateVariationSourceKeys: typeof updateVariationSourceKeys;
  userData: typeof userData;
  users: typeof users;
  variationBuffs: typeof variationBuffs;
  variationsReference: typeof variationsReference;
  verifyMigration: typeof verifyMigration;
  walletAuthentication: typeof walletAuthentication;
  walletSession: typeof walletSession;
  webhooks: typeof webhooks;
  whitelists: typeof whitelists;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
