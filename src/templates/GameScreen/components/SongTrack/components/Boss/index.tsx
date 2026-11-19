import styled from 'styled-components';

export const Boss = styled.div`
  inline-size: 100%;
  block-size: 10px;
  margin-block-start: ${({ theme }) => theme.spacing('xxs')};
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('error')};
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('error')} 15%,
    transparent
  );
`;
