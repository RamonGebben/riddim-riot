/**
 * How hard a level plays and how good its loot is, from one number: its
 * tier. A level's tier is its place in the run, so level 3 is tier 3.
 * Every number here is gameplay, not sound: a weapon sounds the same at
 * any tier.
 */

/** The highest tier: the run's last level. */
export const MAX_TIER = 5;

const clamp = (tier: number) =>
  Math.min(Math.max(Math.round(tier), 1), MAX_TIER);

/** The tier a level plays at. */
export const tierOf = (level: number): number => clamp(level);

/**
 * The tier a weapon plays at on `level`: its own, but never past the
 * level's. A kept tier-5 weapon starts a fresh run as tier 1 and grows
 * into its full power level by level, so a returning player's loadout
 * can't make the first levels easy.
 */
export const playsAt = (weaponTier: number, level: number): number =>
  Math.min(clamp(weaponTier), tierOf(level));

/** Per tier above the first. */
const WEAPON_STEP = {
  /** Only the boss lives past one hit, so damage is what beats it. */
  damage: 0.25,
  reach: 0.05,
  blast: 0.08,
};

/** What a weapon's stats are multiplied by when it plays at `tier`. */
export const weaponScale = (tier: number) => {
  const above = clamp(tier) - 1;
  return {
    damage: 1 + WEAPON_STEP.damage * above,
    reach: 1 + WEAPON_STEP.reach * above,
    blast: 1 + WEAPON_STEP.blast * above,
  };
};

/** Loot of a higher tier rolls an FX more often. */
const FX_CHANCE_STEP = 0.08;

/** The chance a weapon of `tier` rolls an FX, from tier 1's `base`. */
export const fxChance = (base: number, tier: number): number =>
  Math.min(base + FX_CHANCE_STEP * (clamp(tier) - 1), 0.95);

/** The tier loot drops at on `level`; a boss drops one better. */
export const lootTier = (level: number, { boss = false } = {}): number =>
  clamp(tierOf(level) + (boss ? 1 : 0));

/**
 * The boss's health grows past what the level alone would give, a share
 * of what a weapon of its tier gains: weapons that keep up with the
 * levels beat it faster than before, ones that don't take longer.
 */
const BOSS_HP_STEP = 0.15;

export const bossHpScale = (level: number): number =>
  1 + BOSS_HP_STEP * (tierOf(level) - 1);

/** Waves come this much more often per tier above the first. */
const PACE_STEP = 0.15;

/**
 * How many bars apart a part's waves come at `level`: `everyBars` at tier
 * 1, sooner further on, never closer than every 2 bars (or what the part
 * already sends, if that's closer).
 */
export const waveEvery = (everyBars: number, level: number): number =>
  Math.max(
    Math.min(everyBars, 2),
    Math.round(everyBars / (1 + PACE_STEP * (tierOf(level) - 1))),
  );

/** The most a single wave sends: 14 at tier 1, 2 more each tier. */
export const waveCap = (level: number): number => 14 + 2 * (tierOf(level) - 1);

/**
 * Kills and the clear bonus score this many times over: a run that goes
 * deeper is worth more. A whole number, so every score stays in hundreds.
 */
export const scoreMultiplier = (level: number): number => tierOf(level);
