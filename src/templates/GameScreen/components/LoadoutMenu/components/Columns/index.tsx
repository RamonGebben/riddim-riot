import styled from 'styled-components';

/**
 * Your rack beside the bag on anything wide enough - a laptop or a phone
 * on its side - so picking and placing never needs a scroll between them.
 * Narrower, they stack and scroll together.
 */
export const Columns = styled.div`
  display: grid;
  grid-auto-rows: max-content;
  min-block-size: 0;
  overflow-y: auto;

  @media (min-width: 720px) {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    grid-auto-rows: auto;
    overflow: hidden;
  }
`;
