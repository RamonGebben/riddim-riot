import styled from 'styled-components';

/** Its width is set every frame by the Meter, not through React. */
export const Fill = styled.div`
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 0;
  background: ${({ theme }) => theme.gradient('hero')};
`;
