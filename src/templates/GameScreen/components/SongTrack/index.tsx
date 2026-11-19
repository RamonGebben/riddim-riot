import { Boss } from './components/Boss';
import { BossFill } from './components/BossFill';
import { Label } from './components/Label';
import { Segment } from './components/Segment';
import { Segments } from './components/Segments';
import { Track } from './components/Track';
import type { SongPart } from '../../types';

export interface SongTrackProps {
  /** What the level is doing, e.g. "drop 1 0:42" or "charging". */
  label: string;
  song: Array<{ part: SongPart; bars: number }>;
  /** Bars into the song, once it's started. */
  songBar: number | null;
  /** The boss's health, 0-1, while it's up. */
  boss: number | null;
}

const isDrop = (part: SongPart) => part.startsWith('drop');

/**
 * The level's song as a strip of its parts, drops brighter, filling as it
 * plays - so the player sees the next drop coming. The boss's health sits
 * under it while it's up.
 */
export const SongTrack = ({ label, song, songBar, boss }: SongTrackProps) => {
  const starts = song.reduce<Array<number>>(
    (acc, section, i) => [...acc, i === 0 ? 0 : acc[i - 1] + song[i - 1].bars],
    [],
  );
  return (
    <Track>
      <Label>{label}</Label>
      <Segments aria-hidden>
        {song.map((section, i) => {
          const played =
            songBar === null
              ? 0
              : Math.min(Math.max((songBar - starts[i]) / section.bars, 0), 1);
          return (
            <Segment
              key={section.part}
              $bars={section.bars}
              $drop={isDrop(section.part)}
              $played={played}
            />
          );
        })}
      </Segments>
      {boss !== null && (
        <Boss
          role="meter"
          aria-label="Boss health"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(boss * 100)}
        >
          <BossFill style={{ inlineSize: `${boss * 100}%` }} />
        </Boss>
      )}
    </Track>
  );
};
