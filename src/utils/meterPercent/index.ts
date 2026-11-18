/** The floor of a level meter: anything quieter reads as empty. */
const FLOOR_DB = -60;

/** A level in dB as a 0-100 bar, with 0 dB (clipping) at the top. */
export const meterPercent = (db: number): number => {
  if (!Number.isFinite(db) || db <= FLOOR_DB) return 0;
  return Math.min(100, ((db - FLOOR_DB) / -FLOOR_DB) * 100);
};
