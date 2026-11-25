import styled from 'styled-components';

export const Code = styled.code`
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('primary')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('l')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  user-select: all;
`;
