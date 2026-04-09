import { PlatformType, RewardType } from './types';
import { BaseRngHelper } from './BaseRngHelper';
import { CharacterGroup } from './CharacterGroup';
import { Chest } from './Chest';
import {
  ChestFutureRng,
  ChestFutureRngInstance,
  ChestReward,
  AdvanceDirections,
} from './ChestFutureRng';
import { randToPercent } from './Utils';

export class ChestRngHelper extends BaseRngHelper {
  private readonly _chests: Chest[];
  private _futureRng: ChestFutureRng;

  constructor(platform: PlatformType, group: CharacterGroup, chests: Chest[]) {
    super(platform, group);
    this._chests = chests;
    this._futureRng = new ChestFutureRng();
  }

  override getChestFutureRng(): ChestFutureRng {
    return this._futureRng;
  }

  protected override calculateRngHelper(): void {
    for (const chest of this._chests) chest.resetSpawnInfo();

    this._futureRng = new ChestFutureRng();
    this.comboFound = false;
    this.comboPosition = -1;

    let firstRngVal = this.displayRng.genrand();
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
      const secondRngValTemp = secondRngVal;
      firstRngVal = secondRngVal;
      secondRngVal = this.displayRng.genrand();

      if (this.loopIndex < this.healVals.length - 5) continue;

      const instance = new ChestFutureRngInstance(this._chests.length);
      if (index < start + this.healVals.length) instance.isPastRng = true;

      instance.index = index;
      instance.currentHeal = currentHeal;
      instance.randToPercent = randToPercent(firstRngValTemp);

      for (let i = 0; i < this._chests.length; i++) {
        const chest = this._chests[i];
        const reward = instance.chestRewards[i];
        if (chest.checkSpawn(firstRngValTemp)) {
          this.handleChestSpawn(chest, reward);
        }
      }

      for (let i = 0; i < this._chests.length; i++) {
        const chest = this._chests[i];
        const reward = instance.chestRewards[i];
        if (chest.checkIfGil(firstRngValTemp)) {
          this.handleGilReward(chest, reward, secondRngValTemp);
        } else {
          this.handleItemReward(chest, reward, secondRngValTemp);
        }
      }

      this.checkForCombo(firstRngValTemp);
      this._futureRng.addInstance(instance);
    }

    this.writeAdvanceDirections();
    this.attacksBeforeNextCombo = this.comboPosition;
    this.group.setIndex(indexStatic);
  }

  private writeAdvanceDirections(): void {
    for (const chest of this._chests) {
      const d = new AdvanceDirections();
      d.advanceToAppear = chest.getChestFoundPosition();
      d.advanceForItem  = chest.getChestItemPosition();
      this._futureRng.addAdvanceDirections(d);
    }
  }

  private handleChestSpawn(chest: Chest, reward: ChestReward): void {
    const chestFirstChance = this.healVals.length + chest.getRngPosition();
    reward.chestWillSpawn = true;
    if (this.loopIndex >= chestFirstChance && !chest.hasChestSpawned()) {
      chest.setChestFoundPosition(this.loopIndex - this.healVals.length - chest.getRngPosition());
      chest.setChestSpawned();
    }
  }

  private handleGilReward(chest: Chest, reward: ChestReward, prng: number): void {
    reward.reward = RewardType.Gil;
    reward.gilAmount = chest.getGilAmount(prng);
  }

  private handleItemReward(chest: Chest, reward: ChestReward, prng: number): void {
    if (chest.checkIfFirstItem(prng)) {
      this.handleItemRewardHelper(chest, reward, RewardType.Item1, true);
    } else {
      this.handleItemRewardHelper(chest, reward, RewardType.Item2, false);
    }
  }

  private handleItemRewardHelper(
    chest: Chest,
    reward: ChestReward,
    rewardType: RewardType,
    expectItemOne: boolean,
  ): void {
    reward.reward = rewardType;
    if (
      chest.wantItemOne() === expectItemOne &&
      this.loopIndex >= this.healVals.length &&
      !chest.isChestFound()
    ) {
      chest.setChestItemPosition(this.loopIndex - this.healVals.length);
      chest.setChestFound();
    }
  }
}
