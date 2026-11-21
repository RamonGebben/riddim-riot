import { describe, expect, it } from 'vitest';
import { stepsOf, type Step } from './steps';

const draw = (steps: Array<Step>) =>
  steps
    .map(step => ({ hit: 'x', echo: 'e', held: '=', rest: '.' })[step])
    .join('');

describe('stepsOf', () => {
  it('hits on the weapon division', () => {
    expect(draw(stepsOf({ oscillator: 'wobble', lfo: '1/4', fx: null }))).toBe(
      'x...x...x...x...',
    );
    expect(draw(stepsOf({ oscillator: 'laser', lfo: '1/2', fx: null }))).toBe(
      'x.......x.......',
    );
  });

  it('answers each hit an 1/8 later with an echo, where there is room', () => {
    expect(draw(stepsOf({ oscillator: 'laser', lfo: '1/4', fx: 'echo' }))).toBe(
      'x.e.x.e.x.e.x.e.',
    );
    expect(draw(stepsOf({ oscillator: 'laser', lfo: '1/8', fx: 'echo' }))).toBe(
      'x.x.x.x.x.x.x.x.',
    );
  });

  it('holds a beam through the bar', () => {
    expect(draw(stepsOf({ oscillator: 'beam', lfo: '1/8', fx: null }))).toBe(
      '================',
    );
  });
});
