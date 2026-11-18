const MAX_SEED = 2 ** 32;

// FNV-1a, so a word in the URL (`?seed=wobble`) gives a stable seed too.
const hashString = (value: string) =>
  [...value].reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );

/**
 * The level seed from a URL query string (`?seed=…`), or a fresh random one
 * when there's none.
 */
export const getSeed = (
  search: string,
  random: () => number = Math.random,
): number => {
  const value = new URLSearchParams(search).get('seed')?.trim();
  if (!value) return Math.floor(random() * MAX_SEED);
  if (/^\d+$/.test(value)) return Number(value) % MAX_SEED;
  return hashString(value);
};
