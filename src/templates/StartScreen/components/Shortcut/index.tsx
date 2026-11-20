import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/** "or press Enter": only where there's a keyboard to press it on. */
export const Shortcut = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};

  @media ${TOUCH_SCREEN} {
    display: none;
  }
`;
