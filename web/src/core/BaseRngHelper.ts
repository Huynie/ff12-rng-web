import { PlatformType } from './types';
import type { IRNG } from './types';
import { RNG1998 } from './RNG1998';
import { RNG2002 } from './RNG2002';
import { CircularBuffer } from './CircularBuffer';
import { CharacterGroup } from './CharacterGroup';
import { ChestFutureRng } from './ChestFutureRng';
import { StealFutureRng } from './StealFutureRng';
import { SpawnFutureRng } from './SpawnFutureRng';
import { INDEX_OF_PREVIOUS_COMBO_RNG, RNG_CONSUMED_FOR_ATTACK, isComboSuccessful } from './Combo';

const HISTORY_TO_DISPLAY = 5;
const FIND_NEXT_TIMEOUT_MS = 30_000;
const SEARCH_BUFFER_SIZE = 1_000_000;
const MAX_SEARCH_INDEX = 10_000_000;

interface RngState {
  groupIndex: number;
  index: number;
  healVals: number[];
  searchBuff: CircularBuffer<number>;
  searchRng: IRNG;
}

export abstract class BaseRngHelper {
  protected nextHealValue = 0;
  protected attacksBeforeNextCombo = -1;
  protected comboPosition = -1;
  protected comboFound = false;
  protected displayRng!: IRNG;
  protected loopIndex = 0;

  protected index = 0;
  protected futureRngPositionsToCalculate = 100;
  protected healVals: number[] = [];
  protected group: CharacterGroup;

  private _searchBuff!: CircularBuffer<number>;
  private _searchRng!: IRNG;
  private _platformType: PlatformType;
  private _foundFirstRngPosition = false;
  private _saveState: RngState | null = null;

  constructor(platform: PlatformType, group: CharacterGroup) {
    this._platformType = platform;
    this.group = group;
    this.initialize();
  }

  private initialize(): void {
    this.index = 0;
    this._foundFirstRngPosition = false;
    this.group.resetIndex();
    this._searchBuff = new CircularBuffer<number>(SEARCH_BUFFER_SIZE);
    this.healVals = [];
    this._searchRng = this.initializeRng();
    this._searchRng.sgenrand();
    this._searchBuff.add(this._searchRng.genrand());
  }

  reinitialize(): void {
    this.initialize();
  }

  protected initializeRng(): IRNG {
    return this._platformType === PlatformType.Ps2 ? new RNG1998() : new RNG2002();
  }

  protected getLoopStartIndex(): number {
    return this.index - this.healVals.length + 1;
  }

  protected checkForCombo(firstRngValTemp: number): void {
    const comboCheck = this.loopIndex - this.healVals.length + 1 - INDEX_OF_PREVIOUS_COMBO_RNG;
    if (comboCheck % RNG_CONSUMED_FOR_ATTACK === 0 && comboCheck >= 0) {
      if (!this.comboFound && isComboSuccessful(firstRngValTemp)) {
        this.comboFound = true;
        this.comboPosition = comboCheck / RNG_CONSUMED_FOR_ATTACK;
      }
    }
  }

  protected abstract calculateRngHelper(): void;

  // Fatty interface — subclasses override the one that's appropriate
  getChestFutureRng(): ChestFutureRng {
    throw new Error('Extending class must implement getChestFutureRng()');
  }
  getStealFutureRng(): StealFutureRng {
    throw new Error('Extending class must implement getStealFutureRng()');
  }
  getSpawnFutureRng(): SpawnFutureRng {
    throw new Error('Extending class must implement getSpawnFutureRng()');
  }

  getAttacksUntilNextCombo(): number { return this.attacksBeforeNextCombo; }
  getNextExpectedHealValue(): number { return this.nextHealValue; }

  findFirstRngPosition(firstHealValue: number): boolean {
    this.initialize();
    this._foundFirstRngPosition = this.findRngPositionHelper(firstHealValue);
    return this._foundFirstRngPosition;
  }

  findNextRngPosition(nextHealValue: number): boolean {
    if (!this._foundFirstRngPosition) return false;
    this.saveState();
    this.group.incrementIndex();
    const found = this.findRngPositionHelper(nextHealValue);
    if (!found) this.restoreState();
    return found;
  }

  consumeNextNRngPositions(n: number): boolean {
    if (!this._foundFirstRngPosition) return false;
    for (let pos = 1; pos <= n; pos++) {
      this.findRngPositionHelper(this.getNextExpectedHealValue());
      if (pos !== n) this.calculateRng(1);
    }
    return true;
  }

  calculateRng(rowsToRender: number): void {
    this.displayRng = this.initializeRng();
    const start = this.getLoopStartIndex();
    for (let burn = 0; burn < start; burn++) {
      this.displayRng.genrand();
    }
    this.setFutureRngPositionsToCalculate(rowsToRender);
    this.calculateRngHelper();
  }

  private findRngPositionHelper(healValue: number): boolean {
    if (!this.group.validateHealValue(healValue)) return false;

    const indexStatic = this.group.getIndex();
    this.healVals.push(healValue);
    this.index++;
    this._searchBuff.add(this._searchRng.genrand());

    let match = false;
    const startTime = performance.now();

    while (!match) {
      if (
        performance.now() - startTime > FIND_NEXT_TIMEOUT_MS ||
        this.index > MAX_SEARCH_INDEX
      ) {
        this.group.setIndex(indexStatic);
        return false;
      }

      this.group.resetIndex();
      const index0 = this.index - this.healVals.length + 1;
      match = true;
      for (let i = 0; i < this.healVals.length; i++) {
        if (this.group.getHealValue(this._searchBuff.get(index0 + i)) !== this.healVals[i]) {
          match = false;
          break;
        }
      }

      if (!match) {
        this._searchBuff.add(this._searchRng.genrand());
        this.index++;
      }
    }

    this.group.setIndex(indexStatic);
    return true;
  }

  private setFutureRngPositionsToCalculate(n: number): void {
    const MIN = 30, MAX = 10_000;
    this.futureRngPositionsToCalculate = Math.min(MAX, Math.max(MIN, n));
  }

  private saveState(): void {
    this._saveState = {
      groupIndex: this.group.getIndex(),
      index: this.index,
      healVals: [...this.healVals],
      searchBuff: this._searchBuff.deepClone(),
      searchRng: this._searchRng.deepClone(),
    };
  }

  private restoreState(): void {
    if (!this._saveState) return;
    this.group.setIndex(this._saveState.groupIndex);
    this.index = this._saveState.index;
    this.healVals = [...this._saveState.healVals];
    this._searchBuff = this._saveState.searchBuff.deepClone();
    this._searchRng = this._saveState.searchRng.deepClone();
  }
}
