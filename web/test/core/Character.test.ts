import { describe, it, expect } from 'vitest';
import { Character } from '../../src/core/Character';
import { Spells } from '../../src/core/types';

describe('Character (Cure, no serenity)', () => {
  const c = new Character(3, 23, Spells.Cure, false);

  it('healMax', () => expect(c.healMax()).toBe(97));
  it('healMin', () => expect(c.healMin()).toBe(86));
  it('getHealValue(1372235862)', () => expect(c.getHealValue(1372235862)).toBe(91));
});

describe('Character (Cure, serenity)', () => {
  const c = new Character(3, 23, Spells.Cure, true);

  it('healMax', () => expect(c.healMax()).toBe(146));
  it('healMin', () => expect(c.healMin()).toBe(130));
  it('getHealValue(1372235862)', () => expect(c.getHealValue(1372235862)).toBe(137));
});

describe('Character (Cura, no serenity)', () => {
  const c = new Character(3, 23, Spells.Cura, false);

  it('healMax', () => expect(c.healMax()).toBe(219));
  it('healMin', () => expect(c.healMin()).toBe(195));
  it('getHealValue(1372235862)', () => expect(c.getHealValue(1372235862)).toBe(215));
});

describe('Character (Cura, serenity)', () => {
  const c = new Character(3, 23, Spells.Cura, true);

  it('healMax', () => expect(c.healMax()).toBe(329));
  it('healMin', () => expect(c.healMin()).toBe(292));
  it('getHealValue(1372235862)', () => expect(c.getHealValue(1372235862)).toBe(322));
});
