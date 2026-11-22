import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/providers/TrpcProvider';

/**
 * Who's signed in, and signing in or out from anywhere: the start page,
 * the board, or a run's end. Either way the account's own data (its kept
 * loadout) is dropped, so nothing of the last player's lingers.
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
  const signOut = useMutation(
    trpc.account.signOut.mutationOptions({ onSuccess: changed }),
  );
  return { me, enter, signOut };
};
