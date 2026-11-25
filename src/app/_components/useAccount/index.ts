import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type {
  RecoverState,
  SignInState,
  SignOutState,
} from '~/organisms/EnterForm';
import type { RecoveryState } from '~/organisms/PlayerCard';
import { useTRPC } from '~/providers/TrpcProvider';
import { boardError } from '../boardErrors';

/**
 * Who's signed in, and signing in or out from anywhere: the start page,
 * the board, or a run's end. Either way the cached account data (its kept
 * loadout) is dropped. The loadout kept on the device stays, so it's the
 * one a guest plays with after signing out, and it goes up to the next
 * account to sign in here if it's newer than that account's.
 */
export const useAccount = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const me = useQuery(trpc.account.me.queryOptions());
  const changed = async () => {
    queryClient.removeQueries(trpc.loadout.mine.queryFilter());
    await queryClient.invalidateQueries(trpc.account.me.queryFilter());
  };
  const enter = useMutation(
    trpc.account.enter.mutationOptions({ onSuccess: changed }),
  );
  /** A recovery code just made, shown once: only its hash is kept. */
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const leave = useMutation(
    trpc.account.signOut.mutationOptions({
      onSuccess: async () => {
        setFreshCode(null);
        await changed();
      },
    }),
  );
  const recovering = useMutation(
    trpc.account.recover.mutationOptions({
      onSuccess: async ({ code }) => {
        setFreshCode(code);
        await changed();
      },
    }),
  );
  const issuing = useMutation(
    trpc.account.newRecoveryCode.mutationOptions({
      onSuccess: async ({ code }) => {
        setFreshCode(code);
        await queryClient.invalidateQueries(trpc.account.me.queryFilter());
      },
    }),
  );
  const signIn: SignInState = {
    isEntering: enter.isPending,
    error: enter.error ? boardError(enter.error) : null,
    onEnter: credentials => enter.mutate(credentials),
  };
  const signOut: SignOutState = {
    isSigningOut: leave.isPending,
    signOutFailed: leave.isError,
    onSignOut: () => leave.mutate(),
  };
  const recover: RecoverState = {
    isRecovering: recovering.isPending,
    error: recovering.error ? boardError(recovering.error) : null,
    onRecover: recovery => recovering.mutate(recovery),
  };
  const recovery: RecoveryState = {
    hasRecovery: me.data?.hasRecovery ?? false,
    freshCode,
    isIssuing: issuing.isPending,
    error: issuing.error ? boardError(issuing.error) : null,
    onIssue: () => issuing.mutate(),
  };
  return { me, enter, signIn, signOut, recover, recovery };
};
