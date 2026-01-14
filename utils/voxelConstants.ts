/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const COLORS = {
  DARK: 0x4A3728,
  LIGHT: 0x654321,
  WHITE: 0xF0F0F0,
  GOLD: 0xFFD700,
  BLACK: 0x111111,
  WOOD: 0x3B2F2F,
  GREEN: 0x228B22,
  TALON: 0xE5C100,
};

export const CONFIG = {
  VOXEL_SIZE: 1,
  FLOOR_Y: -12,
  BG_COLOR: 0xf0f2f5, 
};

export const RANKS = [
    { name: "Novice", min: 0, color: "text-slate-500" },
    { name: "Fighter", min: 100, color: "text-emerald-500" },
    { name: "Warrior", min: 300, color: "text-blue-500" },
    { name: "Champion", min: 600, color: "text-purple-500" },
    { name: "Legend", min: 1000, color: "text-amber-500" },
];

export const getRank = (tokens: number) => {
    return RANKS.slice().reverse().find(r => tokens >= r.min) || RANKS[0];
};

export const MAP_CONFIGS = {
  ARENA: {
    name: "Classic Arena",
    bgColor: 0xf0f2f5,
    floorColor: 0xe2e8f0,
    fogColor: 0xf0f2f5
  },
  MAGMA: {
    name: "Volcanic Core",
    bgColor: 0x2a0a0a,
    floorColor: 0x4a0404,
    fogColor: 0x2a0a0a
  },
  ICE: {
    name: "Frozen Peak",
    bgColor: 0xdbfaff,
    floorColor: 0xffffff,
    fogColor: 0xdbfaff
  },
  SPACE: {
    name: "Void Station",
    bgColor: 0x050510,
    floorColor: 0x1a1a2e,
    fogColor: 0x050510
  }
};

// Items that can be bought or are unlocked by default
export const SHOP_ITEMS: any[] = [
    { id: 'fighter_eagle', type: 'FIGHTER', name: 'Eagle', cost: 0, value: 'Eagle' },
    { id: 'fighter_cat', type: 'FIGHTER', name: 'Battle Cat', cost: 100, value: 'Cat' },
    { id: 'fighter_rabbit', type: 'FIGHTER', name: 'Mecha Rabbit', cost: 250, value: 'Rabbit' },
    
    { id: 'map_arena', type: 'MAP', name: 'Arena', cost: 0, value: 'ARENA' },
    { id: 'map_magma', type: 'MAP', name: 'Magma Core', cost: 150, value: 'MAGMA' },
    { id: 'map_ice', type: 'MAP', name: 'Ice Peak', cost: 150, value: 'ICE' },
    { id: 'map_space', type: 'MAP', name: 'Void Space', cost: 500, value: 'SPACE' },
];