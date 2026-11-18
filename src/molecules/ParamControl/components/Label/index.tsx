import styled from 'styled-components';

export const Label = styled.label`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('s')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
