import { describe, it, expect, jest } from "@jest/globals";

// Mock the database module to avoid requiring DATABASE_URL
jest.mock("@/lib/db", () => ({
  db: {},
}));

import { performDraw } from "../pool";

type Player = {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
};

describe("performDraw", () => {
  it("should throw error when there are less than 2 players", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
    ];

    expect(() => performDraw(players)).toThrow("Il faut au moins deux joueurs pour tirer au sort");
  });

  it("should throw error when all players are in the same group", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-2",
        name: "Player 2",
        groupId: 1,
        toId: null,
      },
    ];

    // This should fail because all players are in the same group
    // and there are no valid targets (can't assign to same group)
    expect(() => performDraw(players)).toThrow(
      "Je n'ai pas réussi à trouver de combinaison : essaie de changer les groupes"
    );
  });

  it("should successfully assign players from different groups", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-2",
        name: "Player 2",
        groupId: 2,
        toId: null,
      },
    ];

    const assignments = performDraw(players);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(2);

    // Verify that assignments are one-to-one (no duplicates)
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify that no player is assigned to someone in their own group
    expect(assignments["player-1"]).toBe("player-2");
    expect(assignments["player-2"]).toBe("player-1");
  });

  it("should handle multiple players across multiple groups", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-2",
        name: "Player 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-3",
        name: "Player 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-4",
        name: "Player 4",
        groupId: 2,
        toId: null,
      },
    ];

    const assignments = performDraw(players);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(4);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no player is assigned to someone in their own group
    const playersMap = new Map(players.map((p) => [p.id, p]));
    for (const [playerId, assignedToId] of Object.entries(assignments)) {
      const player = playersMap.get(playerId)!;
      const assignedTo = playersMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(player.groupId);
    }
  });

  it("should handle three groups with multiple players", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-2",
        name: "Player 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-3",
        name: "Player 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-4",
        name: "Player 4",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-5",
        name: "Player 5",
        groupId: 3,
        toId: null,
      },
      {
        id: "player-6",
        name: "Player 6",
        groupId: 3,
        toId: null,
      },
    ];

    const assignments = performDraw(players);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(6);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no player is assigned to someone in their own group
    const playersMap = new Map(players.map((p) => [p.id, p]));
    for (const [playerId, assignedToId] of Object.entries(assignments)) {
      const player = playersMap.get(playerId)!;
      const assignedTo = playersMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(player.groupId);
    }
  });

  it("should handle uneven group sizes", () => {
    const players: Player[] = [
      {
        id: "player-1",
        name: "Player 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-2",
        name: "Player 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "player-3",
        name: "Player 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-4",
        name: "Player 4",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-5",
        name: "Player 5",
        groupId: 2,
        toId: null,
      },
      {
        id: "player-6",
        name: "Player 6",
        groupId: 3,
        toId: null,
      },
    ];

    const assignments = performDraw(players);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(6);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no player is assigned to someone in their own group
    const playersMap = new Map(players.map((p) => [p.id, p]));
    for (const [playerId, assignedToId] of Object.entries(assignments)) {
      const player = playersMap.get(playerId)!;
      const assignedTo = playersMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(player.groupId);
    }
  });

  it("should handle case where smaller groups can be matched to a larger group", () => {
    // Group 1: A, B, C, D (4 players)
    // Group 2: E, F (2 players)
    // Group 3: G, H, I, J, K, L (6 players)
    // All players from groups 1 and 2 (6 total) should be matched with group 3 (6 players)
    const players: Player[] = [
      { id: "A", name: "A", groupId: 1, toId: null },
      { id: "B", name: "B", groupId: 1, toId: null },
      { id: "C", name: "C", groupId: 1, toId: null },
      { id: "D", name: "D", groupId: 1, toId: null },
      { id: "E", name: "E", groupId: 2, toId: null },
      { id: "F", name: "F", groupId: 2, toId: null },
      { id: "G", name: "G", groupId: 3, toId: null },
      { id: "H", name: "H", groupId: 3, toId: null },
      { id: "I", name: "I", groupId: 3, toId: null },
      { id: "J", name: "J", groupId: 3, toId: null },
      { id: "K", name: "K", groupId: 3, toId: null },
      { id: "L", name: "L", groupId: 3, toId: null },
    ];

    const assignments = performDraw(players);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(12);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no player is assigned to someone in their own group
    const playersMap = new Map(players.map((p) => [p.id, p]));
    for (const [playerId, assignedToId] of Object.entries(assignments)) {
      const player = playersMap.get(playerId)!;
      const assignedTo = playersMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(player.groupId);
    }

    // Verify that all players from groups 1 and 2 are assigned to group 3
    const group1And2Players = players.filter((p) => p.groupId === 1 || p.groupId === 2);
    for (const player of group1And2Players) {
      const assignedToId = assignments[player.id];
      const assignedTo = playersMap.get(assignedToId)!;
      expect(assignedTo.groupId).toBe(3);
    }

    // Verify that all players from group 3 are assigned to either group 1 or 2
    const group3Players = players.filter((p) => p.groupId === 3);
    for (const player of group3Players) {
      const assignedToId = assignments[player.id];
      const assignedTo = playersMap.get(assignedToId)!;
      expect([1, 2]).toContain(assignedTo.groupId);
    }
  });
});
