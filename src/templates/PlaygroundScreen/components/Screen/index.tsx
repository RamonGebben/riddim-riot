import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styled from 'styled-components';

export interface ScreenSize {
  width: number;
  height: number;
}

/** Plot padding inside the screen, so handles at the edge stay whole. */
export const INSET = 8;
/** The strip under a plot that holds its axis labels. */
export const GUTTER = 18;

const Frame = styled.figure`
  position: relative;
  margin: 0;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('background')};
  overflow: hidden;

  svg {
    display: block;
  }

  .grid {
    stroke: color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 7%,
      transparent
    );
  }
  .axis {
    fill: color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 45%,
      transparent
    );
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
  .trace {
    fill: none;
    stroke: ${({ theme }) => theme.color('primary')};
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .trace-dim {
    fill: none;
    stroke: color-mix(
      in srgb,
      ${({ theme }) => theme.color('primary')} 45%,
      transparent
    );
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }
  .fill {
    fill: color-mix(
      in srgb,
      ${({ theme }) => theme.color('primary')} 16%,
      transparent
    );
    stroke: none;
  }
  .band {
    fill: color-mix(
      in srgb,
      ${({ theme }) => theme.color('primary')} 22%,
      transparent
    );
    stroke: color-mix(
      in srgb,
      ${({ theme }) => theme.color('primary')} 55%,
      transparent
    );
    stroke-dasharray: 4 3;
  }
  .weapon-line {
    stroke: ${({ theme }) => theme.color('quaternary')};
    stroke-dasharray: 2 3;
  }
`;

/** The readout, on its own strip above the plot so it never hides it. */
const Caption = styled.figcaption`
  padding: 0.125rem ${({ theme }) => theme.spacing('xs')};
  border-block-end: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground')};
  color: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background', 'text')} 80%,
    transparent
  );
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  text-align: end;
  text-wrap: balance;
`;

/** The plot's size and where it sits on the page, for its handles. */
const ScreenContext = createContext<{
  svg: SVGSVGElement | null;
}>({ svg: null });

export const useScreen = () => useContext(ScreenContext);

/**
 * A curve display: a dark screen the width of its section, drawing what
 * `children` returns for its measured size. `caption` is the readout in the
 * corner; `label` names the figure for assistive tech.
 */
export const Screen = ({
  label,
  caption,
  height = 104,
  children,
}: {
  label: string;
  caption?: string;
  height?: number;
  children: (size: ScreenSize) => ReactNode;
}) => {
  const frame = useRef<HTMLElement>(null);
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Frame ref={frame} aria-label={label}>
      {caption && <Caption>{caption}</Caption>}
      <svg ref={setSvg} width="100%" height={height} aria-hidden="true">
        {width > 0 && (
          <ScreenContext value={{ svg }}>
            {children({ width, height })}
          </ScreenContext>
        )}
      </svg>
    </Frame>
  );
};

/** Points as an SVG path. */
export const pathOf = (points: Array<{ x: number; y: number }>): string =>
  points
    .map(
      ({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`,
    )
    .join(' ');

/** A linear scale from a value range onto pixels. */
export const linear =
  ([from, to]: [number, number], [start, end]: [number, number]) =>
  (value: number) =>
    start + ((value - from) / (to - from)) * (end - start);

/** Clamp to [min, max]. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
