'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  readFlashing,
  reducesFlashing,
  setFlashingReduced,
} from '~/game/flashing';
import type { BoardRow } from '~/organisms/BoardTable';
import type { PlayerCardProps, PlayerPlace } from '~/organisms/PlayerCard';
import { useTRPC } from '~/providers/TrpcProvider';
import { LeaderboardScreen } from '~/templates/LeaderboardScreen';
import { getSeed } from '~/utils/getSeed';
import { ordinal } from '~/utils/ordinal';
import { placePath, sharePlace, type ShareResult } from '~/utils/sharePlace';
import { boardError } from '../../../_components/boardErrors';
import { SavePendingRun } from '../../../_components/SavePendingRun';

export interface LeaderboardAppProps {
  /** The board as the server rendered it; null when it couldn't. */
  initialBoard: { rows: Array<BoardRow>; ranked: number } | null;
  /** A place someone shared, from `/leaderboard/<name>`. */
  shared: PlayerPlace | null;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const shareText = (place: PlayerPlace) =>
  place.rank === null
    ? `${place.name} on Bass Weapons`
    : `${place.name} is ${ordinal(place.rank)} on Bass Weapons`;

/** The board page: everyone's points, your place, and a shared one. */
export const LeaderboardApp = ({
  initialBoard,
  shared,
}: LeaderboardAppProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const board = useQuery({
    ...trpc.board.top.queryOptions(),
    initialData: initialBoard ?? undefined,
  });
  const me = useQuery(trpc.account.me.queryOptions());
  const signOut = useMutation(
    trpc.account.signOut.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.account.me.queryFilter()),
    }),
  );
  const [share, setShare] = useState<ShareResult>('idle');
  const backdrop = useRef<HTMLDivElement>(null);

  // A silent level drifts behind the board, held still when flashing is
  // reduced. Loaded after the page, so the board doesn't wait for it.
  useEffect(() => {
    const element = backdrop.current;
    if (!element) return;
    let detach: (() => void) | null = null;
    let gone = false;
    const reduced = reducesFlashing(
      readFlashing(),
      window.matchMedia(REDUCED_MOTION).matches,
    );
    setFlashingReduced(reduced);
    document.documentElement.dataset.flashing = reduced ? 'reduced' : 'full';
    // The backdrop and run domains only: the game's index brings Tone,
    // which would ask for an AudioContext this silent page never uses.
    void Promise.all([import('~/game/backdrop'), import('~/game/run')]).then(
      ([{ attachBackdrop }, { newRun }]) => {
        if (!gone) detach = attachBackdrop(element, newRun(getSeed('')));
      },
      // Left before the backdrop loaded: nothing to draw.
      () => {},
    );
    return () => {
      gone = true;
      detach?.();
    };
  }, []);

  const shareThis = async (place: PlayerPlace) => {
    const url = new URL(placePath(place.name), window.location.origin);
    setShare(await sharePlace(url.href, shareText(place)));
  };

  const mine = me.data ?? null;
  const viewingShared = shared !== null && shared.name !== mine?.name;
  const card = ((): PlayerCardProps => {
    if (viewingShared)
      return {
        kind: 'player',
        player: shared,
        isMe: false,
        share,
        onShare: () => void shareThis(shared),
      };
    if (me.isPending) return { kind: 'loading' };
    if (!mine) return { kind: 'signedOut' };
    return {
      kind: 'player',
      player: mine,
      isMe: true,
      bestRuns: mine.bestRuns,
      share,
      onShare: () => void shareThis(mine),
      onSignOut: () => signOut.mutate(),
    };
  })();

  return (
    <>
      <SavePendingRun />
      <LeaderboardScreen
        rows={board.data?.rows ?? []}
        ranked={board.data?.ranked ?? 0}
        isLoading={board.isPending}
        error={board.error ? boardError(board.error) : null}
        highlight={shared?.name ?? mine?.name ?? null}
        card={card}
        playHref="/"
        backdropRef={backdrop}
      />
    </>
  );
};
