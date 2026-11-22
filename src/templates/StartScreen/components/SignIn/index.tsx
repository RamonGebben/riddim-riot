import styled from 'styled-components';

/** The sign-in form, with a line on what it's for. */
export const SignIn = styled.div`
  display: grid;
  justify-items: inherit;
  gap: ${({ theme }) => theme.spacing('s')};
  inline-size: min(100%, 20rem);

  & p {
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
`;
