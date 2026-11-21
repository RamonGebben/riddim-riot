import styled from 'styled-components';
import { Button } from '~/atoms/Button';

/**
 * The page's one way in, a size up from the compact pill: there's no game
 * to leave room for yet, and on a phone it keeps the bigger type too.
 */
export const StartButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('l')};
  font-size: ${({ theme }) => theme.fontSize('m')};
`;
