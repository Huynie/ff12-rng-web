import { PlatformType } from './types';
import { BaseRngHelper } from './BaseRngHelper';
import { CharacterGroup } from './CharacterGroup';
import { Monster, RARE_SPAWN_VALUE } from './Monster';
import {
  SpawnFutureRng,
  SpawnFutureRngInstance,
  SpawnDirections,
} from './SpawnFutureRng';

export class SpawnRngHelper extends BaseRngHelper {
  private readonly _monsters: Monster[];
  private _futureRng: SpawnFutureRng;

  constructor(platform: PlatformType, group: CharacterGroup, monsters: Monster[]) {
    super(platform, group);
    this._monsters = monsters;
    this._futureRng = new SpawnFutureRng();
  }

  override getSpawnFutureRng(): SpawnFutureRng {
    return this._futureRng;
  }

  protected override calculateRngHelper(): void {
    for (const monster of this._monsters) monster.resetSpawnInfo();

    this._futureRng = new SpawnFutureRng();
    const lastNBeforeM = this.initializeMatrix();

    this.comboFound = false;
    this.comboPosition = -1;

    let firstRngVal  = this.displayRng.genrand();
    let secondRngVal = this.displayRng.genrand();

    const indexStatic = this.group.getIndex();
    this.group.resetIndex();

    const start = this.getLoopStartIndex();
    const end = start + this.healVals.length + this.futureRngPositionsToCalculate;

    for (let index = start; index < end; index++) {
      this.loopIndex = index - start;

      const currentHeal = this.group.getHealValue(firstRngVal);
      const nextHeal = this.group.peekHealValue(secondRngVal);

      if (index === start + this.healVals.length - 1 || index === 1) {
        this.nextHealValue = nextHeal;
      }

      const firstRngValTemp = firstRngVal;
      firstRngVal  = secondRngVal;
      secondRngVal = this.displayRng.genrand();

      if (this.loopIndex < this.healVals.length - 5) continue;

      const instance = new SpawnFutureRngInstance(this._monsters.length);
      if (index < start + this.healVals.length) instance.isPastRng = true;

      instance.index = index;
      instance.currentHeal = currentHeal;
      const spawnChance = firstRngValTemp / RARE_SPAWN_VALUE;
      instance.spawnChance = spawnChance;
      instance.rawRngValue = firstRngValTemp;

      this.calculateMonsterSpawns(spawnChance, instance);
      this.calculateLastNBeforeM(lastNBeforeM, spawnChance);
      this.checkForCombo(firstRngValTemp);
      this._futureRng.addInstance(instance);
    }

    this._futureRng.setLastNBeforeMMatrix(lastNBeforeM);
    this.writeSpawnDirections();
    this.attacksBeforeNextCombo = this.comboPosition;
    this.group.setIndex(indexStatic);
  }

  private calculateMonsterSpawns(spawnChance: number, instance: SpawnFutureRngInstance): void {
    for (let i = 0; i < this._monsters.length; i++) {
      const monster = this._monsters[i];
      if (monster.spawnCheck(spawnChance)) {
        instance.monsterSpawns[i] = true;
        const chestChance = this.healVals.length + monster.getRngPosition() - 1;
        if (this.loopIndex >= chestChance && !monster.hasMonsterSpawned()) {
          monster.setMonsterFoundPosition(
            this.loopIndex - this.healVals.length - monster.getRngPosition() + 1,
          );
          monster.setMonsterSpawned();
        }
      }
    }
  }

  private initializeMatrix(): number[][] {
    return Array.from({ length: this._monsters.length }, () =>
      Array(this._monsters.length).fill(Number.MIN_SAFE_INTEGER),
    );
  }

  private calculateLastNBeforeM(lastNBeforeM: number[][], spawnChance: number): void {
    for (let n = 0; n < this._monsters.length; n++) {
      if (this._monsters[n].spawnCheck(spawnChance)) {
        for (let m = 0; m < this._monsters.length; m++) {
          if (!this._monsters[m].hasMonsterSpawned()) {
            lastNBeforeM[n][m] = n === m
              ? 0
              : this.loopIndex - this.healVals.length - this._monsters[n].getRngPosition() + 1;
          }
        }
      }
    }
  }

  private writeSpawnDirections(): void {
    for (const monster of this._monsters) {
      const d = new SpawnDirections();
      d.directions = monster.getMonsterFoundPosition();
      this._futureRng.addSpawnDirections(d);
    }
  }
}
