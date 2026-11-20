'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState, type ReactNode } from 'react';
import type { AppRouter } from '~/server/routers';

const trpc = createTRPCContext<AppRouter>();

/** Typed query and mutation options for every procedure. */
export const useTRPC = trpc.useTRPC;

export const TrpcProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // The board changes run by run, not second by second.
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  const [client] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: '/api/trpc' })],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.TRPCProvider trpcClient={client} queryClient={queryClient}>
        {children}
      </trpc.TRPCProvider>
    </QueryClientProvider>
  );
};
