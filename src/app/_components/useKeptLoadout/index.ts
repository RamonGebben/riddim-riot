import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { sameRecipe, type WeaponRecipe } from '~/game';
import { useTRPC } from '~/providers/TrpcProvider';
import {
  keepLoadout,
  readKeptLoadout,
  type KeptLoadout,
} from '~/utils/keptLoadout';

const sameLoadout = (a: Array<WeaponRecipe>, b: Array<WeaponRecipe>) =>
  a.length === b.length && a.every((recipe, i) => sameRecipe(recipe, b[i]));

export type KeptStatus = 'guest' | 'saving' | 'saved' | 'failed';

/**
 * The loadout a fresh run starts with: the newer of the one kept on this
 * device and the one on the player's account, or null (the seed's
 * starter). Every choice is kept on the device, so a guest keeps theirs
 * between visits; signed in, it's saved to the account too, and a device
 * choice newer than the account's goes up as soon as they sign in.
 */
export const useKeptLoadout = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const me = useQuery(trpc.account.me.queryOptions());
  const signedIn = Boolean(me.data);
  const onAccount = useQuery({
    ...trpc.loadout.mine.queryOptions(),
    enabled: signedIn,
  });
  const save = useMutation(
    trpc.loadout.save.mutationOptions({
      onSuccess: saved =>
        queryClient.setQueryData(trpc.loadout.mine.queryKey(), saved),
    }),
  );
  const [onDevice, setOnDevice] = useState<KeptLoadout | null>(() =>
    readKeptLoadout(),
  );
  /** The last choice sent, so a failed save isn't retried every render. */
  const sent = useRef<KeptLoadout | null>(null);

  const account = signedIn ? (onAccount.data ?? null) : null;
  const newest =
    account && (!onDevice || account.savedAt >= onDevice.savedAt)
      ? account
      : onDevice;

  const { mutate } = save;
  useEffect(() => {
    if (!signedIn || !onAccount.isSuccess || !onDevice) return;
    if (onDevice === sent.current || newest !== onDevice) return;
    if (account && sameLoadout(onDevice.recipes, account.recipes)) return;
    sent.current = onDevice;
    mutate({ recipes: onDevice.recipes });
  }, [signedIn, onAccount.isSuccess, onDevice, newest, account, mutate]);

  const status = ((): KeptStatus => {
    if (!signedIn) return 'guest';
    if (save.isPending) return 'saving';
    return save.isError ? 'failed' : 'saved';
  })();

  return {
    recipes: newest?.recipes ?? null,
    /** The player's account name, when there's one to keep it on. */
    name: me.data?.name ?? null,
    status,
    keep: (recipes: Array<WeaponRecipe>) => {
      const kept = { recipes, savedAt: Date.now() };
      keepLoadout(kept);
      setOnDevice(kept);
      // Sent now, not left to the effect: it compares this device's clock
      // with the server's, and a server running ahead would hold it back.
      if (signedIn) {
        sent.current = kept;
        mutate({ recipes });
      }
    },
  };
};
