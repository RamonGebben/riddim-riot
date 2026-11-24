import styled, { css, keyframes } from 'styled-components';

/** New loot arrives once as the menu opens: up from below, one by one. */
const reveal = keyframes`
  from {
    opacity: 0;
    transform: translateY(0.5em) scale(0.96);
  }
`;

/**
 * A slot taking a swapped weapon latches: its edge and halo flare Strobe
 * Blue as the weapon lands, then settle.
 */
const latch = (color: string) => keyframes`
  from {
    border-color: ${color};
    box-shadow:
      0 0 0 2px ${color},
      0 0 22px color-mix(in srgb, ${color} 70%, transparent);
  }
`;

/**
 * One weapon to pick. A slot is a track row - key, engine, beat, name and
 * inserts, then its bar of steps - and a bag weapon a small card with its
 * steps underneath. Picked, it lights Strobe Blue; a slot the pick could
 * go into shows a dashed blue edge; marked to throw away, it fades and its
 * name is struck through. A swap flies a lifted copy of each card
 * (`data-ghost`) to where it lands, and the slot it lands in latches
 * (`data-landed`): see `useFlight`.
 */
export const Card = styled.button<{
  $picked: boolean;
  $target: boolean;
  /** A slot: its key cap leads, as on the HUD. */
  $keyed?: boolean;
  $discarded?: boolean;
  /** New loot's place in the reveal; none for the rest. */
  $reveal?: number;
}>`
  position: relative;
  display: grid;
  grid-template-columns: ${({ $keyed }) =>
    $keyed
      ? 'auto auto 3.4em minmax(0, 1fr) minmax(6rem, 1.2fr)'
      : 'auto auto minmax(0, 1fr)'};
  grid-template-areas: ${({ $keyed }) =>
    $keyed
      ? `'key engine rate name steps'`
      : `'engine rate badges' 'name name name' 'steps steps steps'`};
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: ${({ theme, $keyed }) =>
    $keyed ? theme.minTarget() : `max(${theme.minTarget()}, 4.2em)`};
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('base')}
    ${({ $target }) => ($target ? 'dashed' : 'solid')}
    ${({ theme, $picked, $target }) =>
      $picked
        ? theme.color('primary')
        : $target
          ? `color-mix(in srgb, ${theme.color('primary')} 60%, transparent)`
          : `color-mix(in srgb, ${theme.color('background', 'text')} 15%, transparent)`};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: ${({ theme }) => theme.color('background', 'emphasis')};
  box-shadow: ${({ theme, $picked }) =>
    $picked
      ? `0 0 14px color-mix(in srgb, ${theme.color('primary')} 55%, transparent)`
      : 'none'};
  color: ${({ theme, $picked }) =>
    $picked ? theme.color('background', 'text') : theme.color('secondary')};
  font: inherit;
  text-align: start;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    transform 0.08s,
    border-color 0.08s;

  opacity: ${({ $discarded }) => ($discarded ? 0.45 : 1)};

  ${({ $reveal }) =>
    $reveal !== undefined &&
    css`
      animation: ${reveal} 0.43s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: ${$reveal * 70}ms;

      :root[data-flashing='reduced'] & {
        animation: none;
      }
    `}

  &:hover {
    color: ${({ theme }) => theme.color('background', 'text')};
  }

  &[data-landed] {
    animation: ${({ theme }) => latch(theme.color('primary'))} 0.52s
      cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
  }

  /* Lifted off the sheet while it travels, whatever edge it had. */
  &[data-ghost] {
    border-style: solid;
    box-shadow:
      ${({ theme }) => theme.boxShadow('modal')},
      0 0 14px
        color-mix(
          in srgb,
          ${({ theme }) => theme.color('primary')} 55%,
          transparent
        );
  }

  :root[data-flashing='reduced'] &[data-landed] {
    animation: none;
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }

  & > [data-part='engine'] {
    grid-area: engine;
    color: ${({ theme }) => theme.color('primary')};
    font-size: ${({ theme }) => theme.fontSize('l')};
  }

  & > [data-part='rate'] {
    grid-area: rate;
    font-size: ${({ theme }) => theme.fontSize('base')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
  }

  & > [data-part='badges'] {
    grid-area: badges;
    display: flex;
    gap: 2px;
    justify-self: end;
    color: ${({ theme }) => theme.color('tertiary')};
    font-size: ${({ theme }) => theme.fontSize('base')};
  }

  & [data-part='upgrade'] {
    display: inline-flex;
    color: ${({ theme }) => theme.color('quaternary')};
  }

  /* Wraps rather than clips: a tag is never cut in half. */
  & > [data-part='name'] {
    grid-area: name;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px ${({ theme }) => theme.spacing('xxs')};
    font-family: ${({ theme }) => theme.fontFamily('base')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    text-decoration: ${({ $discarded }) =>
      $discarded ? 'line-through' : 'none'};
  }

  & kbd {
    grid-area: key;
    align-self: center;
    color: ${({ theme }) => theme.color('primary')};
    font: inherit;
  }

  & > [data-part='steps'] {
    grid-area: steps;
  }

  /* Narrow phones: the track keeps its steps; the name gives way. */
  ${({ $keyed }) =>
    $keyed &&
    css`
      @media (max-width: 479px) {
        grid-template-columns: auto auto 3.4em minmax(5rem, 1fr);
        grid-template-areas: 'key engine rate steps';

        & > [data-part='name'] {
          display: none;
        }
      }
    `}
`;
