import { Character } from '../../src/core/Character';
import { CharacterGroup } from '../../src/core/CharacterGroup';
import { Chest } from '../../src/core/Chest';
import { Monster } from '../../src/core/Monster';
import { Spells } from '../../src/core/types';

export function getDefaultCharacter(): Character {
  return new Character(3, 23, Spells.Cure, false);
}

export function getDefaultCharacterGroup(): CharacterGroup {
  const g = new CharacterGroup();
  g.addCharacter(getDefaultCharacter());
  g.addCharacter(getDefaultCharacter());
  g.addCharacter(getDefaultCharacter());
  return g;
}

export function getComplexCharacterGroup(): CharacterGroup {
  const g = new CharacterGroup();
  g.addCharacter(getDefaultCharacter());
  g.addCharacter(new Character(3, 23, Spells.Cure, true));
  g.addCharacter(new Character(3, 23, Spells.Cura, false));
  return g;
}

export function getSimpleCharacterGroup(): CharacterGroup {
  const g = new CharacterGroup();
  g.addCharacter(getDefaultCharacter());
  return g;
}

export function getDefaultChest(): Chest {
  return new Chest(50, 5, 50, 50, 100, false);
}

export function getDefaultMonster(): Monster {
  return new Monster(1, 20, 1);
}
