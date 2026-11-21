import styled from 'styled-components';

/**
 * The picked weapon beside the one it would replace, under a hairline:
 * part of the sheet, not a card on it. Read out as the pick changes.
 */
export const Compare = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing('s')} ${({ theme }) => theme.spacing('m')};
  padding-block-start: ${({ theme }) => theme.spacing('s')};
  border-block-start: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 12%,
      transparent
    );

  /* Too narrow for two side by side: one over the other. */
  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
  }

  /* The two weapons as tracks over one grid, above the details. */
  & > [data-part='rack'] {
    grid-column: 1 / -1;
    display: grid;
    gap: ${({ theme }) => theme.spacing('xxs')};
  }

  & [data-part='rack-head'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing('xs')};
  }

  & > p {
    grid-column: 1 / -1;
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    text-wrap: pretty;
  }
`;
