import styled from 'styled-components';

export const Panel = styled.section`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('m')};
  padding: ${({ theme }) => theme.spacing('l')};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: ${({ theme }) => theme.color('background')};
  box-shadow: ${({ theme }) => theme.boxShadow('modal')};
  text-align: center;
`;
