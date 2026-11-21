import styled from 'styled-components';

/**
 * Where the pick goes, a thumb away: a button per slot, and the way to
 * throw it out (or keep it after all).
 */
export const PlaceRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};

  & > span {
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }

  & > button {
    min-inline-size: ${({ theme }) => theme.minTarget()};
  }

  & > [data-part='spacer'] {
    flex: 1;
  }
`;
