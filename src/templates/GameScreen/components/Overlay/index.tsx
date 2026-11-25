import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from '~/atoms/Button';
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

export interface OverlayAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
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
  /** The first is the main way on; others can step back as `secondary`. */
  actions: Array<OverlayAction>;
  /** More under the note, like where the run puts you on the board. */
  children?: ReactNode;
  /**
   * Focus the first action on mount, for a panel the player opened. Not for
   * one that appears mid-fight: Space dashes, and would press it.
   */
  focusFirst?: boolean;
}

/** A panel over the frozen stage: a run that ended, or a level cleared. */
export const Overlay = ({
  heading,
  badge,
  stats = [],
  message = [],
  note,
  actions,
  children,
  focusFirst = false,
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
        {children}
        <Actions>
          {/* Keyed by place: a label that changes (Link copied) keeps focus. */}
          {actions.map(({ label, onClick, variant }, index) => (
            <Button
              key={index}
              $variant={variant}
              onClick={onClick}
              autoFocus={focusFirst && index === 0}
            >
              {label}
            </Button>
          ))}
        </Actions>
      </Panel>
    </Backdrop>
  );
};
