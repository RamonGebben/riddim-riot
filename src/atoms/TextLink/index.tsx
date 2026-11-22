import styled from 'styled-components';

/**
 * A quiet link in running UI: underlined, brightening on hover. As a
 * `button` it looks the same, for an action that stays on the page.
 */
export const TextLink = styled.a`
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  color: ${({ theme }) => theme.color('background', 'text')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  text-decoration: underline;
  text-decoration-color: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background', 'text')} 40%,
    transparent
  );
  text-underline-offset: 0.25em;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color('focus')};
    text-decoration-color: currentColor;
  }

  &:focus-visible {
    border-radius: ${({ theme }) => theme.borderRadius('s')};
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }
`;
