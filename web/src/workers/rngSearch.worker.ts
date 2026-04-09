// Web Worker — holds one RngHelper instance, runs all blocking operations off the main thread.

import { PlatformType } from '../core/types';
import { Character } from '../core/Character';
import { CharacterGroup } from '../core/CharacterGroup';
import { Chest } from '../core/Chest';
import { Monster } from '../core/Monster';
import { ChestRngHelper } from '../core/ChestRngHelper';
import { StealRngHelper } from '../core/StealRngHelper';
import { SpawnRngHelper } from '../core/SpawnRngHelper';
import type { BaseRngHelper } from '../core/BaseRngHelper';
import type {
  UIMessage,
  WorkerMessage,
  SerializedFutureRng,
  WorkerMode,
} from './workerMessages';

let helper: BaseRngHelper | null = null;
let mode: WorkerMode | null = null;

function send(msg: WorkerMessage): void {
  postMessage(msg);
}

function buildGroup(characters: { level: number; magic: number; spell: any; serenity: boolean }[]): CharacterGroup {
  const group = new CharacterGroup();
  for (const c of characters) {
    group.addCharacter(new Character(c.level, c.magic, c.spell, c.serenity));
  }
  return group;
}

function serializeFutureRng(currentMode: WorkerMode): SerializedFutureRng {
  if (currentMode === 'chest' && helper) {
    const f = helper.getChestFutureRng();
    const instances = [];
    for (let i = 0; i < f.getTotalPositions(); i++) {
      const inst = f.getInstanceAt(i);
      instances.push({
        isPastRng: inst.isPastRng,
        index: inst.index,
        currentHeal: inst.currentHeal,
        randToPercent: inst.randToPercent,
        chestRewards: inst.chestRewards.map(r => ({
          chestWillSpawn: r.chestWillSpawn,
          gilAmount: r.gilAmount,
          reward: r.reward,
        })),
      });
    }
    const dirs = [];
    for (let i = 0; i < f.getAdvanceDirectionsCount(); i++) {
      const d = f.getAdvanceDirectionsAt(i);
      dirs.push({ advanceToAppear: d.advanceToAppear, advanceForItem: d.advanceForItem });
    }
    return { mode: 'chest', chestInstances: instances, advanceDirections: dirs };
  }

  if (currentMode === 'steal' && helper) {
    const f = helper.getStealFutureRng();
    const instances = [];
    for (let i = 0; i < f.getTotalPositions(); i++) {
      const inst = f.getInstanceAt(i);
      instances.push({
        isPastRng: inst.isPastRng,
        index: inst.index,
        currentHeal: inst.currentHeal,
        randToPercent: inst.randToPercent,
        normalReward: inst.normalReward,
        cuffsReward: inst.cuffsReward,
        lv99RedChocobo: inst.lv99RedChocobo,
      });
    }
    const d = f.getStealDirections();
    return {
      mode: 'steal',
      stealInstances: instances,
      stealDirections: { advanceForRare: d.advanceForRare, advanceForRareCuffs: d.advanceForRareCuffs },
    };
  }

  if (currentMode === 'spawn' && helper) {
    const f = helper.getSpawnFutureRng();
    const instances = [];
    for (let i = 0; i < f.getTotalPositions(); i++) {
      const inst = f.getInstanceAt(i);
      instances.push({
        isPastRng: inst.isPastRng,
        index: inst.index,
        currentHeal: inst.currentHeal,
        spawnChance: inst.spawnChance,
        rawRngValue: inst.rawRngValue,
        monsterSpawns: inst.monsterSpawns,
      });
    }
    const dirs = [];
    for (let i = 0; i < f.getSpawnDirectionsCount(); i++) {
      dirs.push({ directions: f.getSpawnDirectionsAt(i).directions });
    }
    return { mode: 'spawn', spawnInstances: instances, spawnDirections: dirs };
  }

  return { mode: currentMode };
}

self.onmessage = (event: MessageEvent<UIMessage>) => {
  const msg = event.data;

  if (msg.type === 'INIT') {
    mode = msg.mode;
    const group = buildGroup(msg.characters);
    const platform = msg.platform as PlatformType;

    if (msg.mode === 'chest') {
      const chests = (msg.chests ?? []).map(
        c => new Chest(c.spawnChance, c.rngPosition, c.gilChance, c.itemChance, c.gilAmount, c.wantItem1),
      );
      helper = new ChestRngHelper(platform, group, chests);
    } else if (msg.mode === 'steal') {
      helper = new StealRngHelper(platform, group);
    } else if (msg.mode === 'spawn') {
      const monsters = (msg.monsters ?? []).map(
        m => new Monster(m.minChance, m.maxChance, m.rngPosition),
      );
      helper = new SpawnRngHelper(platform, group, monsters);
    }

    send({ type: 'READY' });
    return;
  }

  if (!helper || !mode) {
    send({ type: 'ERROR', message: 'Worker not initialized. Send INIT first.' });
    return;
  }

  if (msg.type === 'REINIT') {
    helper.reinitialize();
    send({ type: 'READY' });
    return;
  }

  if (msg.type === 'FIND_FIRST') {
    const found = helper.findFirstRngPosition(msg.healValue);
    if (!found) {
      send({ type: 'ERROR', message: 'Impossible heal value — not found in RNG sequence.' });
      return;
    }
    helper.calculateRng(msg.numRows);
    send({
      type: 'RESULT',
      nextHeal: helper.getNextExpectedHealValue(),
      combo: helper.getAttacksUntilNextCombo(),
      futureRng: serializeFutureRng(mode),
    });
    return;
  }

  if (msg.type === 'FIND_NEXT') {
    const found = helper.findNextRngPosition(msg.healValue);
    if (!found) {
      send({ type: 'ERROR', message: 'Impossible heal value — not found in RNG sequence.' });
      return;
    }
    helper.calculateRng(msg.numRows);
    send({
      type: 'RESULT',
      nextHeal: helper.getNextExpectedHealValue(),
      combo: helper.getAttacksUntilNextCombo(),
      futureRng: serializeFutureRng(mode),
    });
    return;
  }

  if (msg.type === 'CONSUME') {
    helper.consumeNextNRngPositions(msg.count);
    helper.calculateRng(msg.numRows);
    send({
      type: 'RESULT',
      nextHeal: helper.getNextExpectedHealValue(),
      combo: helper.getAttacksUntilNextCombo(),
      futureRng: serializeFutureRng(mode),
    });
    return;
  }

  if (msg.type === 'CALCULATE') {
    helper.calculateRng(msg.numRows);
    send({
      type: 'RESULT',
      nextHeal: helper.getNextExpectedHealValue(),
      combo: helper.getAttacksUntilNextCombo(),
      futureRng: serializeFutureRng(mode),
    });
    return;
  }
};
