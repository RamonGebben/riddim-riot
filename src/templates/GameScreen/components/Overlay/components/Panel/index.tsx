import styled from 'styled-components';

/** Short landscape phones get a tighter panel. */
const SHORT = '(max-height: 500px)';

export const Panel = styled.section`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('m')};
  max-inline-size: 100%;
  margin: auto;
  padding: ${({ theme }) => theme.spacing('l')};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: ${({ theme }) => theme.color('background')};
  box-shadow: ${({ theme }) => theme.boxShadow('modal')};
  text-align: center;

  @media ${SHORT} {
    gap: ${({ theme }) => theme.spacing('s')};
    padding: ${({ theme }) => theme.spacing('base')}
      ${({ theme }) => theme.spacing('l')};

    & h2 {
      font-size: ${({ theme }) => theme.fontSize('l')};
    }
  }
`;
