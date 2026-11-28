import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import styled, { css } from 'styled-components';
import { formatParam, type ParamUnit } from '~/utils/formatParam';
import {
  fromPosition,
  nudge,
  snap,
  toPosition,
  type KnobRange,
} from '~/utils/knobScale';

/** `design`: a value of the sound design. `weapon`: this roll's own. */
export type KnobTone = 'design' | 'weapon';

export interface KnobProps {
  label: string;
  /** A sentence on what it does, for a tooltip and assistive tech. */
  hint?: string;
  value: number;
  /** Where a reset goes back to, marked on the ring. */
  reference: number;
  min: number;
  max: number;
  step: number;
  unit?: ParamUnit;
  tone?: KnobTone;
  onChange: (value: number) => void;
  /** Back to `reference`: a double-click, or Delete. */
  onReset: () => void;
}

/**
 * Keep the drag when the pointer leaves the dial. Firefox throws for a
 * pointer it isn't tracking (a synthetic one, or one already released);
 * the drag still works over the dial then.
 */
const capture = (element: Element, pointerId: number) => {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Not captured: moves off the dial are missed, nothing else.
  }
};

/** The dial sweeps 270°, from 7:30 round to 4:30. */
const SWEEP = 270;
const START = 135;
/** Pixels of drag for the whole sweep; Shift drags five times finer. */
const DRAG_PIXELS = 160;
const SIZE = 44;
const RADIUS = 17;

const polar = (degrees: number, radius = RADIUS) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: SIZE / 2 + radius * Math.cos(radians),
    y: SIZE / 2 + radius * Math.sin(radians),
  };
};

const arc = (from: number, to: number) => {
  const a = polar(START + from * SWEEP);
  const b = polar(START + to * SWEEP);
  const large = (to - from) * SWEEP > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${b.x} ${b.y}`;
};

const Frame = styled.div`
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 0.125rem;
  inline-size: 4.25rem;
`;

const Dial = styled.div<{ $tone: KnobTone; $changed: boolean }>`
  inline-size: ${SIZE}px;
  block-size: ${SIZE}px;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  cursor: ns-resize;
  touch-action: none;
  color: ${({ theme, $tone }) =>
    theme.color($tone === 'weapon' ? 'quaternary' : 'primary')};

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: 1px;
  }

  .track {
    stroke: ${({ theme }) => theme.color('formBackground', 'emphasis')};
  }
  .face {
    fill: ${({ theme }) => theme.color('background')};
    stroke: color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 10%,
      transparent
    );
  }
  .reference {
    stroke: ${({ theme }) => theme.color('secondary')};
  }
  .pointer {
    stroke: ${({ theme }) => theme.color('background', 'text')};
  }

  ${({ $changed }) =>
    !$changed &&
    css`
      .reference {
        opacity: 0;
      }
    `}
`;

const Label = styled.span`
  max-inline-size: 4.25rem;
  overflow: hidden;
  color: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background', 'text')} 78%,
    transparent
  );
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  line-height: ${({ theme }) => theme.lineHeight('tight')};
  text-align: center;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

const readoutText = css`
  inline-size: 4rem;
  min-block-size: 1.5rem;
  padding: 0 ${({ theme }) => theme.spacing('xxs')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

const Readout = styled.button<{ $changed: boolean; $tone: KnobTone }>`
  ${readoutText}
  border: none;
  background: ${({ theme }) => theme.color('background')};
  color: ${({ theme, $changed, $tone }) =>
    $tone === 'weapon' && $changed
      ? theme.color('quaternary')
      : $changed
        ? theme.color('primary', 'emphasis')
        : theme.color('background', 'text')};
  cursor: text;

  &:hover {
    background: ${({ theme }) => theme.color('formBackground', 'emphasis')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }
`;

const Entry = styled.input`
  ${readoutText}
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('focus')};
  background: ${({ theme }) => theme.color('formBackground')};
  color: ${({ theme }) => theme.color('formBackground', 'text')};

  &:focus-visible {
    outline: none;
  }
