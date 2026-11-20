import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTRPC } from '~/providers/TrpcProvider';
import { dropPendingRun, type PendingRun } from '~/utils/pendingRun';
import { settle } from './settle';

/**
 * Saves runs to the board: `run` straight away once you're signed in, and
 * any other run passed to `mutate`. Settles the run kept on this device.
 */
export const useSaveRun = (run: PendingRun | null) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const me = useQuery(trpc.account.me.queryOptions());
  const submit = useMutation(
    trpc.runs.submit.mutationOptions({
      onSettled: (_, error, saved) => {
        const { drop, refresh } = settle(error);
        if (drop) dropPendingRun(saved.ticket);
        if (refresh) {
          void queryClient.invalidateQueries(trpc.account.me.queryFilter());
          void queryClient.invalidateQueries(trpc.board.top.queryFilter());
        }
      },
    }),
  );

  const signedIn = Boolean(me.data);
  useEffect(() => {
    if (run && signedIn && submit.isIdle) submit.mutate(run);
  }, [run, signedIn, submit]);

  return submit;
};
