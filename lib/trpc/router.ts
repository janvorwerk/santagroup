import { z } from 'zod';
import { db } from '@/lib/db';
import { pool } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { router, publicProcedure } from './init';

export const appRouter = router({
  // Example query procedure - get all pools
  poolList: publicProcedure.query(async () => {
    const pools = await db.select().from(pool);
    return pools;
  }),

  // Example query procedure - get pool by id
  poolById: publicProcedure
    .input(z.string().uuid())
    .query(async (opts) => {
      const { input } = opts;
      const result = await db.select().from(pool).where(eq(pool.id, input)).limit(1);
      return result[0] ?? null;
    }),

  // Example mutation procedure - create a pool
  poolCreate: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        admin: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;
      const result = await db
        .insert(pool)
        .values({
          name: input.name,
          admin: input.admin,
        })
        .returning();
      return result[0];
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

