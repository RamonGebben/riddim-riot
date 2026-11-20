'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTRPC } from '~/providers/TrpcProvider';
import { dropPendingRun, readPendingRun } from '~/utils/pendingRun';
import { isRefusal } from '../boardErrors';

/**
 * Saves a run left on this device (the board was out of reach when it
 * ended) once you're signed in. Renders nothing.
 */
export const SavePendingRun = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const me = useQuery(trpc.account.me.queryOptions());
  const [pending] = useState(readPendingRun);
  const submit = useMutation(
    trpc.runs.submit.mutationOptions({
      onSettled: (_, error) => {
        if (!pending) return;
        if (!error || isRefusal(error)) dropPendingRun(pending.ticket);
        if (!error) {
          void queryClient.invalidateQueries(trpc.account.me.queryFilter());
          void queryClient.invalidateQueries(trpc.board.top.queryFilter());
        }
      },
    }),
  );
  const signedIn = Boolean(me.data);
  useEffect(() => {
    if (pending && signedIn && submit.isIdle) submit.mutate(pending);
  }, [pending, signedIn, submit]);
  return null;
};
