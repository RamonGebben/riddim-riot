import styled from 'styled-components';

export const NumberInput = styled.input.attrs({ type: 'number' })`
  inline-size: 7ch;
  min-block-size: ${({ theme }) => theme.minTarget()};
  padding: 0 ${({ theme }) => theme.spacing('xxs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
  color: ${({ theme }) => theme.color('formBackground', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  text-align: end;

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;
