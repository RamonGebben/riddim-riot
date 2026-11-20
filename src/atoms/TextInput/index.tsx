import styled from 'styled-components';

export const TextInput = styled.input.attrs<{ type?: string }>(({ type }) => ({
  type: type ?? 'text',
}))<{
  $invalid?: boolean;
}>`
  inline-size: 100%;
  min-block-size: ${({ theme }) => theme.minTarget()};
  padding: 0 ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme, $invalid }) =>
      $invalid
        ? theme.color('error')
        : theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
  color: ${({ theme }) => theme.color('formBackground', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;
