import styled from 'styled-components';

/** The page heading, and the way back into a run. */
export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('s')};

  & h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fontFamily('heading')};
    font-size: ${({ theme }) => theme.fontSize('xl')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }

  /* The call to action is a link here: centre it like the button. */
  & a {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }

  @media (max-height: 500px) {
    & h1 {
      font-size: ${({ theme }) => theme.fontSize('l')};
    }
  }
`;
