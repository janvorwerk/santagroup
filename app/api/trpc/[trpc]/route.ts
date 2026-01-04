import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/router';
import { TRPCError } from '@trpc/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
    onError: ({ path, error, type, input }) => {
      console.error(`[tRPC] ${type.toUpperCase()} ${path || 'unknown'} - ERROR`, {
        error: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack,
        input,
      });
    },
  });

export { handler as GET, handler as POST };

