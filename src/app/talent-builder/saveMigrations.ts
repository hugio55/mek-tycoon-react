/**
 * CIRCUTREE SAVE FILE COMPATIBILITY SYSTEM
 *
 * This file ensures that CircuTree save files are ALWAYS backwards compatible.
 * When we add new features, we add migration functions here to upgrade old saves.
 *
 * CRITICAL RULES:
 * 1. NEVER remove fields from the save format
 * 2. NEVER change the meaning of existing fields
 * 3. ALWAYS add new fields as optional with safe defaults
 * 4. ALWAYS increment CURRENT_VERSION when changing save format
 * 5. ALWAYS add a migration function for each version bump
 */

import { TalentNode, Connection } from './types';

// Current save file version - INCREMENT THIS when changing save format
export const CURRENT_SAVE_VERSION = 1;

// Save file structure
export interface CircuTreeSaveData {
  version: number;
  nodes: TalentNode[];
  connections: Connection[];
  savedAt: number;
}

export interface CircuTreeSave {
  name: string;
  data: CircuTreeSaveData;
  isActive?: boolean;
}

/**
 * Migrates a save file from version 0 (no version) to version 1
 */
function migrateV0toV1(data: any): CircuTreeSaveData {
  // Version 0 files don't have a version field
  // Just add the version field and keep everything else
  return {
    version: 1,
    nodes: data.nodes || [],
    connections: data.connections || [],
    savedAt: data.savedAt || Date.now()
  };
}

/**
 * Example migration for future versions:
 *
 * function migrateV1toV2(data: CircuTreeSaveData): CircuTreeSaveData {
 *   return {
 *     ...data,
 *     version: 2,
 *     // Add new fields with safe defaults:
 *     newField: data.newField || 'default-value',
 *     // Ensure nodes have new optional fields:
 *     nodes: data.nodes.map(node => ({
 *       ...node,
 *       newNodeField: node.newNodeField || 0
 *     }))
 *   };
 * }
 */

/**
 * Migrates a save file to the current version
 * This is safe to call on any save file, old or new
 */
export function migrateSaveToCurrentVersion(data: any): CircuTreeSaveData {
  let currentData = data;
  let currentVersion = data.version || 0;

  // Apply migrations in sequence from old version to current
  if (currentVersion < 1) {
    currentData = migrateV0toV1(currentData);
    currentVersion = 1;
  }

  // Add future migrations here:
  // if (currentVersion < 2) {
  //   currentData = migrateV1toV2(currentData);
  //   currentVersion = 2;
  // }

  return currentData;
}

/**
 * Validates that a save file has all required fields
 * Returns an error message if invalid, or null if valid
 */
export function validateSaveData(data: any): string | null {
  if (!data) {
    return 'Save data is null or undefined';
  }

  if (!Array.isArray(data.nodes)) {
    return 'Save data is missing nodes array';
  }

  if (!Array.isArray(data.connections)) {
    return 'Save data is missing connections array';
  }

  // Validate each node has required fields
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (!node.id) {
      return `Node at index ${i} is missing required field: id`;
    }
    if (typeof node.x !== 'number') {
      return `Node ${node.id} is missing required field: x`;
    }
    if (typeof node.y !== 'number') {
      return `Node ${node.id} is missing required field: y`;
    }
  }

  // Validate each connection has required fields
  for (let i = 0; i < data.connections.length; i++) {
    const conn = data.connections[i];
    if (!conn.from) {
      return `Connection at index ${i} is missing required field: from`;
    }
    if (!conn.to) {
      return `Connection at index ${i} is missing required field: to`;
    }
  }

  return null; // Valid
}

/**
 * Creates a save data object with the current version
 */
export function createSaveData(nodes: TalentNode[], connections: Connection[]): CircuTreeSaveData {
  return {
    version: CURRENT_SAVE_VERSION,
    nodes,
    connections,
    savedAt: Date.now()
  };
}

/**
 * Safely loads a save file, applying migrations if needed
 * Returns migrated data or throws an error if invalid
 */
export function loadSaveDataSafely(rawData: any): CircuTreeSaveData {
  // First migrate to current version
  const migratedData = migrateSaveToCurrentVersion(rawData);

  // Then validate
  const validationError = validateSaveData(migratedData);
  if (validationError) {
    throw new Error(`Invalid save file: ${validationError}`);
  }

  return migratedData;
}
