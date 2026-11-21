import styled from 'styled-components';

/**
 * Plays a weapon's bar over the loop: a round button like the HUD's icon
 * buttons, lit Strobe Blue while its weapon sounds.
 */
export const HearButton = styled.button<{
  $playing: boolean;
  /** A pill with a word beside its icon, like the A/B toggle. */
  $wide?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  inline-size: ${({ theme, $wide }) => ($wide ? 'auto' : theme.minTarget())};
  padding-inline: ${({ theme, $wide }) => ($wide ? theme.spacing('s') : 0)};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  block-size: ${({ theme }) => theme.minTarget()};
  padding-block: 0;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme, $playing }) =>
      $playing
        ? theme.color('primary')
        : `color-mix(in srgb, ${theme.color('background', 'text')} 25%, transparent)`};
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme, $playing }) =>
    $playing ? theme.color('primary') : 'transparent'};
  box-shadow: ${({ theme, $playing }) =>
    $playing
      ? `0 0 14px color-mix(in srgb, ${theme.color('primary')} 55%, transparent)`
      : 'none'};
  color: ${({ theme, $playing }) =>
    $playing ? theme.color('primary', 'text') : theme.color('primary')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    border-color: ${({ theme }) => theme.color('primary')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }
`;
