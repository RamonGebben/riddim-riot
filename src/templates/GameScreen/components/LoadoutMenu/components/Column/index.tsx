import styled from 'styled-components';

/** One side of the sheet; on a wide screen each scrolls on its own. */
export const Column = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('m')};
  padding: ${({ theme }) => theme.spacing('m')};
  overscroll-behavior: contain;

  & + & {
    border-block-start: ${({ theme }) => theme.borderWidth('s')} solid
      color-mix(
        in srgb,
        ${({ theme }) => theme.color('background', 'text')} 12%,
        transparent
      );
  }

  @media (min-width: 720px) {
    min-block-size: 0;
    overflow-y: auto;

    & + & {
      border-block-start: none;
      border-inline-start: ${({ theme }) => theme.borderWidth('s')} solid
        color-mix(
          in srgb,
          ${({ theme }) => theme.color('background', 'text')} 12%,
          transparent
        );
    }
  }

  @media (max-height: 500px) {
    gap: ${({ theme }) => theme.spacing('s')};
    padding: ${({ theme }) => theme.spacing('s')};
  }
`;
