import styled from 'styled-components';

export const Summary = styled.summary`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('s')};
  min-block-size: ${({ theme }) => theme.minTarget()};
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('s')};
  font-weight: ${({ theme }) => theme.fontWeight('semibold')};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;
