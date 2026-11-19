import { Button } from '~/atoms/Button';
import { Actions } from './components/Actions';
import { Backdrop } from './components/Backdrop';
import { Heading } from './components/Heading';
import { Note } from './components/Note';
import { Panel } from './components/Panel';
import { Stat } from './components/Stat';

export interface OverlayProps {
  heading: string;
  stats: Array<string>;
  /** A quiet line under the stats, like the seed to share. */
  note?: string;
  actions: Array<{ label: string; onClick: () => void }>;
}

/** A panel over the frozen stage: a run that ended, or a level cleared. */
export const Overlay = ({ heading, stats, note, actions }: OverlayProps) => {
  return (
    <Backdrop>
      <Panel aria-labelledby="overlay-heading">
        <Heading id="overlay-heading">{heading}</Heading>
        {stats.map(stat => (
          <Stat key={stat}>{stat}</Stat>
        ))}
        {note && <Note>{note}</Note>}
        <Actions>
          {actions.map(({ label, onClick }) => (
            <Button key={label} onClick={onClick}>
              {label}
            </Button>
          ))}
        </Actions>
      </Panel>
    </Backdrop>
  );
};
