import { Spells } from './types';

const SPELL_POWER: Record<Spells, number> = {
  [Spells.Cure]:          20,
  [Spells.Cura]:          45,
  [Spells.Curaga]:        85,
  [Spells.Curaja]:       145,
  [Spells.CuraIzjsTza]:   46,
  [Spells.CuragaIzjsTza]: 86,
  [Spells.CurajaIzjsTza]:120,
};

export const SPELL_NAMES: Record<Spells, string> = {
  [Spells.Cure]:          'Cure',
  [Spells.Cura]:          'Cura',
  [Spells.Curaga]:        'Curaga',
  [Spells.Curaja]:        'Curaja',
  [Spells.CuraIzjsTza]:   'Cura IZJS/TZA',
  [Spells.CuragaIzjsTza]: 'Curaga IZJS/TZA',
  [Spells.CurajaIzjsTza]: 'Curaja IZJS/TZA',
};

export class Spell {
  private readonly _spell: Spells;
  private readonly _power: number;

  constructor(spell: Spells) {
    this._spell = spell;
    this._power = SPELL_POWER[spell];
  }

  getSpellPower(): number {
    return this._power;
  }

  getName(): string {
    return SPELL_NAMES[this._spell];
  }
}
