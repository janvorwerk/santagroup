import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './router';

// Pass AppRouter as generic here. This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: typeof window !== 'undefined' ? '/api/trpc' : 'http://localhost:3000/api/trpc',
    }),
  ],
});

