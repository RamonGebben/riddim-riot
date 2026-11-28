import styled from 'styled-components';

/** A panel section's name: UV violet, mono, tracked wide - it names things. */
export const PanelLabel = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
`;
