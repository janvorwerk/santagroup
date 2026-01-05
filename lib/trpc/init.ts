/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { initTRPC, TRPCError } from '@trpc/server';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

/**
 * Logging middleware to log all tRPC calls
 */
const loggingMiddleware = t.middleware(async (opts) => {
  const start = Date.now();
  const { path, type, input } = opts;
  
  console.log(`[tRPC] ${type.toUpperCase()} ${path}`, {
    input,
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await opts.next();
    const duration = Date.now() - start;
    console.log(`[tRPC] ${type.toUpperCase()} ${path} - SUCCESS`, {
      duration: `${duration}ms`,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    // Check if it's a TRPCError (which will be handled by onError callback)
    // but still log it here for visibility
    if (error instanceof TRPCError) {
      console.error(`[tRPC] ${type.toUpperCase()} ${path} - ERROR`, {
        error: error.message,
        code: error.code,
        cause: error.cause,
        stack: error.stack,
        duration: `${duration}ms`,
      });
    } else {
      console.error(`[tRPC] ${type.toUpperCase()} ${path} - ERROR`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });
    }
    throw error;
  }
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);

