import styled from 'styled-components';

export const RangeInput = styled.input.attrs({ type: 'range' })`
  inline-size: 100%;
  min-block-size: ${({ theme }) => theme.minTarget()};
  margin: 0;
  accent-color: ${({ theme }) => theme.color('primary')};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }
`;
