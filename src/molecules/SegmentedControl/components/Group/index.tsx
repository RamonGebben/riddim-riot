import styled from 'styled-components';

export const Group = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  margin: 0;
  padding: 0;
  border: none;
`;
