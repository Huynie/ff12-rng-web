import { RewardType } from './types';

export class ChestReward {
  chestWillSpawn = false;
  gilAmount = -1;
  reward: RewardType = RewardType.Gil;
}

export class ChestFutureRngInstance {
  isPastRng = false;
  index = -1;
  currentHeal = -1;
  randToPercent = -1;
  chestRewards: ChestReward[];

  constructor(chestCount: number) {
    this.chestRewards = Array.from({ length: chestCount }, () => new ChestReward());
  }
}

export class AdvanceDirections {
  advanceToAppear = -1;
  advanceForItem = -1;
}

export class ChestFutureRng {
  private _instances: ChestFutureRngInstance[] = [];
  private _advanceDirections: AdvanceDirections[] = [];

  getTotalPositions(): number { return this._instances.length; }
  getAdvanceDirectionsCount(): number { return this._advanceDirections.length; }
  addInstance(instance: ChestFutureRngInstance): void { this._instances.push(instance); }
  getInstanceAt(i: number): ChestFutureRngInstance { return this._instances[i]; }
  addAdvanceDirections(d: AdvanceDirections): void { this._advanceDirections.push(d); }
  getAdvanceDirectionsAt(i: number): AdvanceDirections { return this._advanceDirections[i]; }
}
