import styled from 'styled-components';

export const Label = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgb(0 0 0 / 0.8);
`;
