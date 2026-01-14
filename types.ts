/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';

export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

export type GameStatus = 'MENU' | 'PLAYING' | 'GAME_OVER';
export type GameType = 'PVE' | 'PVP'; // New
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'STANDARD' | 'SUDDEN_DEATH' | 'TANK';
export type MapTheme = 'ARENA' | 'MAGMA' | 'ICE' | 'SPACE';

export interface Score {
  wins: number;
  losses: number;
  tokens: number;
}

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

export interface SimulationVoxel {
  id: number;
  groupId: number; // 0 = Player, 1 = Enemy
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  
  // Physics state
  isDismantled: boolean; // True only when the entity dies
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
}

// Visual debris only
export interface Particle {
    active: boolean;
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    color: THREE.Color;
    life: number;
}

export interface RebuildTarget {
  x: number;
  y: number;
  z: number;
  delay: number;
  isRubble?: boolean;
}

export interface SavedModel {
  name: string;
  data: VoxelData[];
  baseModel?: string;
}

export type ShopItemType = 'FIGHTER' | 'MAP';

export interface ShopItem {
    id: string;
    type: ShopItemType;
    name: string;
    cost: number;
    value: string; // The MapTheme or Model Key
    icon?: any;
}