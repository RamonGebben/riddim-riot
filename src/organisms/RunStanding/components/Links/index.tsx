import styled from 'styled-components';

export const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing('s')} ${({ theme }) => theme.spacing('l')};

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }
`;
