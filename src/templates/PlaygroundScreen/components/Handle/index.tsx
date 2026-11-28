import { useRef, type PointerEvent } from 'react';
import styled from 'styled-components';
import { useScreen } from '../Screen';

const Dot = styled.circle<{ $tone: 'design' | 'weapon' }>`
  fill: ${({ theme }) => theme.color('background')};
  stroke: ${({ theme, $tone }) =>
    theme.color($tone === 'weapon' ? 'quaternary' : 'primary')};
  stroke-width: 2.5;
  cursor: grab;
  touch-action: none;

  &:hover {
    fill: ${({ theme, $tone }) =>
      theme.color($tone === 'weapon' ? 'quaternary' : 'primary')};
  }

  &:active {
    cursor: grabbing;
  }
`;

/**
 * Keep the drag when the pointer leaves the element. Firefox throws for a
 * pointer it isn't tracking (a synthetic one, or one already released);
 * the drag still works inside the element then.
 */
const capture = (element: Element, pointerId: number) => {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Not captured: moves outside the element are missed, nothing else.
  }
};

/** A larger invisible ring, so the dot is easy to catch with a mouse. */
const Grip = styled.circle`
  fill: transparent;
  cursor: grab;
  touch-action: none;
`;

/**
 * A point on a curve you can drag. `onDrag` gets the pointer's position in
 * the screen's pixels; each screen turns it back into the value it moves.
 * Every handle doubles a knob, which is where the keyboard reaches it.
 */
export const Handle = ({
  x,
  y,
  tone = 'design',
  grip = 12,
  onDrag,
  onReset,
}: {
  x: number;
  y: number;
  tone?: 'design' | 'weapon';
  /** How far round the dot it can be caught, in pixels. */
  grip?: number;
  onDrag: (point: { x: number; y: number }) => void;
  onReset?: () => void;
}) => {
  const { svg } = useScreen();
  const dragging = useRef(false);

  const point = (event: PointerEvent<SVGCircleElement>) => {
    const rect = svg?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  };
  const handlers = {
    onPointerDown: (event: PointerEvent<SVGCircleElement>) => {
      if (event.button !== 0) return;
      capture(event.currentTarget, event.pointerId);
      dragging.current = true;
    },
    onPointerMove: (event: PointerEvent<SVGCircleElement>) => {
      if (dragging.current) onDrag(point(event));
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
    onDoubleClick: onReset,
  };

  return (
    <g>
      <Grip cx={x} cy={y} r={grip} {...handlers} />
      <Dot cx={x} cy={y} r={5.5} $tone={tone} {...handlers} />
    </g>
  );
};
