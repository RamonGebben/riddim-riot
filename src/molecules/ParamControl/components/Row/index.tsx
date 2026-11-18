import styled from 'styled-components';

/** One control: label over the input, with an optional hint under it. */
export const Row = styled.div<{ $changed: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  padding: ${({ theme }) => theme.spacing('xs')};
  border-inline-start: ${({ theme }) => theme.borderWidth('base')} solid
    ${({ theme, $changed }) =>
      $changed ? theme.color('quaternary') : 'transparent'};
`;
