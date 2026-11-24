import type { WeaponFace } from '~/molecules/WeaponTag';
import { verdictOf, type WeaponStats } from './verdict';

/** A weapon as the rack judges it: what it is, and its numbers. */
export type Judged = WeaponFace & { stats: WeaponStats };

/** The menu's working copy: weapon ids in the slots, and in the bag. */
export interface Rack {
  slots: Array<string>;
  /** Oldest first, as the run picked them up. */
  bag: Array<string>;
  /** Bag weapons marked to throw away: gone on Done, back on a tap. */
  discarded: Array<string>;
}

/** What the menu closes on: the slots, and the bag that's kept. */
export interface Choice {
  slots: Array<string>;
  bag: Array<string>;
}

export const rackOf = ({ slots, bag }: Choice): Rack => ({
  slots,
  bag,
  discarded: [],
});

export const choiceOf = ({ slots, bag, discarded }: Rack): Choice => ({
  slots,
  bag: bag.filter(id => !discarded.includes(id)),
});

export type Place = { in: 'slots' | 'bag'; index: number };

export const placeOf = (rack: Rack, id: string): Place | null => {
  const slot = rack.slots.indexOf(id);
  if (slot >= 0) return { in: 'slots', index: slot };
  const bagged = rack.bag.indexOf(id);
  return bagged >= 0 ? { in: 'bag', index: bagged } : null;
};

const put = (rack: Rack, { in: where, index }: Place, id: string): Rack => ({
  ...rack,
  [where]: rack[where].map((current, i) => (i === index ? id : current)),
});

/**
 * Two picks trade places: a bag weapon and a slot's, or two slots. Two
 * bag weapons don't - the bag has no order worth keeping - so that's null,
 * and so is a weapon marked to throw away.
 */
export const swap = (rack: Rack, a: string, b: string): Rack | null => {
  const from = placeOf(rack, a);
  const to = placeOf(rack, b);
  if (!from || !to || a === b) return null;
  if (from.in === 'bag' && to.in === 'bag') return null;
  if (rack.discarded.includes(a) || rack.discarded.includes(b)) return null;
  return put(put(rack, from, b), to, a);
};

/**
 * Bag weapons clearly weaker than the slot each would most likely replace,
 * not yet marked: what "Discard weaker" throws away.
 */
export const weakerInBag = (
  rack: Rack,
  faces: ReadonlyMap<string, Judged>,
): Array<string> =>
  rack.bag.filter(id => {
    const face = faces.get(id);
    const held = faces.get(rack.slots[likelySlot(rack, faces, id)]);
    return (
      face &&
      held &&
      !rack.discarded.includes(id) &&
      verdictOf(face.stats, held.stats) === 'weaker'
    );
  });

/** Mark several bag weapons to throw away at once; each can be kept again. */
export const discardAll = (rack: Rack, ids: Array<string>): Rack => ({
  ...rack,
  discarded: [
    ...rack.discarded,
    ...ids.filter(id => placeOf(rack, id)?.in === 'bag'),
  ].filter((id, i, all) => all.indexOf(id) === i),
});

/** Mark a bag weapon to throw away, or keep it after all. */
export const toggleDiscard = (rack: Rack, id: string): Rack => {
  if (placeOf(rack, id)?.in !== 'bag') return rack;
  return {
    ...rack,
    discarded: rack.discarded.includes(id)
      ? rack.discarded.filter(other => other !== id)
      : [...rack.discarded, id],
  };
};

export const changed = (rack: Rack, from: Choice): boolean =>
  rack.discarded.length > 0 ||
  rack.slots.some((id, i) => id !== from.slots[i]) ||
  rack.bag.some((id, i) => id !== from.bag[i]);

/**
 * The slot a bag weapon would most likely replace: the one with the same
 * engine, else the first.
 */
export const likelySlot = (
  rack: Rack,
  faces: ReadonlyMap<string, WeaponFace>,
  picked: string,
): number => {
  const engine = faces.get(picked)?.oscillator;
  const same = rack.slots.findIndex(id => faces.get(id)?.oscillator === engine);
  return Math.max(same, 0);
};

export type BagOrder = 'newest' | 'best';

export type Engine = WeaponFace['oscillator'];

/** Which engines the bag is narrowed to: one, or all of them. */
export type EngineFilter = Engine | 'all';

const ENGINES: Array<Engine> = ['wobble', 'laser', 'beam'];

/**
 * The bag as the menu lists it: newest first, or the most damage a bar
 * first. Sorting only changes the view.
 */
export const sortBag = (
  bag: Array<string>,
  faces: ReadonlyMap<string, Judged>,
  order: BagOrder,
): Array<string> => {
  const newest = bag.toReversed();
  if (order === 'newest') return newest;
  const rank = (id: string) => -(faces.get(id)?.stats.perBar ?? 0);
  return newest.toSorted((a, b) => rank(a) - rank(b));
};

/** The bag's weapons of one engine, or all of them; the order is kept. */
export const filterBag = (
  bag: Array<string>,
  faces: ReadonlyMap<string, WeaponFace>,
  engine: EngineFilter,
): Array<string> =>
  engine === 'all'
    ? bag
    : bag.filter(id => faces.get(id)?.oscillator === engine);

/** How many of each engine the bag holds, in the rack's engine order. */
export const enginesIn = (
  bag: Array<string>,
  faces: ReadonlyMap<string, WeaponFace>,
): Array<{ engine: Engine; count: number }> =>
  ENGINES.map(engine => ({
    engine,
    count: filterBag(bag, faces, engine).length,
  }));
