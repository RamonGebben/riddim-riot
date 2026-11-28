import { useEffect, useRef } from 'react';
import styled from 'styled-components';

/** The weapon's riff as the bar plays it. */
export interface RiffView {
  /** MIDI notes, one per shot, cycling. */
  notes: Array<number>;
  /** Sixteenths between shots. */
  every: number;
  /** Which shot is sounding, read once a frame; null while silent. */
  read: () => number | null;
}

const STEPS = 16;
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = (midi: number) =>
  `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

const Row = styled.ol`
  display: grid;
  grid-template-columns: repeat(${STEPS}, minmax(0, 1fr));
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Step = styled.li<{ $fires: boolean; $downbeat: boolean }>`
  display: grid;
  grid-template-rows: 3.25rem auto;
  gap: 2px;
  padding: 3px 2px 2px;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme, $downbeat }) =>
      $downbeat ? theme.color('formBackground', 'emphasis') : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('background')};
  color: ${({ theme, $fires }) =>
    $fires
      ? theme.color('background', 'text')
      : `color-mix(in srgb, ${theme.color('background', 'text')} 30%, transparent)`};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  text-align: center;
  transition: background 60ms ease-out;

  &[data-lit='true'] {
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.color('quaternary')} 28%,
      ${({ theme }) => theme.color('background')}
    );
  }
`;

const Pitch = styled.span`
  position: relative;
  display: block;
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};

  & > span {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    border-radius: ${({ theme }) => theme.borderRadius('s')};
    background: ${({ theme }) => theme.color('quaternary')};
  }
`;

/**
 * A bar's sixteen steps with the weapon's shots on them: each shot's riff
 * note, its height by pitch, the one sounding lit as the bar plays (drawn
 * straight onto the steps every frame, not through React).
 */
export const RiffSteps = ({ riff }: { riff: RiffView }) => {
  const row = useRef<HTMLOListElement>(null);
  const { notes, every, read } = riff;
  const shotsPerBar = Math.max(1, Math.floor(STEPS / every));
  const low = Math.min(...notes);
  const high = Math.max(...notes);
  const noteAt = (step: number) =>
    step % every === 0 ? notes[(step / every) % notes.length] : null;

  useEffect(() => {
    let frame = 0;
    let lit = -1;
    const draw = () => {
      const shot = read();
      const step = shot === null ? -1 : (shot % shotsPerBar) * every;
      if (step !== lit && row.current) {
        row.current.children[lit]?.setAttribute('data-lit', 'false');
        row.current.children[step]?.setAttribute('data-lit', 'true');
        lit = step;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [read, every, shotsPerBar]);

  return (
    <Row ref={row} aria-label="Riff over one bar">
      {Array.from({ length: STEPS }, (_, step) => {
        const note = noteAt(step);
        const height =
          note === null
            ? 0
            : 0.25 + (0.75 * (note - low)) / Math.max(high - low, 1);
        return (
          <Step
            key={step}
            $fires={note !== null}
            $downbeat={step % 4 === 0}
            aria-label={
              note === null
                ? `Step ${step + 1}: rest`
                : `Step ${step + 1}: ${nameOf(note)}`
            }
          >
            <Pitch>
              <span style={{ blockSize: `${height * 100}%` }} />
            </Pitch>
            <span>{note === null ? step + 1 : nameOf(note)}</span>
          </Step>
        );
      })}
    </Row>
  );
};
