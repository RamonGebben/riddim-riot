import styled from 'styled-components';

export const Hearts = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing('xxs')};
  font-size: ${({ theme }) => theme.fontSize('l')};
`;
