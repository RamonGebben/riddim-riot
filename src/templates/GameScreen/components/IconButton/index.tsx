import styled from 'styled-components';

/** A round button holding just an icon; its name comes from aria-label. */
export const IconButton = styled.button`
  display: grid;
  place-items: center;
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
  color: ${({ theme }) => theme.color('background', 'text')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    background: ${({ theme }) => theme.color('formBackground')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;
