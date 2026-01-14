/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel, GameStatus, Difficulty, GameMode, MapTheme, Score, ShopItem, GameType } from '../types';
import { SHOP_ITEMS, getRank } from '../utils/voxelConstants';
import { Bird, Cat, Rabbit, Code2, Wand2, FileJson, History, Play, Pause, Loader2, Heart, Shield, Sword, Skull, Trophy, Globe, Zap, Target, Home, Wrench, ShoppingBag, Lock, Coins, Swords, Settings, ChevronUp, Flame, Users, User, LockKeyhole } from 'lucide-react';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isGenerating: boolean;
  
  gameStatus: GameStatus;
  difficulty: Difficulty;
  gameMode: GameMode;
  gameType: GameType;
  mapTheme: MapTheme;
  score: Score;
  unlockedItems: string[];
  
  playerHealth: number;
  enemyHealth: number;
  maxHealth: number;
  playerEnergy: number; // 0-100
  enemyEnergy: number; // 0-100
  combatMessage: string;
  isPlayerDefending: boolean;
  isEnemyDefending: boolean;
  isPlayerStunned: boolean;
  isEnemyStunned: boolean;

  onSetDifficulty: (d: Difficulty) => void;
  onSetGameMode: (m: GameMode) => void;
  onSetGameType: (t: GameType) => void;
  onSetMapTheme: (t: MapTheme) => void;

  onStartGame: () => void;
  onReturnToMenu: () => void;
  onAttack: () => void;
  onSpecialAttack: () => void;
  onDefend: () => void;

  // P2
  onP2Attack: () => void;
  onP2Special: () => void;
  onP2Defend: () => void;

  onRebuild: (type: 'Eagle' | 'Cat' | 'Rabbit') => void;
  onNewScene: (type: string) => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onPromptCreate: () => void;
  onPromptMorph: () => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onToggleRotation: () => void;
  
  onBuyItem: (item: ShopItem) => void;
}

