import { useEffect, useState } from 'react';
import { Button } from '~/atoms/Button';
import { formatNumber } from '~/utils/formatNumber';
import { Icon } from '~/atoms/Icon';
import { SHARE_ICON } from '~/game/icons';
import type { RunOutcome } from '~/game/sim';
import {
  EnterForm,
  RecoverForm,
  signOutLabel,
  type RecoverState,
  type SignInState,
  type SignOutState,
} from '~/organisms/EnterForm';
import type { ShareState } from '~/organisms/RunStanding';
import { ordinal } from '~/utils/ordinal';
import { Actions } from './components/Actions';
import { Body } from './components/Body';
import { Card } from './components/Card';
import { Rank } from './components/Rank';
import { RecoveryCode, type RecoveryState } from './components/RecoveryCode';
import { Runs } from './components/Runs';
import { Totals } from './components/Totals';

export type { RecoveryState } from './components/RecoveryCode';

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
  | ({
      kind: 'signedOut';
      recover: RecoverState;
      /** Open on the recovery form: the page was linked to it. */
      recovering?: boolean;
    } & SignInState)
  | {
      kind: 'player';
      player: PlayerPlace;
      /** Your own place: lit, with your runs and a sign-out. */
      isMe: boolean;
      bestRuns?: Array<BestRun>;
      share: ShareState;
      onShare: () => void;
      signOut?: SignOutState;
      /** Your own recovery code; only on your own card. */
      recovery?: RecoveryState;
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
  if (props.kind === 'signedOut') return <SignedOut {...props} />;
  const {
    player,
    isMe,
    bestRuns = [],
    share,
    onShare,
    signOut,
    recovery,
  } = props;
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
      {isMe && recovery && <RecoveryCode {...recovery} />}
    </Card>
  );
};

/** Signing in, or getting back in with a recovery code. */
const SignedOut = ({
  recover,
  recovering = false,
  isEntering,
  error,
  onEnter,
}: Extract<PlayerCardProps, { kind: 'signedOut' }>) => {
  const [mode, setMode] = useState<'enter' | 'recover'>(
    recovering ? 'recover' : 'enter',
  );
  // A page that learns it was linked to the recovery form once it's up.
  useEffect(() => {
    if (recovering) setMode('recover');
  }, [recovering]);
  return (
    <Card aria-labelledby="place-heading">
      <h2 id="place-heading">
        {mode === 'recover' ? 'Reset your password' : 'Your place'}
      </h2>
      {mode === 'recover' ? (
        <>
          <p>
            Enter your name and the recovery code you kept, and pick a new
            password. It signs you out everywhere else.
          </p>
          <RecoverForm {...recover} onCancel={() => setMode('enter')} />
        </>
      ) : (
        <>
          <p>
            Your best run is your place on the board. Sign in, or pick a name
            and a password, and every run you finish counts.
          </p>
          <EnterForm
            submitLabel="Sign in"
            submittingLabel="Signing in…"
            isSubmitting={isEntering}
            error={error}
            onSubmit={onEnter}
            forgot={{ onClick: () => setMode('recover') }}
          />
        </>
      )}
    </Card>
  );
};
