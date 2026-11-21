import styled from 'styled-components';

/** One weapon in the comparison: what it is, what it does, its numbers. */
export const CompareSide = styled.div<{ $muted?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'caption'
    'name'
    'tag'
    'traits'
    'stats';
  align-content: start;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  min-inline-size: 0;
  opacity: ${({ $muted }) => ($muted ? 0.7 : 1)};

  & + & {
    padding-inline-start: ${({ theme }) => theme.spacing('m')};
    border-inline-start: ${({ theme }) => theme.borderWidth('s')} solid
      color-mix(
        in srgb,
        ${({ theme }) => theme.color('background', 'text')} 12%,
        transparent
      );

    @media (max-width: 479px) {
      padding-block-start: ${({ theme }) => theme.spacing('s')};
      padding-inline-start: 0;
      border-block-start: ${({ theme }) => theme.borderWidth('s')} solid
        color-mix(
          in srgb,
          ${({ theme }) => theme.color('background', 'text')} 12%,
          transparent
        );
      border-inline-start: none;
    }
  }

  & > [data-part='caption'] {
    grid-area: caption;
  }

  & > strong {
    grid-area: name;
    overflow-wrap: anywhere;
    font-size: ${({ theme }) => theme.fontSize('base')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }

  & > [data-part='tag'] {
    grid-area: tag;
    font-size: ${({ theme }) => theme.fontSize('s')};
  }

  & > [data-part='traits'] {
    grid-area: traits;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }

  & > p {
    grid-column: 1 / -1;
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
`;
