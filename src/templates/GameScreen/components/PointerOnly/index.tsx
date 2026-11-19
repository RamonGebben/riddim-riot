import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/** Shown only with a mouse, or only on a touch screen. */
export const PointerOnly = styled.span<{ $pointer: 'mouse' | 'touch' }>`
  display: ${({ $pointer }) => ($pointer === 'mouse' ? 'contents' : 'none')};

  @media ${TOUCH_SCREEN} {
    display: ${({ $pointer }) => ($pointer === 'touch' ? 'contents' : 'none')};
  }
`;
