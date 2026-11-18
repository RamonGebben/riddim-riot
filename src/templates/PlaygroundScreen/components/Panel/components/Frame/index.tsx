import styled from 'styled-components';

export const Frame = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
  padding: ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
`;
