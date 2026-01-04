import { db } from "@/lib/db";
import { pool, group, player } from "@/lib/db/schema";
import { eq, inArray, sql, and, desc } from "drizzle-orm";

type GroupWithPlayers = {
  id: number;
  poolId: string | null;
  players: Array<{
    id: string;
    name: string;
    groupId: number;
    toId: string | null;
  }>;
};

export interface PoolWithGroupsAndPlayers {
  id: string;
  name: string;
  createdAt: Date;
  groups: GroupWithPlayers[];
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
  const result = await db.update(pool).set({ name }).where(eq(pool.id, id)).returning();
  return result[0];
}

/**
 * Get pool with groups and players (nested)
 */
export async function getPoolFull(poolId: string): Promise<PoolWithGroupsAndPlayers | null> {
  // CTE: Players aggregated by group
  const playersByGroup = db
    .select({
      groupId: player.groupId,
      players: sql<GroupWithPlayers["players"]>`
        json_agg(
          jsonb_build_object(
            'id', ${player.id},
            'name', ${player.name},
            'groupId', ${player.groupId},
            'toId', ${player.toId}
          )
        order by ${player.name}
        )
      `.as("players"),
    })
    .from(player)
    .groupBy(player.groupId)
    .as("players_by_group");

  // CTE: Groups with their players
  const groupsWithPlayers = db
    .select({
      id: group.id,
      poolId: group.poolId,
      players: sql<GroupWithPlayers["players"]>`
        COALESCE(${playersByGroup.players}, '[]'::json)
      `.as("players"),
    })
    .from(group)
    .leftJoin(playersByGroup, eq(group.id, playersByGroup.groupId))
    .where(eq(group.poolId, poolId))
    .as("groups_with_players");

  // CTE: Groups aggregated by pool
  const groupsByPool = db
    .select({
      poolId: groupsWithPlayers.poolId,
      groups: sql<GroupWithPlayers[]>`
        json_agg(
          jsonb_build_object(
            'id', ${groupsWithPlayers.id},
            'poolId', ${groupsWithPlayers.poolId},
            'players', ${groupsWithPlayers.players}
          )
          order by ${groupsWithPlayers.id}
        )
      `.as("groups"),
    })
    .from(groupsWithPlayers)
    .groupBy(groupsWithPlayers.poolId)
    .as("groups_by_pool");

  // Main query: pool with aggregated groups
  const result = await db
    .select({
      id: pool.id,
      name: pool.name,
      createdAt: pool.createdAt,
      groups: sql<GroupWithPlayers[]>`
        COALESCE(${groupsByPool.groups}, '[]'::json)
      `.as("groups"),
    })
    .from(pool)
    .leftJoin(groupsByPool, eq(pool.id, groupsByPool.poolId))
    .where(eq(pool.id, poolId))
    .limit(1);

  if (!result[0]) return null;

  return {
    id: result[0].id,
    name: result[0].name,
    createdAt: result[0].createdAt,
    groups: (result[0].groups || []) as GroupWithPlayers[],
  };
}

/**
 * Get multiple pools with groups and players (nested)
 */
