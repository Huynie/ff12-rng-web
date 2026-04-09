import type { PlatformType, Spells } from '../core/types';

// ── Serializable character/entity config ──────────────────────────────────

export interface CharacterConfig {
  level: number;
  magic: number;
  spell: Spells;
  serenity: boolean;
}

export interface ChestConfig {
  spawnChance: number;
  rngPosition: number;
  gilChance: number;
  itemChance: number;
  gilAmount: number;
  wantItem1: boolean;
}

export interface MonsterConfig {
  minChance: number;
  maxChance: number;
  rngPosition: number;
}

// ── Messages UI → Worker ───────────────────────────────────────────────────

export type WorkerMode = 'chest' | 'steal' | 'spawn';

export interface MsgInit {
  type: 'INIT';
  mode: WorkerMode;
  platform: PlatformType;
  characters: CharacterConfig[];
  chests?: ChestConfig[];
  monsters?: MonsterConfig[];
}

export interface MsgFindFirst {
  type: 'FIND_FIRST';
  healValue: number;
  numRows: number;
}

export interface MsgFindNext {
  type: 'FIND_NEXT';
  healValue: number;
  numRows: number;
}

export interface MsgConsume {
  type: 'CONSUME';
  count: number;
  numRows: number;
}

export interface MsgCalculate {
  type: 'CALCULATE';
  numRows: number;
}

export interface MsgReinit {
  type: 'REINIT';
}

export type UIMessage = MsgInit | MsgFindFirst | MsgFindNext | MsgConsume | MsgCalculate | MsgReinit;

// ── Messages Worker → UI ───────────────────────────────────────────────────

export interface MsgResult {
  type: 'RESULT';
  nextHeal: number;
  combo: number;
  futureRng: SerializedFutureRng;
}

export interface MsgError {
  type: 'ERROR';
  message: string;
}

export interface MsgReady {
  type: 'READY';
}

export type WorkerMessage = MsgResult | MsgError | MsgReady;

// ── Serializable FutureRng shapes (plain objects for postMessage) ──────────

export interface SerializedChestInstance {
  isPastRng: boolean;
  index: number;
  currentHeal: number;
  randToPercent: number;
  chestRewards: Array<{ chestWillSpawn: boolean; gilAmount: number; reward: string }>;
}

export interface SerializedStealInstance {
  isPastRng: boolean;
  index: number;
  currentHeal: number;
  randToPercent: number;
  normalReward: string;
  cuffsReward: string[];
  lv99RedChocobo: boolean;
}

export interface SerializedSpawnInstance {
  isPastRng: boolean;
  index: number;
  currentHeal: number;
  spawnChance: number;
  rawRngValue: number;
  monsterSpawns: boolean[];
}

export interface SerializedFutureRng {
  mode: WorkerMode;
  // chest
  chestInstances?: SerializedChestInstance[];
  advanceDirections?: Array<{ advanceToAppear: number; advanceForItem: number }>;
  // steal
  stealInstances?: SerializedStealInstance[];
  stealDirections?: { advanceForRare: number; advanceForRareCuffs: number };
  // spawn
  spawnInstances?: SerializedSpawnInstance[];
  spawnDirections?: Array<{ directions: number }>;
  lastNBeforeM?: number[][];
}
