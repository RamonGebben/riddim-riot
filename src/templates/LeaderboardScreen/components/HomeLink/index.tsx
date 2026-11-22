import styled from 'styled-components';
import { TextLink } from '~/atoms/TextLink';

/** Back to the start page, above the heading. */
export const HomeLink = styled(TextLink)`
  display: inline-block;
  padding-block: ${({ theme }) => theme.spacing('xxs')};
`;
