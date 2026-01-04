import { z } from 'zod';
import { router, publicProcedure } from './init';
import * as poolService from '@/lib/server/pool';

export const appRouter = router({
  // Create a new pool
  poolCreate: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      return await poolService.createPool(opts.input.name);
    }),

  // Update pool name
  poolUpdateName: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      return await poolService.updatePoolName(opts.input.id, opts.input.name);
    }),

  // Get pool with groups and players (nested)
  poolGetFull: publicProcedure
    .input(z.string().uuid())
    .query(async (opts) => {
      return await poolService.getPoolFull(opts.input);
    }),

  // Get multiple pools with groups and players (nested)
  poolGetFullMany: publicProcedure
    .input(z.array(z.string().uuid()))
    .query(async (opts) => {
      return await poolService.getPoolsFull(opts.input);
    }),

  // Create a new group for a pool
  groupCreate: publicProcedure
    .input(
      z.object({
        poolId: z.string().uuid(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.createGroup(opts.input.poolId);
    }),

  // Add player to a group
  playerCreate: publicProcedure
    .input(
      z.object({
        groupId: z.number().int(),
        name: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      return await poolService.createPlayer(opts.input.groupId, opts.input.name);
    }),

  // Move player between groups
  playerUpdateGroup: publicProcedure
    .input(
      z.object({
        playerId: z.string().uuid(),
        groupId: z.number().int(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.updatePlayerGroup(opts.input.playerId, opts.input.groupId);
    }),

  // Get player by ID with their assignment
  playerGetById: publicProcedure
    .input(z.string().uuid())
    .query(async (opts) => {
      return await poolService.getPlayerById(opts.input);
    }),

  // Execute drawing algorithm
  poolDraw: publicProcedure
    .input(z.string().uuid())
    .mutation(async (opts) => {
      return await poolService.drawPool(opts.input);
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

