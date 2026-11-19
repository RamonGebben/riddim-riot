import styled from 'styled-components';

export const BossFill = styled.div`
  block-size: 100%;
  background: ${({ theme }) => theme.color('error')};
  box-shadow: 0 0 10px ${({ theme }) => theme.color('error')};
  transition: inline-size 0.15s ease-out;
`;
