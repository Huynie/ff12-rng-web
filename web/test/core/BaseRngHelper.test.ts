import { describe, it, expect } from 'vitest';
import { PlatformType } from '../../src/core/types';
import { BaseRngHelper } from '../../src/core/BaseRngHelper';
import { CharacterGroup } from '../../src/core/CharacterGroup';
import { getSimpleCharacterGroup, getComplexCharacterGroup } from './testUtils';

// Concrete subclass for testing abstract BaseRngHelper
class MockRngHelper extends BaseRngHelper {
  constructor(platform: PlatformType, group: CharacterGroup) {
    super(platform, group);
  }
  protected calculateRngHelper(): void { /* no-op */ }
}

function getHelper(group = getSimpleCharacterGroup()): MockRngHelper {
  return new MockRngHelper(PlatformType.Ps2, group);
}

describe('BaseRngHelper — fatty interface throws', () => {
  it('getChestFutureRng throws', () => {
    expect(() => getHelper().getChestFutureRng()).toThrow();
  });
});

describe('BaseRngHelper — FindFirstRngPosition', () => {
  it('succeeds for valid heal values', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(86)).toBe(true);
    expect(rng.findFirstRngPosition(88)).toBe(true);
    expect(rng.findFirstRngPosition(90)).toBe(true);
    expect(rng.findFirstRngPosition(92)).toBe(true);
    expect(rng.findFirstRngPosition(95)).toBe(true);
    expect(rng.findFirstRngPosition(97)).toBe(true);
  });

  it('fails for invalid heal values', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(10)).toBe(false);
    expect(rng.findFirstRngPosition(85)).toBe(false);
    expect(rng.findFirstRngPosition(98)).toBe(false);
    expect(rng.findFirstRngPosition(500)).toBe(false);
  });
});

describe('BaseRngHelper — FindNextRngPosition before first found', () => {
  it('returns false if first not found yet', () => {
    const rng = getHelper();
    expect(rng.findNextRngPosition(88)).toBe(false);
    expect(rng.findNextRngPosition(95)).toBe(false);
  });
});

describe('BaseRngHelper — ConsumeNextNRngPositions before first found', () => {
  it('returns false', () => {
    const rng = getHelper();
    expect(rng.consumeNextNRngPositions(10)).toBe(false);
  });
});

describe('BaseRngHelper — FindNextRngPosition basic sequence', () => {
  it('follows known heal sequence from C# tests', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(91)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
  });
});

describe('BaseRngHelper — FindNextRngPosition extended sequence', () => {
  it('succeeds for long known sequence and fails on wrong value', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(89)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
    expect(rng.findNextRngPosition(93)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(96)).toBe(true);
    expect(rng.findNextRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(97)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(false); // wrong value
  });
});

describe('BaseRngHelper — can continue after failed FindNext', () => {
  it('restores state on failure and continues', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(89)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
    expect(rng.findNextRngPosition(100)).toBe(false); // fail
    expect(rng.findNextRngPosition(93)).toBe(true);   // continue from saved state
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(96)).toBe(true);
    expect(rng.findNextRngPosition(85)).toBe(false);  // fail
    expect(rng.findNextRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(97)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(false);
    expect(rng.findNextRngPosition(97)).toBe(true);
  });
});

describe('BaseRngHelper — multi-character group', () => {
  it('follows known sequence with complex group', () => {
    const rng = getHelper(getComplexCharacterGroup());
    expect(rng.findFirstRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(142)).toBe(true);
    expect(rng.findNextRngPosition(215)).toBe(true);
    expect(rng.findNextRngPosition(91)).toBe(true);
    expect(rng.findNextRngPosition(139)).toBe(true);
    expect(rng.findNextRngPosition(203)).toBe(true);
    expect(rng.findNextRngPosition(94)).toBe(true);
    expect(rng.findNextRngPosition(140)).toBe(true);
    expect(rng.findNextRngPosition(219)).toBe(true);
    expect(rng.findNextRngPosition(88)).toBe(true);
    expect(rng.findNextRngPosition(141)).toBe(true);
    expect(rng.findNextRngPosition(90)).toBe(false);
    expect(rng.findNextRngPosition(205)).toBe(false);
  });
});

describe('BaseRngHelper — reinitialize', () => {
  it('resets state so FindNext fails', () => {
    const rng = getHelper();
    expect(rng.findFirstRngPosition(92)).toBe(true);
    expect(rng.findNextRngPosition(95)).toBe(true);
    rng.reinitialize();
    expect(rng.findNextRngPosition(88)).toBe(false);
  });
});
