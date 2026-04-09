import { Character } from './Character';

export class CharacterGroup {
  private _characters: Character[] = [];
  private _charIndex = 0;

  clearCharacters(): void {
    this._characters = [];
  }

  characterCount(): number {
    return this._characters.length;
  }

  addCharacter(character: Character): void {
    this._characters.push(character);
  }

  resetIndex(): void {
    this._charIndex = 0;
  }

  getIndex(): number {
    return this._charIndex;
  }

  setIndex(i: number): void {
    if (i >= this._characters.length) throw new RangeError('Index out of range');
    this._charIndex = i;
  }

  incrementIndex(): void {
    this._charIndex = (this._charIndex + 1) % this.characterCount();
  }

  /** Cast the next spell — advances the index. */
  getHealValue(rngValue: number): number {
    const healValue = this._characters[this._charIndex].getHealValue(rngValue);
    this.incrementIndex();
    return healValue;
  }

  /** Peek at the next heal value without advancing the index. */
  peekHealValue(rngValue: number): number {
    return this._characters[this._charIndex].getHealValue(rngValue);
  }

  healMax(): number {
    return this._characters[this._charIndex].healMax();
  }

  healMin(): number {
    return this._characters[this._charIndex].healMin();
  }

  validateHealValue(value: number): boolean {
    return value <= this.healMax() && value >= this.healMin();
  }
}
