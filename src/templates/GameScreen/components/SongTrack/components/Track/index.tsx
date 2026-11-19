import styled from 'styled-components';

export const Track = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  inline-size: min(36vw, 26rem);
`;
