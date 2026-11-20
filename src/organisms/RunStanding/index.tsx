import { Button } from '~/atoms/Button';
import { formatNumber } from '~/utils/formatNumber';
import { Icon } from '~/atoms/Icon';
import { TextLink } from '~/atoms/TextLink';
import { CLIMB_ICON, SHARE_ICON } from '~/game/icons';
import { BoardTable, type BoardRow } from '~/organisms/BoardTable';
import { EnterForm } from '~/organisms/EnterForm';
import { ordinal } from '~/utils/ordinal';
import type { ShareResult } from '~/utils/sharePlace';
import { Climb } from './components/Climb';
import { Lead } from './components/Lead';
import { Links } from './components/Links';
import { Section } from './components/Section';
import { Status } from './components/Status';
import { Tally } from './components/Tally';

export interface Place {
  rank: number | null;
  total: number;
}

export type ShareState = ShareResult;

export type Standing =
  | {
      kind: 'signedOut';
      score: number;
      isSubmitting: boolean;
      error: string | null;
      onEnter: (credentials: { name: string; password: string }) => void;
      onSkip: () => void;
    }
  | { kind: 'saving' }
  | {
      kind: 'saved';
      name: string;
      score: number;
      before: Place;
      after: Place;
      rows: Array<BoardRow>;
      share: ShareState;
      onShare: () => void;
    }
  /** Didn't reach the board; the run waits on this device. */
  | { kind: 'failed'; message: string; onRetry: () => void }
  /** The board refused the run; there's nothing to retry. */
  | { kind: 'rejected'; message: string }
  | { kind: 'skipped' };

export interface RunStandingProps {
  standing: Standing;
  boardHref: string;
}

const SHARE_LABELS = {
  idle: 'Share my place',
  shared: 'Shared',
  copied: 'Link copied',
  failed: "Couldn't share the link",
} satisfies Record<ShareState, string>;

/** What the run did to your place, in a few words. */
const climbed = (before: Place, after: Place) => {
  if (after.rank === null) return null;
  if (before.rank === null) return `On the board at ${ordinal(after.rank)}`;
  const places = before.rank - after.rank;
  if (places <= 0) return null;
  return `Up ${places} ${places === 1 ? 'place' : 'places'}`;
};

/** Where a finished run puts you on the board, or how to get on it. */
export const RunStanding = ({ standing, boardHref }: RunStandingProps) => {
  if (standing.kind === 'skipped') return null;
  return (
    <Section aria-label="High scores">
      {standing.kind === 'signedOut' && (
        <>
          <Lead>
            Save {formatNumber(standing.score)} points to the high scores?
          </Lead>
          <EnterForm
            submitLabel="Save to the board"
            isSubmitting={standing.isSubmitting}
            error={standing.error}
            onSubmit={standing.onEnter}
            onSkip={standing.onSkip}
          />
        </>
      )}
      {standing.kind === 'saving' && (
        <Status role="status">Saving to the board…</Status>
      )}
      {standing.kind === 'failed' && (
        <>
          <Status role="alert" $error>
            {standing.message}
          </Status>
          <Status>The run is kept on this device until it saves.</Status>
          <Button $variant="quiet" onClick={standing.onRetry}>
            Try saving again
          </Button>
        </>
      )}
      {standing.kind === 'rejected' && (
        <Status role="alert" $error>
          {standing.message}
        </Status>
      )}
      {standing.kind === 'saved' && (
        <SavedPlace standing={standing} boardHref={boardHref} />
      )}
    </Section>
  );
};

const SavedPlace = ({
  standing,
  boardHref,
}: {
  standing: Extract<Standing, { kind: 'saved' }>;
  boardHref: string;
}) => {
  const climb = climbed(standing.before, standing.after);
  return (
    <>
      <Tally>
        <div>
          <dt>Run</dt>
          <dd>+{formatNumber(standing.score)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatNumber(standing.after.total)}</dd>
        </div>
        <div>
          <dt>Rank</dt>
          <dd>
            {standing.after.rank === null ? '-' : ordinal(standing.after.rank)}
          </dd>
        </div>
      </Tally>
      {climb && (
        <Climb role="status">
          <Icon icon={CLIMB_ICON} />
          {climb}
        </Climb>
      )}
      {standing.rows.length > 0 && (
        <BoardTable
          rows={standing.rows}
          highlight={standing.name}
          fresh={climb !== null}
          compact
        />
      )}
      <Links>
        {standing.after.rank !== null && (
          <Button $variant="quiet" onClick={standing.onShare}>
            <Icon icon={SHARE_ICON} />
            {SHARE_LABELS[standing.share]}
          </Button>
        )}
        <TextLink href={boardHref}>Full board</TextLink>
      </Links>
    </>
  );
};
