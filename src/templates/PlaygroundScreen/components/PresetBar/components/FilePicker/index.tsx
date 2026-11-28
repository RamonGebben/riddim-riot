import styled from 'styled-components';
import { Latch } from '~/atoms/Latch';

/** A latch-looking label around a hidden file input. */
export const FilePicker = styled(Latch).attrs({ as: 'label' })`
  position: relative;

  &:focus-within {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: 1px;
  }

  & input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
  }
`;
