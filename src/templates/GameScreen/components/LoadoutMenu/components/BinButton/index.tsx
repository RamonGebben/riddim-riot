import styled from 'styled-components';

/**
 * Marks a bag weapon to throw away, beside its card: a round button like
 * Hear, quiet until it's aimed at, then Error red. Once marked it turns
 * into the way back, in the primary colour.
 */
export const BinButton = styled.button<{ $marked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: ${({ theme }) => theme.minTarget()};
  block-size: ${({ theme }) => theme.minTarget()};
  padding: 0;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 25%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: transparent;
  color: ${({ theme, $marked }) =>
    $marked ? theme.color('primary') : theme.color('tertiary')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    border-color: ${({ theme, $marked }) =>
      $marked ? theme.color('primary') : theme.color('error')};
    color: ${({ theme, $marked }) =>
      $marked ? theme.color('primary') : theme.color('error')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }
`;
