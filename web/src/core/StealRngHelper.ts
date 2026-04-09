import { PlatformType } from './types';
import { BaseRngHelper } from './BaseRngHelper';
import { CharacterGroup } from './CharacterGroup';
import { checkSteal, checkStealCuffs, wouldRareStealSucceed } from './Steal';
import {
  StealFutureRng,
  StealFutureRngInstance,
  StealDirections,
} from './StealFutureRng';
import { randToPercent } from './Utils';

export class StealRngHelper extends BaseRngHelper {
  private _futureRng: StealFutureRng;

  constructor(platform: PlatformType, group: CharacterGroup) {
    super(platform, group);
    this._futureRng = new StealFutureRng();
  }

  override getStealFutureRng(): StealFutureRng {
    return this._futureRng;
  }

  protected override calculateRngHelper(): void {
    let rarePosition = -1;
    let rarePositionCuffs = -1;
    let rareSteal = false;
    let rareStealCuffs = false;

    this._futureRng = new StealFutureRng();
    this.comboFound = false;
    this.comboPosition = -1;

    let firstRngVal  = this.displayRng.genrand();
    let secondRngVal = this.displayRng.genrand();
    let thirdRngVal  = this.displayRng.genrand();

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

      const firstRngValTemp  = firstRngVal;
      const secondRngValTemp = secondRngVal;
      const thirdRngValTemp  = thirdRngVal;
      firstRngVal  = secondRngVal;
      secondRngVal = thirdRngVal;
      thirdRngVal  = this.displayRng.genrand();

      if (this.loopIndex < this.healVals.length - 5) continue;

      const instance = new StealFutureRngInstance();
      if (index < start + this.healVals.length) instance.isPastRng = true;

      instance.index = index;
      instance.currentHeal = currentHeal;
      instance.randToPercent = randToPercent(firstRngValTemp);
      instance.lv99RedChocobo = firstRngValTemp < 0x1000000;
      instance.normalReward = checkSteal(firstRngValTemp, secondRngValTemp, thirdRngValTemp);
      instance.cuffsReward  = checkStealCuffs(firstRngValTemp, secondRngValTemp, thirdRngValTemp);

      if (wouldRareStealSucceed(firstRngValTemp, false) && !rareSteal && this.loopIndex >= this.healVals.length) {
        rareSteal = true;
        rarePosition = this.loopIndex - this.healVals.length;
      }
      if (wouldRareStealSucceed(firstRngValTemp, true) && !rareStealCuffs && this.loopIndex >= this.healVals.length) {
        rareStealCuffs = true;
        rarePositionCuffs = this.loopIndex - this.healVals.length;
      }

      this.checkForCombo(firstRngValTemp);
      this._futureRng.addInstance(instance);
    }

    const d = new StealDirections();
    d.advanceForRare      = rarePosition;
    d.advanceForRareCuffs = rarePositionCuffs;
    this._futureRng.setStealDirections(d);

    this.attacksBeforeNextCombo = this.comboPosition;
    this.group.setIndex(indexStatic);
  }
}
