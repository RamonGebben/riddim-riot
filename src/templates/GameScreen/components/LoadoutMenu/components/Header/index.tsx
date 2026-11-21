import styled from 'styled-components';

/** The name, where the loadout is kept, and the way back to the fight. */
export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('base')};
  padding: ${({ theme }) => theme.spacing('s')}
    ${({ theme }) => theme.spacing('m')};
  border-block-end: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 12%,
      transparent
    );

  & > div:first-child {
    display: grid;
    flex: 1 1 16rem;
    gap: 2px;
  }

  & h2 {
    margin: 0;
    font-family: ${({ theme }) => theme.fontFamily('heading')};
    font-size: ${({ theme }) => theme.fontSize('l')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }

  & p {
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    text-wrap: pretty;
  }

  & p[role='alert'] {
    color: ${({ theme }) => theme.color('error')};
  }

  & > div:last-child {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('xs')};
  }

  @media (max-height: 500px) {
    padding-block: ${({ theme }) => theme.spacing('xxs')};

    & h2 {
      font-size: ${({ theme }) => theme.fontSize('m')};
    }

    /* The way back stays a pill, just a size down, to leave room. */
    & > div:last-child > button {
      min-block-size: ${({ theme }) => theme.minTarget()};
      padding-block: ${({ theme }) => theme.spacing('xxs')};
      font-size: ${({ theme }) => theme.fontSize('base')};
    }
  }
`;
