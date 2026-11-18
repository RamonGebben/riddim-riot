import styled from 'styled-components';

export const Select = styled.select`
  min-block-size: ${({ theme }) => theme.minTarget()};
  padding: 0 ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
  color: ${({ theme }) => theme.color('formBackground', 'text')};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize('s')};

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;
