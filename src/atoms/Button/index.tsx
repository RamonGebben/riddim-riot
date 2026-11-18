import styled from 'styled-components';

export const Button = styled.button`
  min-block-size: max(${({ theme }) => theme.minTarget()}, 2.5em);
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('l')};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('primary')};
  color: ${({ theme }) => theme.color('primary', 'text')};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize('m')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color('primary', 'emphasis')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
`;
