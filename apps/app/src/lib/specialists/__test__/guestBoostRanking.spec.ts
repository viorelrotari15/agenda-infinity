import { describe, expect, it } from 'vitest';
import { applyGuestViewBoost } from '../guestBoostRanking';

describe('applyGuestViewBoost', () => {
  it('puts recently viewed ids first while preserving order within ties', () => {
    const items = [
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
      { id: 'c', n: 3 },
    ];
    const out = applyGuestViewBoost(items, ['c', 'a']);
    expect(out.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns original order when no history', () => {
    const items = [{ id: 'x' }, { id: 'y' }];
    expect(applyGuestViewBoost(items, [])).toEqual(items);
  });
});
