export class Chest {
  private _spawnChance: number;
  private _rngPosition: number;
  private _gilChance: number;
  private _itemChance: number;
  private _gilAmount: number;
  private _wantItem1: boolean;

  // state
  private _chestSpawn = false;
  private _chestFound = false;
  private _chestFoundPos = -1;
  private _chestItemPos = -1;

  constructor(
    spawnChance: number,
    rngPosition: number,
    gilChance: number,
    itemChance: number,
    gilAmount: number,
    wantItem1 = false,
  ) {
    this._spawnChance = spawnChance;
    this._rngPosition = rngPosition;
    this._gilChance = gilChance;
    this._itemChance = itemChance;
    this._gilAmount = gilAmount;
    this._wantItem1 = wantItem1;
    this.resetSpawnInfo();
  }

  getRngPosition(): number {
    return this._rngPosition - 1;
  }

  checkSpawn(prng: number): boolean {
    return this.checkChest(prng, this._spawnChance);
  }

  checkIfGil(prng: number): boolean {
    return this.checkChest(prng, this._gilChance);
  }

  checkIfFirstItem(prng: number): boolean {
    return this.checkChest(prng, this._itemChance);
  }

  getGilAmount(prng: number): number {
    return 1 + (prng % this._gilAmount);
  }

  wantItemOne(): boolean {
    return this._wantItem1;
  }

  resetSpawnInfo(): void {
    this._chestSpawn = false;
    this._chestFound = false;
    this._chestFoundPos = -1;
    this._chestItemPos = -1;
  }

  getChestFoundPosition(): number { return this._chestFoundPos; }
  setChestFoundPosition(p: number): void { this._chestFoundPos = p; }
  hasChestSpawned(): boolean { return this._chestSpawn; }
  setChestSpawned(): void { this._chestSpawn = true; }
  isChestFound(): boolean { return this._chestFound; }
  setChestFound(): void { this._chestFound = true; }
  getChestItemPosition(): number { return this._chestItemPos; }
  setChestItemPosition(p: number): void { this._chestItemPos = p; }

  private randToPercent(prng: number): number {
    return prng % 100;
  }

  private checkChest(prng: number, chance: number): boolean {
    return this.randToPercent(prng) < chance;
  }
}
