import styled from 'styled-components';

/** A round pill like the icon buttons, wide enough for a count. */
export const Pill = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4em;
  min-inline-size: ${({ theme }) => theme.minTarget()};
  block-size: ${({ theme }) => theme.minTarget()};
  padding: 0 ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 25%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: transparent;
  color: ${({ theme }) => theme.color('background', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  font-variant-numeric: tabular-nums;
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
