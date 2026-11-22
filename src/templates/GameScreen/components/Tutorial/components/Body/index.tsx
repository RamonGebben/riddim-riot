import styled from 'styled-components';

/** The step's explanation; its keys stand out in the primary colour. */
export const Body = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};

  & kbd {
    color: ${({ theme }) => theme.color('primary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
  }
`;
