export class SpawnFutureRngInstance {
  isPastRng = false;
  index = -1;
  currentHeal = -1;
  spawnChance = -1;
  rawRngValue = -1;
  monsterSpawns: boolean[];

  constructor(monsterCount: number) {
    this.monsterSpawns = Array(monsterCount).fill(false);
  }
}

export class SpawnDirections {
  directions = -1;
}

export class SpawnFutureRng {
  private _instances: SpawnFutureRngInstance[] = [];
  private _spawnDirections: SpawnDirections[] = [];
  private _lastNBeforeM: number[][] = [];

  getTotalPositions(): number { return this._instances.length; }
  getSpawnDirectionsCount(): number { return this._spawnDirections.length; }
  addInstance(instance: SpawnFutureRngInstance): void { this._instances.push(instance); }
  getInstanceAt(i: number): SpawnFutureRngInstance { return this._instances[i]; }
  addSpawnDirections(d: SpawnDirections): void { this._spawnDirections.push(d); }
  getSpawnDirectionsAt(i: number): SpawnDirections { return this._spawnDirections[i]; }
  setLastNBeforeMMatrix(m: number[][]): void { this._lastNBeforeM = m; }
  getStepsToLastNSpawnBeforeMSpawn(n: number, m: number): number { return this._lastNBeforeM[n][m]; }
}