const LOADING_MESSAGES = [
    "Cloning Fighter...",
    "Preparing Arena...",
    "Calibrating Physics...",
    "Sharpening Voxels...",
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isGenerating,
  gameStatus,
  difficulty,
  gameMode,
  gameType,
  mapTheme,
  score,
  unlockedItems,
  playerHealth,
  enemyHealth,
  maxHealth,
  playerEnergy,
  enemyEnergy,
  combatMessage,
  isPlayerDefending,
  isEnemyDefending,
  isPlayerStunned,
  isEnemyStunned,
  onSetDifficulty,
  onSetGameMode,
  onSetGameType,
  onSetMapTheme,
  onStartGame,
  onReturnToMenu,
  onAttack,
  onSpecialAttack,
  onDefend,
  onP2Attack,
  onP2Special,
  onP2Defend,
  onRebuild,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onPromptCreate,
  onPromptMorph,
  onShowJson,
  onImportJson,
  onToggleRotation,
  onBuyItem
}) => {
  const isEagle = currentBaseModel === 'Eagle';
  const playerPercent = (playerHealth / maxHealth) * 100;
  const enemyPercent = (enemyHealth / maxHealth) * 100;
  const energyPercent = Math.min(100, Math.max(0, playerEnergy));
  const enemyEnergyPercent = Math.min(100, Math.max(0, enemyEnergy));
  const canUseSpecial = energyPercent >= 100;
  const canEnemyUseSpecial = enemyEnergyPercent >= 100;

  const currentRank = getRank(score.tokens);

  const isMenu = gameStatus === 'MENU';
  const isPlaying = gameStatus === 'PLAYING';
  const isGameOver = gameStatus === 'GAME_OVER';

  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'PLAY' | 'SHOP' | 'SETTINGS'>('PLAY');

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    } else {
        setLoadingMsgIndex(0);
    }
  }, [isGenerating]);

  // --- RENDER HELPERS ---

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none font-sans">
      
      {/* --- MENU TABS --- */}
      {isMenu && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
              <div className="bg-white rounded-3xl shadow-2xl flex flex-col pointer-events-auto w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  
                  {/* Header */}
                  <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">VOXEL FIGHTER</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Current Rank</span>
                             <span className={`text-sm font-black uppercase ${currentRank.color}`}>{currentRank.name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                            <Coins size={18} className="text-amber-600" fill="currentColor"/>
                            <span className="font-bold text-amber-800">{score.tokens}</span>
                        </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                      <TabButton label="BATTLE" icon={<Swords size={18} />} active={activeTab === 'PLAY'} onClick={() => setActiveTab('PLAY')} />
                      <TabButton label="BARRACKS & SHOP" icon={<ShoppingBag size={18} />} active={activeTab === 'SHOP'} onClick={() => setActiveTab('SHOP')} />
                      <TabButton label="SETTINGS" icon={<Settings size={18} />} active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} />
                  </div>

                  {/* Content Area */}
                  <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                      
                      {activeTab === 'PLAY' && (
                          <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 fade-in duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Difficulty / Player Count Card */}
                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <Users size={14}/> PLAYERS & DIFFICULTY
                                      </h3>
                                      <div className="flex gap-2 mb-4">
                                          <SettingsBtn label="1 PLAYER (PvE)" active={gameType === 'PVE'} onClick={() => onSetGameType('PVE')} color="indigo" />
                                          <SettingsBtn label="2 PLAYERS (PvP)" active={gameType === 'PVP'} onClick={() => onSetGameType('PVP')} color="rose" />
                                      </div>
                                      
                                      {gameType === 'PVE' && (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                            <SettingsBtn label="EASY" active={difficulty === 'EASY'} onClick={() => onSetDifficulty('EASY')} color="emerald" />
                                            <SettingsBtn label="MEDIUM" active={difficulty === 'MEDIUM'} onClick={() => onSetDifficulty('MEDIUM')} color="amber" />
                                            <SettingsBtn label="HARD" active={difficulty === 'HARD'} onClick={() => onSetDifficulty('HARD')} color="rose" />
                                        </div>
                                      )}
                                  </div>

                                  {/* Mode Card */}
                                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <Zap size={14}/> GAME MODE
                                      </h3>
                                      <div className="flex gap-2">
                                          <SettingsBtn label="STANDARD" active={gameMode === 'STANDARD'} onClick={() => onSetGameMode('STANDARD')} color="blue" />
                                          <SettingsBtn label="SUDDEN DEATH" active={gameMode === 'SUDDEN_DEATH'} onClick={() => onSetGameMode('SUDDEN_DEATH')} color="purple" />
                                          <SettingsBtn label="TANK" active={gameMode === 'TANK'} onClick={() => onSetGameMode('TANK')} color="slate" />
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Selected Fighter Preview */}
                              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                  <div>
                                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Ready to Deploy</div>
                                      <div className="text-2xl font-black text-indigo-900">{currentBaseModel}</div>
                                      <div className="text-indigo-600 text-sm font-semibold">{voxelCount} Voxels</div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => setActiveTab('SHOP')}
                                        className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
                                      >
                                          Change Fighter
                                      </button>
                                  </div>
                              </div>

                              <button 
                                onClick={onStartGame}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 border-b-[6px] border-indigo-800 active:border-b-0 active:translate-y-[6px]"
                              >
                                  START BATTLE
                              </button>
                          </div>
                      )}

                      {activeTab === 'SHOP' && (
                          <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">FIGHTERS</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                  {/* Default Generators */}
                                  {SHOP_ITEMS.filter(i => i.type === 'FIGHTER').map(item => {
                                      const isUnlocked = unlockedItems.includes(item.id);
                                      const isSelected = currentBaseModel === item.value;
                                      return (
                                          <ShopCard 
                                            key={item.id}
                                            name={item.name}
                                            cost={item.cost}
                                            isUnlocked={isUnlocked}
                                            isSelected={isSelected}
                                            canAfford={score.tokens >= item.cost}
                                            onClick={() => isUnlocked ? onNewScene(item.value) : onBuyItem(item)}
                                          />
                                      );
                                  })}
                                  {/* Create New */}
                                  <button onClick={onPromptCreate} className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all min-h-[120px]">
                                      <Wand2 size={24} />
                                      <span className="font-bold text-sm">Create New</span>
                                  </button>
                              </div>
                              
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">BATTLE MAPS</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {SHOP_ITEMS.filter(i => i.type === 'MAP').map(item => {
                                      const isUnlocked = unlockedItems.includes(item.id);
                                      const isSelected = mapTheme === item.value;
                                      return (
                                          <ShopCard 
                                            key={item.id}
                                            name={item.name}
                                            cost={item.cost}
                                            isUnlocked={isUnlocked}
                                            isSelected={isSelected}
                                            canAfford={score.tokens >= item.cost}
                                            onClick={() => isUnlocked ? onSetMapTheme(item.value) : onBuyItem(item)}
                                          />
                                      );
                                  })}
                              </div>
                          </div>
                      )}

                      {activeTab === 'SETTINGS' && (
                          <div className="flex flex-col gap-4 animate-in slide-in-from-right-8 fade-in duration-300">
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">DATA MANAGEMENT</h3>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                  <div className="flex gap-2">
                                      <MenuButton onClick={onImportJson} icon={<FileJson size={16}/>} label="Import JSON" />
                                      <MenuButton onClick={onShowJson} icon={<Code2 size={16}/>} label="Export Current" />
                                  </div>
                              </div>
                              
                              {customBuilds.length > 0 && (
                                  <>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">CUSTOM BUILD HISTORY</h3>
                                    <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-col gap-1 max-h-60 overflow-y-auto">
                                        {customBuilds.map((model, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => onSelectCustomBuild(model)}
                                                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                            >
                                                <span className="font-bold text-slate-700">{model.name}</span>
                                                <span className="text-xs font-bold text-slate-400">Load</span>
                                            </button>
                                        ))}
                                    </div>
                                  </>
                              )}
                          </div>
                      )}

                  </div>
              </div>
          </div>
      )}

      {/* --- GAME OVER SCREEN --- */}
      {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 animate-in zoom-in duration-300">
             <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-slate-100 flex flex-col items-center gap-6 pointer-events-auto min-w-[320px]">
                 
                 {/* Logic for Winner Text */}
                 <div className="flex flex-col items-center">
                    <Trophy size={80} className="text-yellow-500 mb-4 drop-shadow-md" />
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 uppercase italic">
                        {gameType === 'PVP' 
                           ? (playerHealth > 0 ? "P1 WINS" : "P2 WINS")
                           : (playerHealth > 0 ? "VICTORY" : "DEFEAT")
                        }
                    </h2>
                    <div className="mt-2 bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full font-bold flex items-center gap-2">
                         <Coins size={16} /> {playerHealth > 0 ? "+50" : "+10"} Tokens
                    </div>
                 </div>

                 <div className="flex gap-3 w-full mt-4">
                    <button 
                        onClick={onReturnToMenu} 
                        className="flex-1 px-4 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Menu
                    </button>
                    <button 
                        onClick={onStartGame} 
                        className="flex-[2] px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        <Sword size={18} /> Play Again
                    </button>
                 </div>
             </div>
          </div>
      )}

      {/* --- HUD (Only if Playing or Game Over) --- */}
      {!isMenu && (
        <>
            {/* Top Left: Player Stats */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto w-64 animate-in slide-in-from-left duration-500">
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-black text-blue-500 uppercase tracking-widest mb-1">
                        <span>P1 (YOU)</span>
                        <Heart size={14} fill="currentColor" />
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                            style={{ width: `${playerPercent}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <div className="text-[10px] font-bold text-slate-400">{playerHealth}/{maxHealth}</div>
                        
                        {/* Energy Bar Mini */}
                        <div className="flex items-center gap-1">
                             <Zap size={10} className={canUseSpecial ? "text-amber-500" : "text-slate-300"} fill="currentColor"/>
                             <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${canUseSpecial ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'}`} 
                                    style={{width: `${energyPercent}%`}}
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Right: Enemy Stats */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto w-64 animate-in slide-in-from-right duration-500">
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-black text-rose-500 uppercase tracking-widest mb-1">
                        <Heart size={14} fill="currentColor" />
                        <span>{gameType === 'PVE' ? `CPU (${difficulty})` : 'P2 (ENEMY)'}</span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative">
                        <div 
                            className="h-full bg-gradient-to-l from-rose-500 to-orange-400 transition-all duration-300 ease-out"
                            style={{ width: `${enemyPercent}%` }}
                        />
                    </div>
                    
                    {/* Enemy energy only visible in PVP or if you want to see AI energy */}
                    <div className="flex justify-between mt-1">
                        <div className="text-[10px] font-bold text-slate-400">{enemyHealth}/{maxHealth}</div>
                         {/* Energy Bar Mini P2 */}
                         <div className="flex items-center gap-1">
                             <Zap size={10} className={canEnemyUseSpecial ? "text-amber-500" : "text-slate-300"} fill="currentColor"/>
                             <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${canEnemyUseSpecial ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'}`} 
                                    style={{width: `${enemyEnergyPercent}%`}}
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

      {/* --- Center Combat Message --- */}
      {combatMessage && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
              <div className="text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter stroke-black animate-in zoom-in duration-150 text-center whitespace-nowrap">
                  {combatMessage}
              </div>
          </div>
      )}

      {/* --- Loading Indicator --- */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-white/90 backdrop-blur-md border-2 border-indigo-100 px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
                  <Loader2 size={48} className="text-indigo-500 animate-spin" />
                  <div className="text-center">
                      <h3 className="text-lg font-extrabold text-slate-800">Gemini is Generating...</h3>
                      <p className="text-slate-500 font-bold text-sm">{LOADING_MESSAGES[loadingMsgIndex]}</p>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTROLS --- */}
      {isPlaying && (
        <div className="absolute bottom-8 left-0 w-full flex justify-between items-end px-8 pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-500">
            
            {/* LEFT SIDE: P1 CONTROLS */}
            <div className="pointer-events-auto flex items-end gap-6 transition-all duration-300">
                {/* Special Attack Button - Left Side */}
                <div className="flex flex-col items-center gap-1">
                     <button
                        onClick={onSpecialAttack}
                        disabled={!canUseSpecial || isPlayerStunned}
                        className={`
                            flex flex-col items-center justify-center w-20 h-20 rounded-full font-black text-[10px] uppercase tracking-wide transition-all
                            border-4 shadow-xl relative overflow-hidden group
                            ${canUseSpecial && !isPlayerStunned
                                ? 'bg-amber-500 border-amber-300 text-white hover:scale-105 animate-pulse cursor-pointer' 
                                : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed grayscale'}
                        `}
                    >
                        {isPlayerStunned ? <LockKeyhole size={24} className="mb-1" /> : (
                            <div className="z-10 flex flex-col items-center">
                                <Flame size={24} fill="currentColor" className={canUseSpecial ? "mb-1" : "mb-1 opacity-50"} />
                                ULT
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-full bg-amber-600/50 transition-all duration-500" style={{height: `${energyPercent}%`}} />
                    </button>
                    <div className="text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {Math.floor(energyPercent)}%
                    </div>
                </div>

                {/* P1 Actions */}
                <div className="flex gap-4 items-center">
                    <button
                        onClick={onDefend}
                        disabled={isPlayerStunned}
                        className={`
                            flex flex-col items-center justify-center w-24 h-24 rounded-2xl font-black text-sm uppercase tracking-wide transition-all
                            border-b-[6px] active:border-b-0 active:translate-y-[6px] shadow-xl relative
                            ${isPlayerStunned ? 'bg-slate-400 border-slate-600 text-slate-200 cursor-not-allowed' : 
                                (isPlayerDefending 
                                ? 'bg-blue-600 border-blue-800 text-white scale-95 ring-4 ring-blue-300' 
                                : 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400')
                            }
                        `}
                    >
                        {isPlayerStunned && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl"><LockKeyhole size={32} /></div>}
                        <Shield size={32} strokeWidth={2.5} className="mb-1" />
                        Defense
                    </button>

                    <button
                        onClick={onAttack}
                        disabled={isPlayerStunned}
                        className={`
                            flex flex-col items-center justify-center w-32 h-32 rounded-3xl font-black text-lg uppercase tracking-wider transition-all
                            border-b-[8px] active:border-b-0 active:translate-y-[8px] shadow-2xl relative
                            ${isPlayerStunned ? 'bg-slate-400 border-slate-600 text-slate-200 cursor-not-allowed' :
                            'bg-rose-500 border-rose-700 text-white hover:bg-rose-400 active:bg-rose-600'}
                        `}
                    >
                        {isPlayerStunned && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl"><LockKeyhole size={40} /></div>}
                        <Sword size={40} strokeWidth={2.5} className="mb-2" />
                        ATTACK
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: P2 CONTROLS (PvP Only) OR Share Button (PvE) */}
            {gameType === 'PVP' ? (
                <div className="pointer-events-auto flex items-end gap-6 transition-all duration-300">
                     {/* P2 Actions */}
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={onP2Attack}
                            disabled={isEnemyStunned}
                            className={`
                                flex flex-col items-center justify-center w-32 h-32 rounded-3xl font-black text-lg uppercase tracking-wider transition-all
                                border-b-[8px] active:border-b-0 active:translate-y-[8px] shadow-2xl relative
                                ${isEnemyStunned ? 'bg-slate-400 border-slate-600 text-slate-200 cursor-not-allowed' :
                                'bg-rose-500 border-rose-700 text-white hover:bg-rose-400 active:bg-rose-600'}
                            `}
                        >
                            {isEnemyStunned && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl"><LockKeyhole size={40} /></div>}
                            <Sword size={40} strokeWidth={2.5} className="mb-2" />
                            ATTACK
                        </button>

                         <button
                            onClick={onP2Defend}
                            disabled={isEnemyStunned}
                            className={`
                                flex flex-col items-center justify-center w-24 h-24 rounded-2xl font-black text-sm uppercase tracking-wide transition-all
                                border-b-[6px] active:border-b-0 active:translate-y-[6px] shadow-xl relative
                                ${isEnemyStunned ? 'bg-slate-400 border-slate-600 text-slate-200 cursor-not-allowed' : 
                                    (isEnemyDefending 
                                    ? 'bg-blue-600 border-blue-800 text-white scale-95 ring-4 ring-blue-300' 
                                    : 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400')
                                }
                            `}
                        >
                            {isEnemyStunned && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl"><LockKeyhole size={32} /></div>}
                            <Shield size={32} strokeWidth={2.5} className="mb-1" />
                            Defense
                        </button>
                    </div>

                    {/* P2 Special */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={onP2Special}
                            disabled={!canEnemyUseSpecial || isEnemyStunned}
                            className={`
                                flex flex-col items-center justify-center w-20 h-20 rounded-full font-black text-[10px] uppercase tracking-wide transition-all
                                border-4 shadow-xl relative overflow-hidden group
                                ${canEnemyUseSpecial && !isEnemyStunned
                                    ? 'bg-amber-500 border-amber-300 text-white hover:scale-105 animate-pulse cursor-pointer' 
                                    : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed grayscale'}
                            `}
                        >
                            {isEnemyStunned ? <LockKeyhole size={24} className="mb-1" /> : (
                                <div className="z-10 flex flex-col items-center">
                                    <Flame size={24} fill="currentColor" className={canEnemyUseSpecial ? "mb-1" : "mb-1 opacity-50"} />
                                    ULT
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full bg-amber-600/50 transition-all duration-500" style={{height: `${enemyEnergyPercent}%`}} />
                        </button>
                         <div className="text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {Math.floor(enemyEnergyPercent)}%
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-20 flex justify-center pointer-events-auto">
                    <TactileButton
                        onClick={onShowJson}
                        color="slate"
                        icon={<Code2 size={20} />}
                        label="Share"
                        compact
                    />
                </div>
            )}
        </div>
      )}

    </div>
  );
};

// --- Components ---

const TabButton: React.FC<{ label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon, active, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-4 font-bold text-xs flex items-center justify-center gap-2 border-b-4 transition-colors ${active ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
            {icon} {label}
        </button>
    )
}

const ShopCard: React.FC<{ name: string, cost: number, isUnlocked: boolean, isSelected: boolean, canAfford: boolean, onClick: () => void }> = ({ name, cost, isUnlocked, isSelected, canAfford, onClick }) => {
    let borderColor = "border-slate-200";
    let bgColor = "bg-white";
    
    if (isSelected) {
        borderColor = "border-indigo-500";
        bgColor = "bg-indigo-50";
    }

    return (
        <button 
            onClick={onClick}
            disabled={!isUnlocked && !canAfford}
            className={`
                relative p-4 rounded-2xl border-2 flex flex-col gap-2 items-center text-center transition-all min-h-[120px] justify-between
                ${borderColor} ${bgColor}
                ${(!isUnlocked && !canAfford) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] shadow-sm'}
            `}
        >
            <div className="font-bold text-slate-700 text-sm">{name}</div>
            
            {isUnlocked ? (
                 isSelected ? (
                     <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">EQUIPPED</div>
                 ) : (
                     <div className="text-slate-400 text-xs font-bold">OWNED</div>
                 )
            ) : (
                <div className={`flex items-center gap-1 font-bold ${canAfford ? 'text-amber-600' : 'text-slate-400'}`}>
                    {canAfford ? <Coins size={14} /> : <Lock size={14} />}
                    {cost}
                </div>
            )}
        </button>
    )
}


const MenuButton: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, active?: boolean, highlight?: boolean }> = ({ onClick, icon, label, active, highlight }) => {
    let bgClass = "bg-white text-slate-600 hover:bg-slate-50 border-slate-200";
    if (active) bgClass = "bg-indigo-500 text-white border-indigo-700 shadow-indigo-200 shadow-lg";
    if (highlight) bgClass = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-700";

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold border-b-2 active:border-b-0 active:translate-y-[2px] transition-all justify-center ${bgClass}`}
        >
            {icon} {label}
        </button>
    )
}

const SettingsBtn: React.FC<{ label: string, color: string, active: boolean, onClick: () => void }> = ({ label, color, active, onClick }) => {
    const colorMap: Record<string, string> = {
        emerald: active ? "bg-emerald-500 border-emerald-700 text-white" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
        amber: active ? "bg-amber-500 border-amber-700 text-white" : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
        rose: active ? "bg-rose-500 border-rose-700 text-white" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",
        blue: active ? "bg-blue-500 border-blue-700 text-white" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
        purple: active ? "bg-purple-500 border-purple-700 text-white" : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
        slate: active ? "bg-slate-700 border-slate-900 text-white" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
        sky: active ? "bg-sky-500 border-sky-700 text-white" : "bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100",
        indigo: active ? "bg-indigo-500 border-indigo-700 text-white" : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100",
    };

    return (
        <button 
            className={`flex-1 py-2 rounded-lg text-[10px] font-black border-b-[3px] active:border-b-0 active:translate-y-[3px] transition-all ${colorMap[color]}`} 
            onClick={onClick}
        >
            {label}
        </button>
    )
}

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  color: 'slate' | 'rose' | 'sky' | 'emerald' | 'amber' | 'indigo';
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, icon, label, color, compact }) => {
  const colorStyles = {
    slate:   'bg-slate-200 text-slate-600 shadow-slate-300 hover:bg-slate-300',
    rose:    'bg-rose-500 text-white shadow-rose-700 hover:bg-rose-600',
    sky:     'bg-sky-500 text-white shadow-sky-700 hover:bg-sky-600',
    emerald: 'bg-emerald-500 text-white shadow-emerald-700 hover:bg-emerald-600',
    amber:   'bg-amber-400 text-amber-900 shadow-amber-600 hover:bg-amber-500',
    indigo:  'bg-indigo-500 text-white shadow-indigo-700 hover:bg-indigo-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-100
        border-b-[4px] active:border-b-0 active:translate-y-[4px]
        ${compact ? 'p-3' : 'px-4 py-3'}
        ${disabled 
          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none' 
          : `${colorStyles[color]} border-black/20 shadow-lg`}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'indigo' | 'emerald';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bgClass = color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600 border-indigo-800' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-800';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 font-bold text-white shadow-lg rounded-2xl transition-all active:scale-95
                    ${bgClass}
                    ${big ? 'px-8 py-4 text-lg border-b-[6px] active:border-b-0 active:translate-y-[6px]' : 'px-4 py-3 text-sm border-b-[4px] active:border-b-0 active:translate-y-[4px]'}
                `}
            >
                {icon}
                {label}
                <ChevronUp size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} 
                    w-56 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, highlight?: boolean, truncate?: boolean }> = ({ onClick, icon, label, highlight, truncate }) => {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors text-left
                ${highlight 
                    ? 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600 hover:from-sky-100 hover:to-blue-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
            `}
        >
            <div className="shrink-0">{icon}</div>
            <span className={truncate ? "truncate w-full" : ""}>{label}</span>
        </button>
    )
}