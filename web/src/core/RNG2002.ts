// Port of MT19937: Integer version (2002/1/26) — used by FF12 PS4 (Zodiac Age)
// CRITICAL: All multiplication uses Math.imul() and >>> 0 to emulate uint32 overflow.

import type { IRNG, RNGState } from './types';

const DEFAULT_SEED = 4537;
const N = 624;
const M = 397;
const MATRIX_A   = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;
const mag01 = new Uint32Array([0x0, MATRIX_A]);

export class RNG2002 implements IRNG {
  private mt = new Uint32Array(N);
  private mti = N + 1;
  private position = 0;

  constructor(seed = DEFAULT_SEED) {
    this.sgenrand(seed);
  }

  sgenrand(seed = DEFAULT_SEED): void {
    this.mt[0] = seed >>> 0;
    for (this.mti = 1; this.mti < N; this.mti++) {
      // C#: mt[mti] = (1812433253U * (mt[mti-1] ^ (mt[mti-1] >> 30)) + mti) & 0xffffffff
      const prev = this.mt[this.mti - 1];
      this.mt[this.mti] = (Math.imul(1812433253, (prev ^ (prev >>> 30)) >>> 0) + this.mti) >>> 0;
    }
    this.position = 0;
  }

  genrand(): number {
    let y: number;

    if (this.mti >= N) {
      if (this.mti === N + 1) this.sgenrand(DEFAULT_SEED);

      let kk: number;
      for (kk = 0; kk < N - M; kk++) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < N - 1; kk++) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
      this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

      this.mti = 0;
    }

    y = this.mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    this.position++;
    return y >>> 0;
  }

  saveState(): RNGState {
    return {
      mti: this.mti,
      mt: this.mt.slice(),
      position: this.position,
    };
  }

  loadState(state: RNGState): void {
    this.mti = state.mti;
    this.mt.set(state.mt);
    this.position = state.position;
  }

  deepClone(): IRNG {
    const clone = new RNG2002();
    clone.loadState(this.saveState());
    return clone;
  }

  getPosition(): number {
    return this.position;
  }
}
