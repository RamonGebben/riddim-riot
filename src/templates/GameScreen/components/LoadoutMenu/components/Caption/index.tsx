import styled from 'styled-components';

/** Which side is which: "New", "Slot 2", "Replaces slot 1". */
export const Caption = styled.span`
  display: flex;
  margin: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
