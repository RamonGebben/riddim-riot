import styled from 'styled-components';

/** The rank and the name it belongs to; yours is lit. */
export const Rank = styled.div<{ $mine: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 ${({ theme }) => theme.spacing('s')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};

  & strong {
    color: ${({ theme, $mine }) =>
      $mine ? theme.color('primary') : theme.color('background', 'text')};
    font-size: ${({ theme }) => theme.fontSize('xl')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
    text-shadow: ${({ $mine }) => ($mine ? '0 0 8px currentColor' : 'none')};
  }

  & span {
    color: ${({ theme }) => theme.color('background', 'text')};
    font-size: ${({ theme }) => theme.fontSize('m')};
    overflow-wrap: anywhere;
  }
`;
