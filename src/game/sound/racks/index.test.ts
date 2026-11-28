import { describe, expect, it } from 'vitest';
import { BASE_DESIGN } from '../model';
import { DESIGN_SCHEMA, valueAt } from '../schema';
import { allSections, RACKS } from '.';

const key = (path: Array<string | number>) => path.join('.');

describe('the racks', () => {
  const placed = allSections().flatMap(section =>
    section.knobs.map(knob => key(knob.path)),
  );

  it('put every value of the design on a knob', () => {
    const fields = DESIGN_SCHEMA.flatMap(group =>
      group.fields.map(field => key(field.path)),
    );
    expect(fields.filter(field => !placed.includes(field))).toEqual([]);
  });

  it('put each value on one knob only', () => {
    expect(placed.filter((path, i) => placed.indexOf(path) !== i)).toEqual([]);
  });

  it('point only at values the schema describes', () => {
    const fields = new Set(
      DESIGN_SCHEMA.flatMap(group => group.fields.map(f => key(f.path))),
    );
    expect(placed.filter(path => !fields.has(path))).toEqual([]);
  });

  it('draw curves only from values the design has', () => {
    const paths = allSections().flatMap(({ view }) => {
      if (!view) return [];
      if (view.kind === 'drop') return [view.multiple, view.seconds];
      if (view.kind === 'decay') return [view.decay];
      if (view.kind === 'response')
        return [view.hz, ...(view.q ? [view.q] : [])];
      if (view.kind === 'envelope') return [view.root];
      return [];
    });
    expect(
      paths.filter(path => valueAt(BASE_DESIGN, path) === undefined),
    ).toEqual([]);
  });

  it('give every section a unique id', () => {
    const ids = allSections().map(section => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(RACKS.map(rack => rack.id)).toEqual([
      'wobble',
      'laser',
      'beam',
      'drums',
      'hits',
      'track',
    ]);
  });
});
