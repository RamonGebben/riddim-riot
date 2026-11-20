import styled from 'styled-components';
import { SIDE_BY_SIDE } from '../../layout';

export const Hero = styled.section`
  display: grid;
  align-self: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('base')};
  text-align: center;

  @media ${SIDE_BY_SIDE} {
    justify-items: start;
    text-align: start;
  }
`;
