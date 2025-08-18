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
import type * as buffs from "../buffs.js";
import type * as crafting from "../crafting.js";
import type * as marketplace from "../marketplace.js";
import type * as meks from "../meks.js";
import type * as seedData from "../seedData.js";
import type * as seedMeks from "../seedMeks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  buffs: typeof buffs;
  crafting: typeof crafting;
  marketplace: typeof marketplace;
  meks: typeof meks;
  seedData: typeof seedData;
  seedMeks: typeof seedMeks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
