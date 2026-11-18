import styled from 'styled-components';

export const Heading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily('heading')};
  font-size: ${({ theme }) => theme.fontSize('xl')};
  line-height: ${({ theme }) => theme.lineHeight('tight')};
`;
