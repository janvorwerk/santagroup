import { describe, it, expect, jest } from "@jest/globals";

// Mock the database module to avoid requiring DATABASE_URL
jest.mock("@/lib/db", () => ({
  db: {},
}));

import { performDraw } from "../pool";

type Person = {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
};

describe("performDraw", () => {
  it("should throw error when there are less than 2 persons", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
    ];

    expect(() => performDraw(persons)).toThrow("Il faut au moins deux personnes pour tirer au sort");
  });

  it("should throw error when all persons are in the same group", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-2",
        name: "Person 2",
        groupId: 1,
        toId: null,
      },
    ];

    // This should fail because all persons are in the same group
    // and there are no valid targets (can't assign to same group)
    expect(() => performDraw(persons)).toThrow(
      "Je n'ai pas réussi à trouver de combinaison : essaie de changer les groupes"
    );
  });

  it("should successfully assign persons from different groups", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-2",
        name: "Person 2",
        groupId: 2,
        toId: null,
      },
    ];

    const assignments = performDraw(persons);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(2);

    // Verify that assignments are one-to-one (no duplicates)
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify that no person is assigned to someone in their own group
    expect(assignments["person-1"]).toBe("person-2");
    expect(assignments["person-2"]).toBe("person-1");
  });

  it("should handle multiple persons across multiple groups", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-2",
        name: "Person 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-3",
        name: "Person 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-4",
        name: "Person 4",
        groupId: 2,
        toId: null,
      },
    ];

    const assignments = performDraw(persons);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(4);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no person is assigned to someone in their own group
    const personsMap = new Map(persons.map((p) => [p.id, p]));
    for (const [personId, assignedToId] of Object.entries(assignments)) {
      const person = personsMap.get(personId)!;
      const assignedTo = personsMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(person.groupId);
    }
  });

  it("should handle three groups with multiple persons", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-2",
        name: "Person 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-3",
        name: "Person 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-4",
        name: "Person 4",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-5",
        name: "Person 5",
        groupId: 3,
        toId: null,
      },
      {
        id: "person-6",
        name: "Person 6",
        groupId: 3,
        toId: null,
      },
    ];

    const assignments = performDraw(persons);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(6);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no person is assigned to someone in their own group
    const personsMap = new Map(persons.map((p) => [p.id, p]));
    for (const [personId, assignedToId] of Object.entries(assignments)) {
      const person = personsMap.get(personId)!;
      const assignedTo = personsMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(person.groupId);
    }
  });

  it("should handle uneven group sizes", () => {
    const persons: Person[] = [
      {
        id: "person-1",
        name: "Person 1",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-2",
        name: "Person 2",
        groupId: 1,
        toId: null,
      },
      {
        id: "person-3",
        name: "Person 3",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-4",
        name: "Person 4",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-5",
        name: "Person 5",
        groupId: 2,
        toId: null,
      },
      {
        id: "person-6",
        name: "Person 6",
        groupId: 3,
        toId: null,
      },
    ];

    const assignments = performDraw(persons);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(6);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no person is assigned to someone in their own group
    const personsMap = new Map(persons.map((p) => [p.id, p]));
    for (const [personId, assignedToId] of Object.entries(assignments)) {
      const person = personsMap.get(personId)!;
      const assignedTo = personsMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(person.groupId);
    }
  });

  it("should handle case where smaller groups can be matched to a larger group", () => {
    // Group 1: A, B, C, D (4 persons)
    // Group 2: E, F (2 persons)
    // Group 3: G, H, I, J, K, L (6 persons)
    // All persons from groups 1 and 2 (6 total) should be matched with group 3 (6 persons)
    const persons: Person[] = [
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

    const assignments = performDraw(persons);

    expect(assignments).toBeDefined();
    expect(Object.keys(assignments)).toHaveLength(12);

    // Verify one-to-one matching
    const assignedToIds = Object.values(assignments);
    expect(new Set(assignedToIds).size).toBe(assignedToIds.length);

    // Verify no person is assigned to someone in their own group
    const personsMap = new Map(persons.map((p) => [p.id, p]));
    for (const [personId, assignedToId] of Object.entries(assignments)) {
      const person = personsMap.get(personId)!;
      const assignedTo = personsMap.get(assignedToId)!;
      expect(assignedTo.groupId).not.toBe(person.groupId);
    }

    // Verify that all persons from groups 1 and 2 are assigned to group 3
    const group1And2Persons = persons.filter((p) => p.groupId === 1 || p.groupId === 2);
    for (const person of group1And2Persons) {
      const assignedToId = assignments[person.id];
      const assignedTo = personsMap.get(assignedToId)!;
      expect(assignedTo.groupId).toBe(3);
    }

    // Verify that all persons from group 3 are assigned to either group 1 or 2
    const group3Persons = persons.filter((p) => p.groupId === 3);
    for (const person of group3Persons) {
      const assignedToId = assignments[person.id];
      const assignedTo = personsMap.get(assignedToId)!;
      expect([1, 2]).toContain(assignedTo.groupId);
    }
  });
});
