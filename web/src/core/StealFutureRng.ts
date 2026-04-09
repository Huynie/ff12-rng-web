import { StealType } from './types';

export class StealFutureRngInstance {
  isPastRng = false;
  index = -1;
  currentHeal = -1;
  randToPercent = -1;
  normalReward: StealType = StealType.None;
  cuffsReward: StealType[] = [StealType.None];
  lv99RedChocobo = false;
}

export class StealDirections {
  advanceForRare = -1;
  advanceForRareCuffs = -1;
}

export class StealFutureRng {
  private _instances: StealFutureRngInstance[] = [];
  private _stealDirections = new StealDirections();

  getTotalPositions(): number { return this._instances.length; }
  addInstance(instance: StealFutureRngInstance): void { this._instances.push(instance); }
  getInstanceAt(i: number): StealFutureRngInstance { return this._instances[i]; }
  getStealDirections(): StealDirections { return this._stealDirections; }
  setStealDirections(d: StealDirections): void { this._stealDirections = d; }
}
