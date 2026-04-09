import { describe, it, expect } from 'vitest';
import { CircularBuffer } from '../../src/core/CircularBuffer';

describe('CircularBuffer', () => {
  it('stores and retrieves values', () => {
    const buf = new CircularBuffer<number>(5);
    buf.add(10);
    buf.add(20);
    buf.add(30);
    expect(buf.get(0)).toBe(10);
    expect(buf.get(1)).toBe(20);
    expect(buf.get(2)).toBe(30);
  });

  it('wraps around when full', () => {
    const buf = new CircularBuffer<number>(3);
    buf.add(1);
    buf.add(2);
    buf.add(3);
    buf.add(4); // overwrites index 0
    expect(buf.get(3)).toBe(4);
  });

  it('handles negative index by wrapping correctly', () => {
    const buf = new CircularBuffer<number>(5);
    // Fill all 5 slots so no undefined
    for (let i = 0; i < 5; i++) buf.add(i * 10);
    // Index -1 should map to the same slot as index 4 (last item before wrap)
    expect(buf.get(-1)).toBe(buf.get(4));
  });

  it('deepClone is independent', () => {
    const buf = new CircularBuffer<number>(4);
    buf.add(1);
    buf.add(2);
    const clone = buf.deepClone();
    buf.add(99);
    // clone should not see the new value at index 2
    expect(clone.get(2)).not.toBe(99);
  });

  it('deepClone has same values as original', () => {
    const buf = new CircularBuffer<number>(4);
    buf.add(10);
    buf.add(20);
    const clone = buf.deepClone();
    expect(clone.get(0)).toBe(10);
    expect(clone.get(1)).toBe(20);
  });
});
