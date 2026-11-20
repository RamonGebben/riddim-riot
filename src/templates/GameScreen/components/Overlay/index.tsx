import { Button } from '~/atoms/Button';
import { Actions } from './components/Actions';
import { Backdrop } from './components/Backdrop';
import { Badge } from './components/Badge';
import { Heading } from './components/Heading';
import { Message } from './components/Message';
import { Note } from './components/Note';
import { Panel } from './components/Panel';
import { Stat } from './components/Stat';
import { Stats } from './components/Stats';

export interface OverlayStat {
  label: string;
  value: string;
}

export interface OverlayProps {
  heading: string;
  /** A bright callout under the heading, like a new best. */
  badge?: string;
  stats?: Array<OverlayStat>;
  /** Sentences, for a panel that explains instead of scoring. */
  message?: Array<string>;
  /** A quiet line under the stats, like the seed to share. */
  note?: string;
  actions: Array<{ label: string; onClick: () => void }>;
}

/** A panel over the frozen stage: a run that ended, or a level cleared. */
export const Overlay = ({
  heading,
  badge,
  stats = [],
  message = [],
  note,
  actions,
}: OverlayProps) => {
  return (
    <Backdrop>
      <Panel aria-labelledby="overlay-heading">
        <Heading id="overlay-heading">{heading}</Heading>
        {badge && <Badge>{badge}</Badge>}
        {stats.length > 0 && (
          <Stats>
            {stats.map(({ label, value }) => (
              <Stat key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </Stat>
            ))}
          </Stats>
        )}
        {message.map(line => (
          <Message key={line}>{line}</Message>
        ))}
        {note && <Note>{note}</Note>}
        <Actions>
          {/* Keyed by place: a label that changes (Link copied) keeps focus. */}
          {actions.map(({ label, onClick }, index) => (
            <Button key={index} onClick={onClick}>
              {label}
            </Button>
          ))}
        </Actions>
      </Panel>
    </Backdrop>
  );
};
