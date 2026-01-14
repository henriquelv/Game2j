/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { AudioService, audio } from './services/AudioService';
import { UIOverlay } from './components/UIOverlay';
import { JsonModal } from './components/JsonModal';
import { PromptModal } from './components/PromptModal';
import { Generators, createBattleScene } from './utils/voxelGenerators';
import { AppState, VoxelData, SavedModel, GameStatus, Difficulty, GameMode, MapTheme, Score, ShopItem, GameType } from './types';
import { SHOP_ITEMS } from './utils/voxelConstants';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'view' | 'import'>('view');
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<'create' | 'morph'>('create');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  // --- State for Custom Models ---
  const [currentBaseModel, setCurrentBaseModel] = useState<string>('Eagle');
  const [customBuilds, setCustomBuilds] = useState<SavedModel[]>([]);
  const [customRebuilds, setCustomRebuilds] = useState<SavedModel[]>([]);

  // --- Combat Game State ---
  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');
  
  // Game Settings
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [gameMode, setGameMode] = useState<GameMode>('STANDARD');
  const [gameType, setGameType] = useState<GameType>('PVE');
  const [mapTheme, setMapTheme] = useState<MapTheme>('ARENA');
  
  // Economy & Stats
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, tokens: 0 });
  const [unlockedItems, setUnlockedItems] = useState<string[]>(['fighter_eagle', 'map_arena']);
  
  const [maxHealth, setMaxHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [playerEnergy, setPlayerEnergy] = useState(0); 
  const [enemyEnergy, setEnemyEnergy] = useState(0); // For P2

  const [combatMessage, setCombatMessage] = useState("");
  
  // Combat Flags
  const [isPlayerDefending, setIsPlayerDefending] = useState(false);
  const [isEnemyDefending, setIsEnemyDefending] = useState(false);
  
  // Hit Stun (You cannot move if you are getting hit)
  const [isPlayerStunned, setIsPlayerStunned] = useState(false);
  const [isEnemyStunned, setIsEnemyStunned] = useState(false);

  // Cooldowns
  const [playerAttackCooldown, setPlayerAttackCooldown] = useState(false);
  const [playerDefendCooldown, setPlayerDefendCooldown] = useState(false);
  const [p2AttackCooldown, setP2AttackCooldown] = useState(false);
  const [p2DefendCooldown, setP2DefendCooldown] = useState(false);

  // Refs for combat loop
  const combatStateRef = useRef({
      playerHealth: 100,
      enemyHealth: 100,
      isPlayerDefending: false,
      isEnemyDefending: false,
      gameStatus: 'MENU' as GameStatus,
      difficulty: 'MEDIUM' as Difficulty,
      gameType: 'PVE' as GameType
  });
  
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout>