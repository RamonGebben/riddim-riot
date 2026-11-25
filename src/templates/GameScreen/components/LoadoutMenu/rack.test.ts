import { describe, expect, it } from 'vitest';
import type { WeaponFace } from '~/molecules/WeaponTag';
import {
  changed,
  choiceOf,
  discardAll,
  enginesIn,
  filterBag,
  keepBest,
  likelySlot,
  placeOf,
  rackOf,
  sortBag,
  swap,
  toggleDiscard,
  weakerInBag,
  type Judged,
  type Rack,
} from './rack';

const rack: Rack = rackOf({ slots: ['s1', 's2', 's3'], bag: ['b1', 'b2'] });

describe('placeOf', () => {
  it('finds a weapon in a slot or the bag', () => {
    expect(placeOf(rack, 's2')).toEqual({ in: 'slots', index: 1 });
    expect(placeOf(rack, 'b2')).toEqual({ in: 'bag', index: 1 });
    expect(placeOf(rack, 'nope')).toBeNull();
  });
});

describe('swap', () => {
  it('trades a bag weapon for a slot, either way round', () => {
    const swapped = {
      slots: ['s1', 'b2', 's3'],
      bag: ['b1', 's2'],
      discarded: [],
    };
    expect(swap(rack, 'b2', 's2')).toEqual(swapped);
    expect(swap(rack, 's2', 'b2')).toEqual(swapped);
  });

  it('reorders two slots', () => {
    expect(swap(rack, 's1', 's3')?.slots).toEqual(['s3', 's2', 's1']);
  });

  it("doesn't swap within the bag, or a weapon with itself", () => {
    expect(swap(rack, 'b1', 'b2')).toBeNull();
    expect(swap(rack, 's1', 's1')).toBeNull();
  });
});

describe('toggleDiscard', () => {
  it('marks a bag weapon to throw away, and keeps it again', () => {
    const marked = toggleDiscard(rack, 'b1');
    expect(choiceOf(marked).bag).toEqual(['b2']);
    expect(swap(marked, 'b1', 's1')).toBeNull();
    expect(choiceOf(toggleDiscard(marked, 'b1')).bag).toEqual(['b1', 'b2']);
  });

  it('never throws away an equipped weapon', () => {
    expect(toggleDiscard(rack, 's1')).toBe(rack);
  });
});

describe('weakerInBag', () => {
  const judged = (
    oscillator: WeaponFace['oscillator'],
    perBar: number,
  ): Judged => ({
    name: '',
    oscillator,
    lfo: '1/8',
    fx: null,
    blasts: false,
    stats: { perBar, hit: 1, shots: 8, reach: 8, area: 0 },
  });
  const faces = new Map([
    ['s1', judged('wobble', 80)],
    ['s2', judged('laser', 60)],
    ['s3', judged('beam', 50)],
    ['b1', judged('laser', 40)],
    ['b2', judged('wobble', 90)],
  ]);

  it('finds bag weapons clearly weaker than their likely slot', () => {
    expect(weakerInBag(rack, faces)).toEqual(['b1']);
  });

  it('marks them all at once, reversibly', () => {
    const marked = discardAll(rack, weakerInBag(rack, faces));
    expect(choiceOf(marked).bag).toEqual(['b2']);
    expect(weakerInBag(marked, faces)).toEqual([]);
    expect(choiceOf(toggleDiscard(marked, 'b1')).bag).toEqual(['b1', 'b2']);
  });
});

