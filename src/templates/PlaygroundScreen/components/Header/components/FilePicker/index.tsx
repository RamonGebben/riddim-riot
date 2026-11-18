import styled from 'styled-components';

/** A button-looking label around a hidden file input. */
export const FilePicker = styled.label`
  display: inline-flex;
  align-items: center;
  min-block-size: ${({ theme }) => theme.minTarget()};
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  cursor: pointer;

  &:focus-within {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }

  & input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
  }
`;
