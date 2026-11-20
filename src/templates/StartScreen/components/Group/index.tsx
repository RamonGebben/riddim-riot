import styled from 'styled-components';

/** One part of the briefing, named by a small label. */
export const Group = styled.section`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('s')};

  & h2 {
    margin: 0;
    color: ${({ theme }) => theme.color('tertiary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  & p {
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    text-wrap: pretty;
  }
`;
