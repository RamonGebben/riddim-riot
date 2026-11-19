import styled from 'styled-components';

/** One tile: the number big, its label small above it. */
export const Stat = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  min-inline-size: 5.5em;
  padding: ${({ theme }) => theme.spacing('s')}
    ${({ theme }) => theme.spacing('base')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};

  & dt {
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  & dd {
    order: -1;
    margin: 0;
    color: ${({ theme }) => theme.color('background', 'text')};
    font-size: ${({ theme }) => theme.fontSize('l')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }
`;
