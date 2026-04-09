import { Spells } from './types';
import { Spell } from './Spell';

const MAX_BONUS_MULTIPLIER = 0.125;
const MIN_BONUS_MULTIPLIER = 0;
const NO_SERENITY_BOOST = 1.0;
const SERENITY_BOOST = 1.5;

export class Character {
  private readonly _level: number;
  private readonly _magic: number;
  private readonly _spellPower: number;
  private readonly _serenityMult: number;

  constructor(level: number, magic: number, spell: Spells, serenity: boolean) {
    this._level = level;
    this._magic = magic;
    this._spellPower = new Spell(spell).getSpellPower();
    this._serenityMult = serenity ? SERENITY_BOOST : NO_SERENITY_BOOST;
  }

  getHealValue(rngValue: number): number {
    // rngValue is uint32 (0 to 2^32-1), fits exactly in JS double
    const bonusSpellPower = (rngValue % Math.floor(this._spellPower * 12.5)) / 100.0;
    return this.calculateHeal(bonusSpellPower);
  }

  healMax(): number {
    return this.calculateHeal(MAX_BONUS_MULTIPLIER * this._spellPower);
  }

  healMin(): number {
    return this.calculateHeal(MIN_BONUS_MULTIPLIER);
  }

  private calculateHeal(bonusSpellPower: number): number {
    const totalSpellPower = this._spellPower + bonusSpellPower;
    const regularDamage = totalSpellPower * (2.0 + this._magic * (this._level + this._magic) / 256.0);
    const finalDamage = regularDamage * this._serenityMult;
    return Math.trunc(finalDamage); // C# (int) cast truncates toward zero
  }
}
