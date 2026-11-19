import styled from 'styled-components';

/** One part of the song: its width is its length, filled as it plays. */
export const Segment = styled.span<{
  $bars: number;
  $drop: boolean;
  $played: number;
}>`
  flex: ${({ $bars }) => $bars} 1 0;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    ${({ theme, $drop }) => ($drop ? theme.color('tertiary') : theme.color('primary'))}
      ${({ $played }) => $played * 100}%,
    color-mix(
        in srgb,
        ${({ theme, $drop }) =>
            $drop ? theme.color('tertiary') : theme.color('secondary')}
          30%,
        transparent
      )
      ${({ $played }) => $played * 100}%
  );
`;
