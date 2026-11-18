import styled from 'styled-components';

export const Track = styled.div`
  position: relative;
  block-size: ${({ theme }) => theme.spacing('s')};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('formBackground')};
`;
