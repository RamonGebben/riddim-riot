import styled from 'styled-components';

export const Cell = styled.span<{ $loaded: boolean }>`
  flex: 1 1 0;
  border-radius: 1px;
  background: ${({ theme, $loaded }) =>
    $loaded
      ? theme.color('primary')
      : `color-mix(in srgb, ${theme.color('secondary')} 25%, transparent)`};
`;
