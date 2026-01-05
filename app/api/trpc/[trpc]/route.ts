/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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

