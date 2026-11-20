import styled from 'styled-components';
import { SIDE_BY_SIDE } from '../../layout';

/**
 * The hero over the briefing. Side by side, the hero takes the left column
 * and the right is left open for the level behind it.
 */
export const Page = styled.main`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 1fr auto;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('xl')};
  box-sizing: border-box;
  min-block-size: 100vh;
  /* dvh: the height actually visible, with or without the browser's bars. */
  min-block-size: 100dvh;
  padding: ${({ theme }) => theme.spacing('l')}
    max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-right, 0px)
    )
    max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-bottom, 0px)
    )
    max(${({ theme }) => theme.spacing('base')}, env(safe-area-inset-left, 0px));

  @media ${SIDE_BY_SIDE} {
    grid-template-columns: minmax(0, 34rem) 1fr;
    justify-items: start;
    padding-inline-start: max(
      ${({ theme }) => theme.spacing('xl')},
      env(safe-area-inset-left, 0px)
    );
  }
`;
