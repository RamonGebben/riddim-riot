import styled from 'styled-components';

export const Slot = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme, $active }) =>
      $active ? theme.color('primary') : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  color: ${({ theme, $active }) =>
    $active ? theme.color('background', 'text') : theme.color('secondary')};
`;
