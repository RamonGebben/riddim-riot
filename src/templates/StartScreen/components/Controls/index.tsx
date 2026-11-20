import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/** A list of controls, shown only for the pointer in hand. */
export const Controls = styled.dl<{ $pointer: 'mouse' | 'touch' }>`
  display: ${({ $pointer }) => ($pointer === 'mouse' ? 'grid' : 'none')};
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('s')};
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize('s')};

  & dd {
    margin: 0;
  }

  @media ${TOUCH_SCREEN} {
    display: ${({ $pointer }) => ($pointer === 'touch' ? 'grid' : 'none')};
  }
`;
