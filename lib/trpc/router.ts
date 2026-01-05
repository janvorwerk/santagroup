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
        id: z.uuid(),
        name: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      return await poolService.updatePoolName(opts.input.id, opts.input.name);
    }),

  // Get pool with groups and persons (nested)
  poolGetFull: publicProcedure
    .input(z.uuid())
    .query(async (opts) => {
      return await poolService.getPoolFull(opts.input);
    }),

  // Get multiple pools with groups and persons (nested)
  poolGetFullMany: publicProcedure
    .input(z.array(z.uuid()))
    .query(async (opts) => {
      return await poolService.getPoolsFull(opts.input);
    }),

  // Create a new group for a pool
  groupCreate: publicProcedure
    .input(
      z.object({
        poolId: z.uuid(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.createGroup(opts.input.poolId);
    }),

  // Add person to a group
  personCreate: publicProcedure
    .input(
      z.object({
        groupId: z.number().int(),
        name: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      return await poolService.createPerson(opts.input.groupId, opts.input.name);
    }),

  // Move person between groups
  personUpdateGroup: publicProcedure
    .input(
      z.object({
        personId: z.uuid(),
        groupId: z.number().int(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.updatePersonGroup(opts.input.personId, opts.input.groupId);
    }),

  // Get person by ID with their assignment
  personGetById: publicProcedure
    .input(z.uuid())
    .query(async (opts) => {
      return await poolService.getPersonById(opts.input);
    }),

  // Execute drawing algorithm
  poolDraw: publicProcedure
    .input(z.uuid())
    .mutation(async (opts) => {
      return await poolService.drawPool(opts.input);
    }),

  // Delete a pool
  poolDelete: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.deletePool(opts.input.id);
    }),

  // Delete a group
  groupDelete: publicProcedure
    .input(
      z.object({
        id: z.number().int(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.deleteGroup(opts.input.id);
    }),

  // Delete a person
  personDelete: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
      })
    )
    .mutation(async (opts) => {
      return await poolService.deletePerson(opts.input.id);
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