`;

/**
 * A synth knob: drag it up or down (Shift for fine), use the arrow keys
 * (Shift fine, Page keys coarse), double-click or Delete to reset, or
 * click the readout to type a value. A tick on the ring marks the
 * reference while the value is away from it. Frequencies turn on a log
 * scale, as they're heard.
 */
export const Knob = ({
  label,
  hint,
  value,
  reference,
  min,
  max,
  step,
  unit,
  tone = 'design',
  onChange,
  onReset,
}: KnobProps) => {
  const labelId = useId();
  const hintId = useId();
  const range: KnobRange = { min, max, step, log: unit === 'Hz' && min > 0 };
  const drag = useRef<{ y: number; position: number } | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const position = toPosition(value, range);
  const changed = value !== reference;
  const text = formatParam(value, { unit, step });

  const set = (next: number) => {
    if (next !== value) onChange(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    capture(event.currentTarget, event.pointerId);
    event.currentTarget.focus();
    drag.current = { y: event.clientY, position };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const pixels = DRAG_PIXELS * (event.shiftKey ? 5 : 1);
    set(
      fromPosition(start.position + (start.y - event.clientY) / pixels, range),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const up = ['ArrowUp', 'ArrowRight', 'PageUp'].includes(event.key);
    const down = ['ArrowDown', 'ArrowLeft', 'PageDown'].includes(event.key);
    const coarse = event.key.startsWith('Page');
    if (up || down) {
      set(nudge(value, range, up ? 1 : -1, { fine: event.shiftKey, coarse }));
    } else if (event.key === 'Home') set(min);
    else if (event.key === 'End') set(max);
    else if (event.key === 'Delete' || event.key === 'Backspace') onReset();
    else if (event.key === 'Enter') setTyping(String(value));
    else return;
    // Handled here: the firing range listens on the window for moves.
    event.preventDefault();
    event.stopPropagation();
  };

  const commit = () => {
    const typed = Number(typing?.trim());
    if (typing !== null && typing.trim() !== '' && Number.isFinite(typed)) {
      set(snap(typed, range));
    }
    setTyping(null);
  };

  const pointer = polar(START + position * SWEEP, RADIUS - 5);
  const inner = polar(START + position * SWEEP, 4);
  const tickOut = polar(
    START + toPosition(reference, range) * SWEEP,
    RADIUS + 4,
  );
  const tickIn = polar(
    START + toPosition(reference, range) * SWEEP,
    RADIUS - 3,
  );

  return (
    <Frame title={hint}>
      <Dial
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        $tone={tone}
        $changed={changed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onReset}
        onKeyDown={onKeyDown}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
          <path
            className="track"
            d={arc(0, 1)}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {position > 0.001 && (
            <path
              d={arc(0, position)}
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
          <circle className="face" cx={SIZE / 2} cy={SIZE / 2} r={12} />
          <line
            className="pointer"
            x1={inner.x}
            y1={inner.y}
            x2={pointer.x}
            y2={pointer.y}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            className="reference"
            x1={tickIn.x}
            y1={tickIn.y}
            x2={tickOut.x}
            y2={tickOut.y}
            strokeWidth={2}
          />
        </svg>
      </Dial>
      <Label id={labelId}>{label}</Label>
      {hint && (
        <span id={hintId} hidden>
          {hint}
        </span>
      )}
      {typing === null ? (
        <Readout
          type="button"
          aria-label={`${label} value, ${text}: type a value`}
          $changed={changed}
          $tone={tone}
          onClick={() => setTyping(String(value))}
        >
          {text}
        </Readout>
      ) : (
        <Entry
          aria-label={`${label} value`}
          inputMode="decimal"
          value={typing}
          autoFocus
          onFocus={event => event.target.select()}
          onChange={event => setTyping(event.target.value)}
          onBlur={commit}
          onKeyDown={event => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') setTyping(null);
          }}
        />
      )}
    </Frame>
  );
};
