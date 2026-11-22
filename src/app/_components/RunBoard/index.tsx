'use client';

import { useEffect, useState } from 'react';
import { RunStanding, type Standing } from '~/organisms/RunStanding';
import { ordinal } from '~/utils/ordinal';
import {
  dropPendingRun,
  keepPendingRun,
  type PendingRun,
} from '~/utils/pendingRun';
import { placePath, sharePlace, type ShareResult } from '~/utils/sharePlace';
import { boardError, isRefusal } from '../boardErrors';
import { useAccount } from '../useAccount';
import { useSaveRun } from '../useSaveRun';

export interface RunBoardProps {
  /** The finished run; null when it has no ticket to save it with. */
  run: PendingRun | null;
}

const BOARD_HREF = '/leaderboard';

/**
 * A finished run's way onto the board: saved straight away when you're
 * signed in, or after a name and password when you're not.
 */
export const RunBoard = ({ run }: RunBoardProps) => {
  const { me, signIn } = useAccount();
  const [skipped, setSkipped] = useState(false);
  const [share, setShare] = useState<ShareResult>('idle');

  const submit = useSaveRun(run);

  // Held on the device until it's saved or skipped, so a lost connection
  // or a closed tab doesn't lose it.
  useEffect(() => {
    if (run) keepPendingRun(run);
  }, [run]);

  const signedIn = Boolean(me.data);

  const skip = () => {
    if (run) dropPendingRun(run.ticket);
    setSkipped(true);
  };

  const standing = ((): Standing => {
    if (!run)
      return {
        kind: 'rejected',
        message:
          "The board couldn't be reached when this run started, so it can't be saved.",
      };
    if (skipped) return { kind: 'skipped' };
    if (submit.data) {
      const saved = submit.data;
      return {
        kind: 'saved',
        name: saved.name,
        score: saved.score,
        before: saved.before,
        after: saved.after,
        rows: saved.rows,
        share,
        onShare: async () => {
          const url = new URL(placePath(saved.name), window.location.origin);
          const rank = saved.after.rank ? ordinal(saved.after.rank) : '';
          setShare(
            await sharePlace(
              url.href,
              `${saved.name} is ${rank} on Bass Weapons`,
            ),
          );
        },
      };
    }
    if (submit.error)
      return isRefusal(submit.error)
        ? { kind: 'rejected', message: boardError(submit.error) }
        : {
            kind: 'failed',
            message: boardError(submit.error),
            onRetry: () => submit.mutate(run),
          };
    if (submit.isPending || me.isPending || signedIn) return { kind: 'saving' };
    if (me.error)
      return {
        kind: 'failed',
        message: boardError(me.error),
        onRetry: () => void me.refetch(),
      };
    // Nothing scored and no account: no reason to make one now.
    if (run.score === 0) return { kind: 'skipped' };
    return {
      kind: 'signedOut',
      score: run.score,
      // Signed in, useSaveRun sends the run by itself.
      isSubmitting: signIn.isEntering,
      error: signIn.error,
      onEnter: signIn.onEnter,
      onSkip: skip,
    };
  })();

  return <RunStanding standing={standing} boardHref={BOARD_HREF} />;
};
