import styled from 'styled-components';

/** HUD panels stacked down one corner, each as wide as it needs. */
export const HudStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing('xxs')};
`;
