// Interfaces and enums ported from FF12RNGHelper.Core

export enum PlatformType {
  Ps2 = 'Ps2',
  Ps4 = 'Ps4',
}

export enum Spells {
  Cure = 'Cure',
  Cura = 'Cura',
  Curaga = 'Curaga',
  Curaja = 'Curaja',
  CuraIzjsTza = 'CuraIzjsTza',
  CuragaIzjsTza = 'CuragaIzjsTza',
  CurajaIzjsTza = 'CurajaIzjsTza',
}

export enum RewardType {
  Gil = 'Gil',
  Item1 = 'Item1',
  Item2 = 'Item2',
}

export enum StealType {
  Rare = 'Rare',
  Uncommon = 'Uncommon',
  Common = 'Common',
  None = 'None',
}

export interface RNGState {
  mti: number;
  mt: Uint32Array;
  position: number;
}

export interface IRNG {
  sgenrand(seed?: number): void;
  genrand(): number;
  saveState(): RNGState;
  loadState(state: RNGState): void;
  deepClone(): IRNG;
  getPosition(): number;
}
