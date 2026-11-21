import styled from 'styled-components';

/** The three equipped weapons, each a row with its own Hear button. */
export const SlotList = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};

  & > li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('xs')};
  }
`;