export async function getPoolsFull(poolIds: string[]): Promise<PoolWithGroupsAndPlayers[]> {
  if (poolIds.length === 0) return [];

  // CTE: Players aggregated by group
  const playersByGroup = db
    .select({
      groupId: player.groupId,
      players: sql<GroupWithPlayers["players"]>`
        json_agg(
          jsonb_build_object(
            'id', ${player.id},
            'name', ${player.name},
            'groupId', ${player.groupId},
            'toId', ${player.toId}
          )
        order by ${player.name}
        )
      `.as("players"),
    })
    .from(player)
    .groupBy(player.groupId)
    .as("players_by_group");

  // CTE: Groups with their players
  const groupsWithPlayers = db
    .select({
      id: group.id,
      poolId: group.poolId,
      players: sql<GroupWithPlayers["players"]>`
        COALESCE(${playersByGroup.players}, '[]'::json)
      `.as("players"),
    })
    .from(group)
    .leftJoin(playersByGroup, eq(group.id, playersByGroup.groupId))
    .as("groups_with_players");

  // CTE: Groups aggregated by pool
  const groupsByPool = db
    .select({
      poolId: groupsWithPlayers.poolId,
      groups: sql<GroupWithPlayers[]>`
        json_agg(
          jsonb_build_object(
            'id', ${groupsWithPlayers.id},
            'poolId', ${groupsWithPlayers.poolId},
            'players', ${groupsWithPlayers.players}
          )
          order by ${groupsWithPlayers.id}
        )
      `.as("groups"),
    })
    .from(groupsWithPlayers)
    .groupBy(groupsWithPlayers.poolId)
    .as("groups_by_pool");

  // Main query: pools with aggregated groups
  const result = await db
    .select({
      id: pool.id,
      name: pool.name,
      createdAt: pool.createdAt,
      groups: sql<GroupWithPlayers[]>`
        COALESCE(${groupsByPool.groups}, '[]'::json)
      `.as("groups"),
    })
    .from(pool)
    .leftJoin(groupsByPool, eq(pool.id, groupsByPool.poolId))
    .where(inArray(pool.id, poolIds))
    .orderBy(desc(pool.createdAt));

  return result.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    groups: (row.groups || []) as GroupWithPlayers[],
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
  // Build scalar subqueries using Drizzle - select the column directly
  const currentGroupPool = sql`
    (SELECT ${group.poolId}
     FROM ${group}
     INNER JOIN ${player} ON ${group.id} = ${player.groupId}
     WHERE ${player.id} = ${playerId}
     LIMIT 1)
  `;

  const targetGroupPool = sql`
    (SELECT ${group.poolId}
     FROM ${group}
     WHERE ${group.id} = ${groupId}
     LIMIT 1)
  `;

  // Update only if both groups are in the same pool
  const result = await db
    .update(player)
    .set({ groupId })
    .where(and(eq(player.id, playerId), sql`${currentGroupPool} = ${targetGroupPool}`))
    .returning();

  return result[0];
}

/**
 * Get player by ID with their assignment
 */
export async function getPlayerById(playerId: string) {
  const playerData = await db.select().from(player).where(eq(player.id, playerId)).limit(1);
  if (!playerData[0]) return null;

  const assignedTo = playerData[0].toId
    ? await db.select().from(player).where(eq(player.id, playerData[0].toId)).limit(1)
    : null;

  return {
    ...playerData[0],
    assignedTo: assignedTo?.[0] || null,
  };
}

type Player = {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
};

/**
 * Perform the drawing algorithm without database access
 * @param players Array of players to assign
 * @returns Map of playerId -> toId assignments
 * @throws Error if less than 2 players or no valid assignments can be found
 */
export function performDraw(players: Player[]): Record<string, string> {
  if (players.length < 2) {
    throw new Error("Need at least 2 players to draw");
  }

  // Group players by groupId
  const playersByGroup = new Map<number, Player[]>();
  for (const p of players) {
    if (!playersByGroup.has(p.groupId)) {
      playersByGroup.set(p.groupId, []);
    }
    playersByGroup.get(p.groupId)!.push(p);
  }

  // Build valid targets for each player (exclude same group)
  const validTargets = new Map<string, Player[]>();
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
    throw new Error("Could not find valid assignments. Try adjusting groups.");
  }

  return Object.fromEntries(assignments);
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

  // Perform the draw
  const assignments = performDraw(players);

  // Update database with assignments
  await db.transaction(async (tx) => {
    for (const [playerId, toId] of Object.entries(assignments)) {
      await tx.update(player).set({ toId }).where(eq(player.id, playerId));
    }
  });

  return { success: true, assignments };
}

/**
 * Delete a pool (cascades to groups and players via DB constraints)
 */
export async function deletePool(poolId: string) {
  await db.delete(pool).where(eq(pool.id, poolId));
}

/**
 * Delete a group (cascades to players via DB constraints)
 */
export async function deleteGroup(groupId: number) {
  await db.delete(group).where(eq(group.id, groupId));
}

/**
 * Delete a player
 */
export async function deletePlayer(playerId: string) {
  await db.delete(player).where(eq(player.id, playerId));
}
