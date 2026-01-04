import { db } from '@/lib/db';
import { pool, group, player } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export interface PoolWithGroupsAndPlayers {
  id: string;
  name: string;
  createdAt: Date;
  groups: Array<{
    id: number;
    poolId: string | null;
    players: Array<{
      id: string;
      name: string;
      groupId: number;
      toId: string | null;
    }>;
  }>;
}

/**
 * Create a new pool
 */
export async function createPool(name: string) {
  const result = await db
    .insert(pool)
    .values({
      name,
    })
    .returning();
  return result[0];
}

/**
 * Update pool name
 */
export async function updatePoolName(id: string, name: string) {
  const result = await db
    .update(pool)
    .set({ name })
    .where(eq(pool.id, id))
    .returning();
  return result[0];
}

/**
 * Get pool with groups and players (nested)
 */
export async function getPoolFull(poolId: string): Promise<PoolWithGroupsAndPlayers | null> {
  const poolData = await db.select().from(pool).where(eq(pool.id, poolId)).limit(1);
  if (!poolData[0]) return null;

  const groups = await db.select().from(group).where(eq(group.poolId, poolId));

  // Get all players for groups in this pool using join
  const allPlayersForPool = await db
    .select({
      player: player,
      group: group,
    })
    .from(player)
    .innerJoin(group, eq(player.groupId, group.id))
    .where(eq(group.poolId, poolId));

  // Group players by groupId
  const playersByGroup = new Map<number, typeof player.$inferSelect[]>();
  for (const row of allPlayersForPool) {
    const groupId = row.player.groupId;
    if (!playersByGroup.has(groupId)) {
      playersByGroup.set(groupId, []);
    }
    playersByGroup.get(groupId)!.push(row.player);
  }

  return {
    ...poolData[0],
    groups: groups.map((g) => ({
      ...g,
      players: playersByGroup.get(g.id) || [],
    })),
  };
}

/**
 * Get multiple pools with groups and players (nested)
 */
export async function getPoolsFull(poolIds: string[]): Promise<PoolWithGroupsAndPlayers[]> {
  if (poolIds.length === 0) return [];

  const poolsData = await db.select().from(pool).where(inArray(pool.id, poolIds));
  if (poolsData.length === 0) return [];

  const poolIdsSet = new Set(poolsData.map((p) => p.id));

  const groups = await db.select().from(group).where(inArray(group.poolId, poolIds));

  // Get all players for groups in these pools using join
  const allPlayersForPools = await db
    .select({
      player: player,
      group: group,
    })
    .from(player)
    .innerJoin(group, eq(player.groupId, group.id))
    .where(inArray(group.poolId, poolIds));

  // Group players by groupId
  const playersByGroup = new Map<number, typeof player.$inferSelect[]>();
  for (const row of allPlayersForPools) {
    const groupId = row.player.groupId;
    if (!playersByGroup.has(groupId)) {
      playersByGroup.set(groupId, []);
    }
    playersByGroup.get(groupId)!.push(row.player);
  }

  // Group groups by poolId
  const groupsByPool = new Map<string, typeof groups>();
  for (const g of groups) {
    if (!g.poolId) continue;
    if (!groupsByPool.has(g.poolId)) {
      groupsByPool.set(g.poolId, []);
    }
    groupsByPool.get(g.poolId)!.push(g);
  }

  // Build result array maintaining order of input poolIds
  return poolsData.map((poolData) => ({
    ...poolData,
    groups: (groupsByPool.get(poolData.id) || []).map((g) => ({
      ...g,
      players: playersByGroup.get(g.id) || [],
    })),
  }));
}

/**
 * Create a new group for a pool
 */
export async function createGroup(poolId: string) {
  const result = await db
    .insert(group)
    .values({
      poolId,
    })
    .returning();
  return result[0];
}

/**
 * Add player to a group
 */
export async function createPlayer(groupId: number, name: string) {
  const result = await db
    .insert(player)
    .values({
      groupId,
      name,
    })
    .returning();
  return result[0];
}

/**
 * Move player between groups
 */
export async function updatePlayerGroup(playerId: string, groupId: number) {
  // FIXME: make sure the player can only be moved to a group in the same pool
  const result = await db
    .update(player)
    .set({ groupId })
    .where(eq(player.id, playerId))
    .returning();
  return result[0];
}

/**
 * Get player by ID with their assignment
 */
export async function getPlayerById(playerId: string) {
  const playerData = await db.select().from(player).where(eq(player.id, playerId)).limit(1);
  if (!playerData[0]) return null;

  const assignedTo =
    playerData[0].toId
      ? await db.select().from(player).where(eq(player.id, playerData[0].toId)).limit(1)
      : null;

  return {
    ...playerData[0],
    assignedTo: assignedTo?.[0] || null,
  };
}

/**
 * Execute drawing algorithm
 */
export async function drawPool(poolId: string) {
  // Get all players in the pool
  const allPlayersForPool = await db
    .select({
      player: player,
    })
    .from(player)
    .innerJoin(group, eq(player.groupId, group.id))
    .where(eq(group.poolId, poolId));

  const players = allPlayersForPool.map((row) => row.player);

  if (players.length < 2) {
    throw new Error('Need at least 2 players to draw');
  }

  // Group players by groupId
  const playersByGroup = new Map<number, typeof players>();
  for (const p of players) {
    if (!playersByGroup.has(p.groupId)) {
      playersByGroup.set(p.groupId, []);
    }
    playersByGroup.get(p.groupId)!.push(p);
  }

  // Build valid targets for each player (exclude same group)
  const validTargets = new Map<string, typeof players>();
  for (const p of players) {
    const targets = players.filter((target) => target.groupId !== p.groupId);
    validTargets.set(p.id, targets);
  }

  // Drawing algorithm: ensure one-to-one matching with constraints
  const assignments = new Map<string, string>(); // playerId -> toId
  const used = new Set<string>(); // toIds that have been assigned

  // Try to assign each player
  const unassigned = [...players];
  let attempts = 0;
  const maxAttempts = 1000;

  while (unassigned.length > 0 && attempts < maxAttempts) {
    attempts++;
    const currentPlayer = unassigned[0];
    const targets = validTargets.get(currentPlayer.id) || [];
    const availableTargets = targets.filter((t) => !used.has(t.id) && t.id !== currentPlayer.id);

    if (availableTargets.length === 0) {
      // No valid targets, need to backtrack or retry
      // Reset and try again
      assignments.clear();
      used.clear();
      unassigned.length = 0;
      unassigned.push(...players);
      continue;
    }

    // Randomly select from available targets
    const randomIndex = Math.floor(Math.random() * availableTargets.length);
    const selectedTarget = availableTargets[randomIndex];

    assignments.set(currentPlayer.id, selectedTarget.id);
    used.add(selectedTarget.id);
    unassigned.shift();
  }

  if (unassigned.length > 0) {
    throw new Error('Could not find valid assignments. Try adjusting groups.');
  }

  // Update database with assignments
  for (const [playerId, toId] of assignments.entries()) {
    await db.update(player).set({ toId }).where(eq(player.id, playerId));
  }

  return { success: true, assignments: Object.fromEntries(assignments) };
}

