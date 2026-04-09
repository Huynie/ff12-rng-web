import { StealType } from './types';

const COMMON_CHANCE   = 55;
const UNCOMMON_CHANCE = 10;
const RARE_CHANCE     =  3;
const COMMON_CHANCE_CUFFS   = 80;
const UNCOMMON_CHANCE_CUFFS = 30;
const RARE_CHANCE_CUFFS     =  6;

function randToPercent(prng: number): number {
  return prng % 100;
}

function stealSuccessful(prng: number, chance: number): boolean {
  return randToPercent(prng) < chance;
}

export function checkSteal(prng1: number, prng2: number, prng3: number): StealType {
  if (stealSuccessful(prng1, RARE_CHANCE))     return StealType.Rare;
  if (stealSuccessful(prng2, UNCOMMON_CHANCE)) return StealType.Uncommon;
  if (stealSuccessful(prng3, COMMON_CHANCE))   return StealType.Common;
  return StealType.None;
}

export function checkStealCuffs(prng1: number, prng2: number, prng3: number): StealType[] {
  const rewards: StealType[] = [];
  if (stealSuccessful(prng1, RARE_CHANCE_CUFFS))     rewards.push(StealType.Rare);
  if (stealSuccessful(prng2, UNCOMMON_CHANCE_CUFFS)) rewards.push(StealType.Uncommon);
  if (stealSuccessful(prng3, COMMON_CHANCE_CUFFS))   rewards.push(StealType.Common);
  if (rewards.length === 0) rewards.push(StealType.None);
  return rewards;
}

export function wouldRareStealSucceed(prng: number, cuffs: boolean): boolean {
  return stealSuccessful(prng, cuffs ? RARE_CHANCE_CUFFS : RARE_CHANCE);
}
