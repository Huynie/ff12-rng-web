import { describe, it, expect } from 'vitest';
import { RNG2002 } from '../../src/core/RNG2002';

describe('RNG2002', () => {
  it('produces values in uint32 range', () => {
    const rng = new RNG2002();
    for (let i = 0; i < 1000; i++) {
      const v = rng.genrand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('two instances with same seed produce identical sequences', () => {
    const a = new RNG2002(4537);
    const b = new RNG2002(4537);
    for (let i = 0; i < 100; i++) {
      expect(a.genrand()).toBe(b.genrand());
    }
  });

  it('PS2 and PS4 produce different sequences from same seed', async () => {
    const { RNG1998 } = await import('../../src/core/RNG1998');
    const rng98 = new RNG1998(4537);
    const rng02 = new RNG2002(4537);
    let different = false;
    for (let i = 0; i < 100; i++) {
      if (rng98.genrand() !== rng02.genrand()) { different = true; break; }
    }
    expect(different).toBe(true);
  });

  it('saveState and loadState restores sequence exactly', () => {
    const rng = new RNG2002();
    for (let i = 0; i < 50; i++) rng.genrand();
    const state = rng.saveState();

    const expected: number[] = [];
    for (let i = 0; i < 20; i++) expected.push(rng.genrand());

    rng.loadState(state);
    for (let i = 0; i < 20; i++) {
      expect(rng.genrand()).toBe(expected[i]);
    }
  });

  it('deepClone produces independent copy with same sequence', () => {
    const rng = new RNG2002();
    for (let i = 0; i < 30; i++) rng.genrand();
    const clone = rng.deepClone();
    for (let i = 0; i < 20; i++) {
      expect(clone.genrand()).toBe(rng.genrand());
    }
  });

  it('getPosition increments with each genrand call', () => {
    const rng = new RNG2002();
    expect(rng.getPosition()).toBe(0);
    rng.genrand();
    expect(rng.getPosition()).toBe(1);
  });
});
