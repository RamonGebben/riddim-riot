import styled from 'styled-components';

export const Score = styled.span`
  font-size: ${({ theme }) => theme.fontSize('m')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  font-variant-numeric: tabular-nums;
`;
