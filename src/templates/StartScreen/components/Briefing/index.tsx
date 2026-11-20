import styled from 'styled-components';
import { SIDE_BY_SIDE } from '../../layout';

/**
 * What to know before the first press - the loadout and the controls - on
 * one sheet of glass along the bottom.
 */
export const Briefing = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: ${({ theme }) => theme.spacing('l')};
  box-sizing: border-box;
  inline-size: min(100%, 62rem);
  padding: ${({ theme }) => theme.spacing('base')}
    ${({ theme }) => theme.spacing('m')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 12%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 75%,
    transparent
  );
  backdrop-filter: blur(8px);

  @media ${SIDE_BY_SIDE} {
    grid-column: 1 / -1;
  }
`;
