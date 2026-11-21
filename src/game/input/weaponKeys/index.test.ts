import { describe, expect, it } from 'vitest';
import { weaponKeyAction } from '.';

describe('weaponKeyAction', () => {
  it('maps the number row to slots', () => {
    expect(weaponKeyAction('Digit2')).toEqual({ type: 'select', slot: 1 });
  });

  it('cycles on Q and E', () => {
    expect(weaponKeyAction('KeyQ')).toEqual({ type: 'cycle', direction: -1 });
    expect(weaponKeyAction('KeyE')).toEqual({ type: 'cycle', direction: 1 });
    expect(weaponKeyAction('KeyR')).toBeNull();
  });

  it('ignores everything else, movement included', () => {
    expect(weaponKeyAction('KeyW')).toBeNull();
    expect(weaponKeyAction('Digit4')).toBeNull();
  });
});