describe('keepBest', () => {
  const judged = (
    oscillator: WeaponFace['oscillator'],
    perBar: number,
    tier = 1,
  ): Judged => ({
    name: '',
    oscillator,
    lfo: '1/8',
    fx: null,
    blasts: false,
    tier,
    stats: { perBar, hit: 1, shots: 8, reach: 8, area: 0 },
  });
  const big = rackOf({
    slots: ['s1', 's2', 's3'],
    bag: ['b1', 'b2', 'b3', 'b4'],
  });
  const faces = new Map([
    ['s1', judged('wobble', 80)],
    ['s2', judged('laser', 60)],
    ['s3', judged('beam', 50)],
    ['b1', judged('wobble', 120)],
    ['b2', judged('wobble', 100)],
    ['b3', judged('beam', 50, 3)],
    ['b4', judged('laser', 200)],
  ]);

  it("puts each slot's strongest of its own engine in it", () => {
    const best = keepBest(big, faces);
    expect(best.slots).toEqual(['b1', 'b4', 'b3']);
    // What the slots held goes back to the bag, nothing lost.
    expect(best.bag.toSorted()).toEqual(['b2', 's1', 's2', 's3']);
  });

  it('breaks a tie in damage on the higher tier', () => {
    expect(keepBest(big, faces).slots[2]).toBe('b3');
  });

  it('leaves weapons marked to discard where they are', () => {
    const marked = discardAll(big, ['b1', 'b4']);
    expect(keepBest(marked, faces).slots).toEqual(['b2', 's2', 'b3']);
  });

  it('changes nothing when the slots already hold the best', () => {
    const done = keepBest(big, faces);
    expect(keepBest(done, faces)).toEqual(done);
  });
});

describe('changed', () => {
  const from = choiceOf(rack);

  it('spots a swap or a discard, and nothing else', () => {
    expect(changed(rack, from)).toBe(false);
    expect(changed(swap(rack, 's1', 's2') ?? rack, from)).toBe(true);
    expect(changed(toggleDiscard(rack, 'b1'), from)).toBe(true);
  });
});

describe('likelySlot', () => {
  const face = (oscillator: WeaponFace['oscillator']): WeaponFace => ({
    name: '',
    oscillator,
    lfo: '1/8',
    fx: null,
    blasts: false,
  });
  const faces = new Map([
    ['s1', face('wobble')],
    ['s2', face('laser')],
    ['s3', face('beam')],
    ['b1', face('beam')],
  ]);

  it('compares with the slot of the same engine, else the first', () => {
    expect(likelySlot(rack, faces, 'b1')).toBe(2);
    expect(likelySlot(rack, new Map([['b2', face('laser')]]), 'b2')).toBe(0);
  });
});

describe('sortBag', () => {
  const face = (
    oscillator: WeaponFace['oscillator'],
    lfo: WeaponFace['lfo'],
    perBar: number,
  ): Judged => ({
    name: '',
    oscillator,
    lfo,
    fx: null,
    blasts: false,
    stats: { perBar, hit: 1, shots: 8, reach: 8, area: 0 },
  });
  const faces = new Map([
    ['a', face('beam', '1/8', 70)],
    ['b', face('wobble', '1/16', 40)],
    ['c', face('laser', '1/2', 90)],
    ['d', face('wobble', '1/4', 60)],
  ]);
  const bag = ['a', 'b', 'c', 'd'];

  it('lists the newest first', () => {
    expect(sortBag(bag, faces, 'newest')).toEqual(['d', 'c', 'b', 'a']);
  });

  it('puts the most damage a bar first', () => {
    expect(sortBag(bag, faces, 'best')).toEqual(['c', 'a', 'd', 'b']);
  });
});

describe('filterBag', () => {
  const faces = new Map<string, WeaponFace>(
    (
      [
        ['a', 'beam'],
        ['b', 'wobble'],
        ['c', 'laser'],
        ['d', 'wobble'],
      ] as const
    ).map(([id, oscillator]) => [
      id,
      { name: '', oscillator, lfo: '1/8', fx: null, blasts: false },
    ]),
  );
  const bag = ['a', 'b', 'c', 'd'];

  it('keeps one engine, in the order it was given', () => {
    expect(filterBag(bag, faces, 'wobble')).toEqual(['b', 'd']);
  });

  it('keeps everything for all', () => {
    expect(filterBag(bag, faces, 'all')).toBe(bag);
  });

  it('counts each engine, empty ones included', () => {
    expect(enginesIn(['b', 'c', 'd'], faces)).toEqual([
      { engine: 'wobble', count: 2 },
      { engine: 'laser', count: 1 },
      { engine: 'beam', count: 0 },
    ]);
  });
});
