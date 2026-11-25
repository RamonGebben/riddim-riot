import { Button } from '~/atoms/Button';
import { formatNumber } from '~/utils/formatNumber';
import { Icon } from '~/atoms/Icon';
import { SHARE_ICON } from '~/game/icons';
import type { RunOutcome } from '~/game/sim';
import {
  EnterForm,
  signOutLabel,
  type SignInState,
  type SignOutState,
} from '~/organisms/EnterForm';
import type { ShareState } from '~/organisms/RunStanding';
import { ordinal } from '~/utils/ordinal';
import { Actions } from './components/Actions';
import { Body } from './components/Body';
import { Card } from './components/Card';
import { Rank } from './components/Rank';
import { Runs } from './components/Runs';
import { Totals } from './components/Totals';

export interface BestRun {
  score: number;
  level: number;
  outcome: RunOutcome;
}

export interface PlayerPlace {
  name: string;
  rank: number | null;
  runsCount: number;
  bestScore: number;
}

export type PlayerCardProps =
  | { kind: 'loading' }
  | ({ kind: 'signedOut' } & SignInState)
  | {
      kind: 'player';
      player: PlayerPlace;
      /** Your own place: lit, with your runs and a sign-out. */
      isMe: boolean;
      bestRuns?: Array<BestRun>;
      share: ShareState;
      onShare: () => void;
      signOut?: SignOutState;
    };

const SHARE_LABELS = {
  idle: 'Share this place',
  shared: 'Shared',
  copied: 'Link copied',
  failed: "Couldn't share the link",
} satisfies Record<ShareState, string>;

/** One player's place beside the board: yours, or one shared with you. */
export const PlayerCard = (props: PlayerCardProps) => {
  if (props.kind === 'loading')
    return (
      <Card aria-busy="true" aria-label="Your place">
        <h2>Your place</h2>
        <p>&nbsp;</p>
      </Card>
    );
  if (props.kind === 'signedOut')
    return (
      <Card aria-labelledby="place-heading">
        <h2 id="place-heading">Your place</h2>
        <p>
          Your best run is your place on the board. Sign in, or pick a name and
          a password, and every run you finish counts.
        </p>
        <EnterForm
          submitLabel="Sign in"
          submittingLabel="Signing in…"
          isSubmitting={props.isEntering}
          error={props.error}
          onSubmit={props.onEnter}
        />
      </Card>
    );
  const { player, isMe, bestRuns = [], share, onShare, signOut } = props;
  return (
    <Card aria-labelledby="place-heading">
      <h2 id="place-heading">{isMe ? 'Your place' : 'Shared place'}</h2>
      <Body>
        <Rank $mine={isMe}>
          <strong>{player.rank === null ? 'NEW' : ordinal(player.rank)}</strong>
          <span>{player.name}</span>
        </Rank>
        <Totals>
          <div>
            <dt>Runs</dt>
            <dd>{formatNumber(player.runsCount)}</dd>
          </div>
          <div>
            <dt>Best run</dt>
            <dd>{formatNumber(player.bestScore)}</dd>
          </div>
        </Totals>
        <Actions>
          {player.rank !== null && (
            <Button $variant="quiet" onClick={onShare}>
              <Icon icon={SHARE_ICON} />
              {isMe && share === 'idle'
                ? 'Share my place'
                : SHARE_LABELS[share]}
            </Button>
          )}
          {signOut && (
            <Button
              $variant="quiet"
              onClick={signOut.onSignOut}
              disabled={signOut.isSigningOut}
            >
              {signOutLabel(signOut)}
            </Button>
          )}
        </Actions>
      </Body>
      {player.rank === null && <p>No points yet: the next run counts.</p>}
      {isMe && bestRuns.length > 0 && (
        <>
          <h2 id="runs-heading">Best runs</h2>
          <Runs aria-labelledby="runs-heading">
            {bestRuns.map((run, index) => (
              <li key={index}>
                <span>{index + 1}</span>
                <span>{formatNumber(run.score)}</span>
                <span>
                  {run.outcome === 'won' ? 'won' : `level ${run.level}`}
                </span>
              </li>
            ))}
          </Runs>
        </>
      )}
    </Card>
  );
};
