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

    expect(() => performDraw(players)).toThrow("Need at least 2 players to draw");
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
      "Could not find valid assignments. Try adjusting groups."
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
});
