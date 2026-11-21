import styled, { css, keyframes } from 'styled-components';
import type { WeaponFace } from '~/molecules/WeaponTag';
import { stepsOf } from '../../steps';

const sweep = keyframes`
  from { left: 0; }
  to { left: 100%; }
`;

const Grid = styled.span<{ $size: 'row' | 'mini' }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  align-items: stretch;
  column-gap: 2px;
  block-size: ${({ $size }) => ($size === 'row' ? '0.9em' : '0.45em')};
  min-inline-size: 0;

  /* A beat's first step stands a little apart, like a sequencer's grid. */
  & > [data-beat='true']:not(:first-child) {
    margin-inline-start: 2px;
  }

  /* A beam is held, not struck: one unbroken strip across the bar. */
  &[data-held='true'] {
    column-gap: 0;

    & > [data-beat='true']:not(:first-child) {
      margin-inline-start: 0;
    }
  }
`;

/** One 1/16: lit where the weapon fires, dimmer for an echo. */
const Cell = styled.span`
  border-radius: 1px;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('formBackground', 'emphasis')} 80%,
    transparent
  );

  &[data-beat='true'] {
    background: ${({ theme }) => theme.color('formBackground', 'emphasis')};
  }

  &[data-step='hit'],
  &[data-step='held'] {
    background: ${({ theme }) => theme.color('primary')};
  }

  &[data-step='echo'] {
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.color('primary')} 40%,
      transparent
    );
  }
`;

/** Where the bar being heard has got to; still under reduced flashing. */
const Playhead = styled.span<{ $bar: number }>`
  position: absolute;
  inset-block: -2px;
  inline-size: 2px;
  border-radius: 1px;
  background: ${({ theme }) => theme.color('background', 'text')};
  box-shadow: 0 0 6px currentColor;
  color: ${({ theme }) => theme.color('background', 'text')};
  ${({ $bar }) => css`
    animation: ${sweep} ${$bar}s linear both;
  `}

  :root[data-flashing='reduced'] & {
    display: none;
  }
`;

export interface StepGridProps extends Pick<
  WeaponFace,
  'oscillator' | 'lfo' | 'fx'
> {
  size?: 'row' | 'mini';
  /** This weapon's bar is being heard: a playhead sweeps it. */
  sounding?: boolean;
  /** Changes with every bar heard, so the sweep starts over. */
  turn?: number;
  barSeconds?: number;
}

/**
 * A bar of the weapon's fire on 16 steps - its rate made visible, the way a
 * sequencer shows a track. Decoration for a screen reader: the rate is
 * already in the weapon's name.
 */
export const StepGrid = ({
  size = 'row',
  sounding = false,
  turn = 0,
  barSeconds = 1.7,
  ...weapon
}: StepGridProps) => (
  <Grid
    $size={size}
    aria-hidden
    data-part="steps"
    data-held={weapon.oscillator === 'beam'}
  >
    {stepsOf(weapon).map((step, index) => (
      <Cell key={index} data-step={step} data-beat={index % 4 === 0} />
    ))}
    {sounding && <Playhead key={turn} $bar={barSeconds} />}
  </Grid>
);
