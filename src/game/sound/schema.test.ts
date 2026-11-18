import { describe, expect, it } from 'vitest';
import { BASE_DESIGN } from '.';
import { DESIGN_SCHEMA, parseDegrees, valueAt, withValue } from './schema';

const fields = DESIGN_SCHEMA.flatMap(group => group.fields);

describe('DESIGN_SCHEMA', () => {
  it('points every control at a value that exists', () => {
    fields.forEach(field =>
      expect(valueAt(BASE_DESIGN, field.path), field.label).toBeDefined(),
    );
  });

  it('lets every slider reach the shipped value', () => {
    fields.forEach(field => {
      if (field.kind !== 'number') return;
      const value = valueAt(BASE_DESIGN, field.path) as number;
      expect(value, field.label).toBeGreaterThanOrEqual(field.min);
      expect(value, field.label).toBeLessThanOrEqual(field.max);
    });
  });

  it('offers the shipped value in every choice', () => {
    fields.forEach(field => {
      if (field.kind !== 'choice') return;
      expect(field.options, field.label).toContain(
        valueAt(BASE_DESIGN, field.path),
      );
    });
  });

  it('has a control for every value in the design', () => {
    // Ranges are edited per end; other lists (riff degrees) as a whole.
    const leaves = (
      value: unknown,
      at: Array<string | number>,
    ): Array<string> => {
      if (Array.isArray(value)) {
        return value.length === 2 &&
          typeof value[0] === 'number' &&
          at.includes('degrees') === false
          ? value.map((_, i) => [...at, i].join('.'))
          : [at.join('.')];
      }
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).flatMap(([key, inner]) =>
          leaves(inner, [...at, key]),
        );
      }
      return [at.join('.')];
    };
    const covered = new Set(fields.map(field => field.path.join('.')));
    leaves(BASE_DESIGN, []).forEach(leaf =>
      expect(covered, leaf).toContain(leaf),
    );
  });

  it('has one control per value, no duplicates', () => {
    const paths = fields.map(field => field.path.join('.'));
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('withValue', () => {
  it('changes one value and leaves the rest, without mutating', () => {
    const next = withValue(BASE_DESIGN, ['drums', 'kick', 'decay'], 0.9);
    expect(next.drums.kick.decay).toBe(0.9);
    expect(next.drums.snare).toBe(BASE_DESIGN.drums.snare);
    expect(BASE_DESIGN.drums.kick.decay).toBe(0.45);
  });

  it('reaches into ranges by index', () => {
    const next = withValue(BASE_DESIGN, ['parts', 'crush', 'drive', 1], 0.7);
    expect(next.parts.crush.drive).toEqual([0.35, 0.7]);
  });
});

describe('parseDegrees', () => {
  it('reads comma or space separated degrees', () => {
    expect(parseDegrees('0, 2 3,4')).toEqual([0, 2, 3, 4]);
    expect(parseDegrees('-1, 7')).toEqual([-1, 7]);
  });

  it('rejects anything that is not whole degrees', () => {
    expect(parseDegrees('')).toBeNull();
    expect(parseDegrees('0, 1.5')).toBeNull();
    expect(parseDegrees('0, x')).toBeNull();
  });
});
