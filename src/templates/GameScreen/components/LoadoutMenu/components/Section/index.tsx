import styled from 'styled-components';

/** The slots or the bag, named by a small violet label. */
export const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};

  & h3 {
    margin: 0;
    color: ${({ theme }) => theme.color('tertiary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
  }
`;
