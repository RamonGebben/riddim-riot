import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Window = styled.div`
  position: relative;
  aspect-ratio: 15 / 11;
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('background')};
  cursor: crosshair;
  touch-action: none;
  user-select: none;
`;

const Help = styled.p`
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  margin: 0;
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 72%,
    transparent
  );
  color: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background', 'text')} 82%,
    transparent
  );
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  pointer-events: none;
`;

/**
 * The firing range's window: the game's stage mounts into it (`mount`
 * returns its detach), and it plays as a level does while the pointer is
 * over it.
 */
export const RangeWindow = ({
  mount,
}: {
  /** Mount the range; null until the audio has started. */
  mount: ((element: HTMLElement) => () => void) | null;
}) => {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mount || !element.current) return;
    return mount(element.current);
  }, [mount]);

  return (
    <Window
      ref={element}
      role="application"
      aria-label="Firing range: point here to move with WASD and click to fire"
    >
      <Help>Point here · WASD move · click fire · Space dash</Help>
    </Window>
  );
};
