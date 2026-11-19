import styled from 'styled-components';

export const Heading = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily('heading')};
  font-size: calc(${({ theme }) => theme.fontSize('xl')} * 1.6);
  line-height: ${({ theme }) => theme.lineHeight('tight')};
  text-shadow: 0 0 24px ${({ theme }) => theme.color('tertiary')};
`;
