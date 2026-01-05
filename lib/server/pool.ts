import { db } from "@/lib/db";
import { pool, group, person } from "@/lib/db/schema";
import { eq, inArray, sql, and, desc } from "drizzle-orm";

type GroupWithPersons = {
  id: number;
  poolId: string | null;
  persons: Array<{
    id: string;
    name: string;
    groupId: number;
    toId: string | null;
  }>;
};

export interface PoolWithGroupsAndPersons {
  id: string;
  name: string;
  createdAt: Date;
  groups: GroupWithPersons[];
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
 * Get pool with groups and persons (nested)
 */
export async function getPoolFull(poolId: string): Promise<PoolWithGroupsAndPersons | null> {
  // CTE: Persons aggregated by group
  const personsByGroup = db
    .select({
      groupId: person.groupId,
      persons: sql<GroupWithPersons["persons"]>`
        json_agg(
          jsonb_build_object(
            'id', ${person.id},
            'name', ${person.name},
            'groupId', ${person.groupId},
            'toId', ${person.toId}
          )
        order by ${person.name}
        )
      `.as("persons"),
    })
    .from(person)
    .groupBy(person.groupId)
    .as("persons_by_group");

  // CTE: Groups with their persons
  const groupsWithPersons = db
    .select({
      id: group.id,
      poolId: group.poolId,
      persons: sql<GroupWithPersons["persons"]>`
        COALESCE(${personsByGroup.persons}, '[]'::json)
      `.as("persons"),
    })
    .from(group)
    .leftJoin(personsByGroup, eq(group.id, personsByGroup.groupId))
    .where(eq(group.poolId, poolId))
    .as("groups_with_persons");

  // CTE: Groups aggregated by pool
  const groupsByPool = db
    .select({
      poolId: groupsWithPersons.poolId,
      groups: sql<GroupWithPersons[]>`
        json_agg(
          jsonb_build_object(
            'id', ${groupsWithPersons.id},
            'poolId', ${groupsWithPersons.poolId},
            'persons', ${groupsWithPersons.persons}
          )
          order by ${groupsWithPersons.id}
        )
      `.as("groups"),
    })
    .from(groupsWithPersons)
    .groupBy(groupsWithPersons.poolId)
    .as("groups_by_pool");

  // Main query: pool with aggregated groups
  const result = await db
    .select({
      id: pool.id,
      name: pool.name,
      createdAt: pool.createdAt,
      groups: sql<GroupWithPersons[]>`
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
    groups: (result[0].groups || []) as GroupWithPersons[],
  };
}

/**
 * Get multiple pools with groups and persons (nested)
 */
export async function getPoolsFull(poolIds: string[]): Promise<PoolWithGroupsAndPersons[]> {
  if (poolIds.length === 0) return [];

  // CTE: Persons aggregated by group
  const personsByGroup = db
    .select({
      groupId: person.groupId,
      persons: sql<GroupWithPersons["persons"]>`
        json_agg(
          jsonb_build_object(
            'id', ${person.id},
            'name', ${person.name},
            'groupId', ${person.groupId},
            'toId', ${person.toId}
          )
        order by ${person.name}
        )
      `.as("persons"),
    })
    .from(person)
    .groupBy(person.groupId)
    .as("persons_by_group");

  // CTE: Groups with their persons
  const groupsWithPersons = db
    .select({
      id: group.id,
      poolId: group.poolId,
      persons: sql<GroupWithPersons["persons"]>`
        COALESCE(${personsByGroup.persons}, '[]'::json)
      `.as("persons"),
    })
    .from(group)
    .leftJoin(personsByGroup, eq(group.id, personsByGroup.groupId))
    .as("groups_with_persons");

  // CTE: Groups aggregated by pool
  const groupsByPool = db
    .select({
      poolId: groupsWithPersons.poolId,
      groups: sql<GroupWithPersons[]>`
        json_agg(
          jsonb_build_object(
            'id', ${groupsWithPersons.id},
            'poolId', ${groupsWithPersons.poolId},
            'persons', ${groupsWithPersons.persons}
          )
          order by ${groupsWithPersons.id}
        )
      `.as("groups"),
    })
    .from(groupsWithPersons)
    .groupBy(groupsWithPersons.poolId)
    .as("groups_by_pool");

  // Main query: pools with aggregated groups
  const result = await db
    .select({
      id: pool.id,
      name: pool.name,
      createdAt: pool.createdAt,
      groups: sql<GroupWithPersons[]>`
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
    groups: (row.groups || []) as GroupWithPersons[],
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
 * Add person to a group
 */
export async function createPerson(groupId: number, name: string) {
  const result = await db
    .insert(person)
    .values({
      groupId,
      name,
    })
    .returning();
  return result[0];
}

/**
 * Move person between groups
 */
export async function updatePersonGroup(personId: string, groupId: number) {
  // Build scalar subqueries using Drizzle - select the column directly
  const currentGroupPool = sql`
    (SELECT ${group.poolId}
     FROM ${group}
     INNER JOIN ${person} ON ${group.id} = ${person.groupId}
     WHERE ${person.id} = ${personId}
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
    .update(person)
    .set({ groupId })
    .where(and(eq(person.id, personId), sql`${currentGroupPool} = ${targetGroupPool}`))
    .returning();

  return result[0];
}

/**
 * Get person by ID with their assignment
 */
export async function getPersonById(personId: string) {
  const personData = await db.select().from(person).where(eq(person.id, personId)).limit(1);
  if (!personData[0]) return null;

  const assignedTo = personData[0].toId
    ? await db.select().from(person).where(eq(person.id, personData[0].toId)).limit(1)
    : null;

  return {
    ...personData[0],
    assignedTo: assignedTo?.[0] || null,
  };
}

type Person = {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
};

/**
 * Perform the drawing algorithm without database access
 * @param persons Array of persons to assign
 * @returns Map of personId -> toId assignments
 * @throws Error if less than 2 persons or no valid assignments can be found
 */
export function performDraw(persons: Person[]): Record<string, string> {
  if (persons.length < 2) {
    throw new Error("Il faut au moins deux personnes pour tirer au sort");
  }

  // Group persons by groupId
  const personsByGroup = new Map<number, Person[]>();
  for (const p of persons) {
    if (!personsByGroup.has(p.groupId)) {
      personsByGroup.set(p.groupId, []);
    }
    personsByGroup.get(p.groupId)!.push(p);
  }

  // Build valid targets for each person
  // If only one group exists, allow assignments to anyone (no group constraint)
  // Otherwise, exclude same group assignments
  const validTargets = new Map<string, Person[]>();
  const isSingleGroup = personsByGroup.size === 1;
  
  for (const p of persons) {
    if (isSingleGroup) {
      // No group constraint when only one group exists
      const targets = persons.filter((target) => target.id !== p.id);
      validTargets.set(p.id, targets);
    } else {
      // Exclude same group when multiple groups exist
      const targets = persons.filter((target) => target.groupId !== p.groupId);
      validTargets.set(p.id, targets);
    }
  }

  // Check if each person has at least one valid target
  for (const p of persons) {
    const targets = validTargets.get(p.id) || [];
    if (targets.length === 0) {
      throw new Error("Je n'ai pas réussi à trouver de combinaison : essaie de changer les groupes");
    }
  }

  // Use backtracking algorithm to find a valid assignment
  const assignments = new Map<string, string>(); // personId -> toId
  const used = new Set<string>(); // toIds that have been assigned

  // Shuffle persons for randomness
  const shuffledPersons = [...persons].sort(() => Math.random() - 0.5);

  /**
   * Backtracking function to find a valid assignment
   * @param index Current index in the persons array
   * @returns true if a valid assignment was found, false otherwise
   */
  function backtrack(index: number): boolean {
    // Base case: all persons have been assigned
    if (index >= shuffledPersons.length) {
      return true;
    }

    const currentPerson = shuffledPersons[index];
    const targets = validTargets.get(currentPerson.id) || [];
    
    // Shuffle targets for randomness
    const shuffledTargets = [...targets].sort(() => Math.random() - 0.5);
    
    // Try each available target
    for (const target of shuffledTargets) {
      // Skip if target is already used or is the same person
      if (used.has(target.id) || target.id === currentPerson.id) {
        continue;
      }

      // Try this assignment
      assignments.set(currentPerson.id, target.id);
      used.add(target.id);

      // Recursively try to assign remaining persons
      if (backtrack(index + 1)) {
        return true;
      }

      // Backtrack: remove this assignment and try next target
      assignments.delete(currentPerson.id);
      used.delete(target.id);
    }

    // No valid assignment found for this person
    return false;
  }

  // Try to find a solution with multiple random shuffles
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    assignments.clear();
    used.clear();
    shuffledPersons.sort(() => Math.random() - 0.5);

    if (backtrack(0)) {
      return Object.fromEntries(assignments);
    }
  }

  // If we couldn't find a solution after multiple attempts, it likely doesn't exist
  throw new Error("Je n'ai pas réussi à trouver de combinaison : essaie de changer les groupes");
}

/**
 * Execute drawing algorithm
 */
export async function drawPool(poolId: string) {
  // Get all persons in the pool
  const allPersonsForPool = await db
    .select({
      person: person,
    })
    .from(person)
    .innerJoin(group, eq(person.groupId, group.id))
    .where(eq(group.poolId, poolId));

  const persons = allPersonsForPool.map((row) => row.person);

  // Perform the draw
  const assignments = performDraw(persons);

  // Update database with assignments
  await db.transaction(async (tx) => {
    for (const [personId, toId] of Object.entries(assignments)) {
      await tx.update(person).set({ toId }).where(eq(person.id, personId));
    }
  });

  return { success: true, assignments };
}

/**
 * Delete a pool (cascades to groups and persons via DB constraints)
 */
export async function deletePool(poolId: string) {
  await db.delete(pool).where(eq(pool.id, poolId));
}

/**
 * Delete a group (cascades to persons via DB constraints)
 */
export async function deleteGroup(groupId: number) {
  await db.delete(group).where(eq(group.id, groupId));
}

/**
 * Delete a person
 */
export async function deletePerson(personId: string) {
  await db.delete(person).where(eq(person.id, personId));
}
