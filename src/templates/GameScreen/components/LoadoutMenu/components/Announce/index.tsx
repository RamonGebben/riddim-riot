import styled from 'styled-components';

/**
 * Read out, never seen: what the last pick was and how it measures up, in
 * one line, so a screen reader isn't handed the whole comparison on every
 * change of aim.
 */
export const Announce = styled.p`
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
