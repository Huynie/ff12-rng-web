export const RARE_SPAWN_VALUE = 4294967296; // 2^32, fits exactly in JS double

export class Monster {
  private readonly _minChanceFraction: number;
  private readonly _maxChanceFraction: number;
  private readonly _rngPosition: number;

  private _spawned = false;
  private _foundPosition = -1;

  constructor(minChance: number, maxChance: number, rngPosition: number) {
    this._minChanceFraction = minChance / 100;
    this._maxChanceFraction = maxChance / 100;
    this._rngPosition = rngPosition;
  }

  resetSpawnInfo(): void {
    this._spawned = false;
    this._foundPosition = -1;
  }

  hasMonsterSpawned(): boolean { return this._spawned; }
  setMonsterSpawned(): void { this._spawned = true; }
  setMonsterFoundPosition(pos: number): void { this._foundPosition = pos; }
  getMonsterFoundPosition(): number { return this._foundPosition; }
  getRngPosition(): number { return this._rngPosition; }

  spawnCheck(chance: number): boolean {
    return chance > this._minChanceFraction && chance < this._maxChanceFraction;
  }
}
