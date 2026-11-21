import styled from 'styled-components';

/** An FX or blast on a weapon, named like an insert on a channel. */
export const Insert = styled.span`
  padding: 0 0.4em;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('tertiary')} 45%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  line-height: 1.5;
  white-space: nowrap;
`;
