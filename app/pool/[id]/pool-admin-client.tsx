"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDragAndDrop, isTextDropItem, Collection } from "react-aria-components";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/lib/components/Button";
import { TextField } from "@/lib/components/TextField";
import { ListBox, ListBoxItem } from "@/lib/components/ListBox";

interface Player {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
}

interface Group {
  id: number;
  poolId: string | null;
  players: Player[];
}

interface PoolData {
  id: string;
  name: string;
  createdAt: Date | string;
  groups: Group[];
}

const PLAYER_DRAG_TYPE = "application/x-santa-player";

export function PoolAdminClient({ poolId }: { poolId: string }) {
  const router = useRouter();
  const [poolName, setPoolName] = useState("");
  const [newPlayerNames, setNewPlayerNames] = useState<Map<number, string>>(new Map());

  // Fetch pool data using tRPC hook
  // Note: initialPoolData is available from server but we let the query fetch it
  // to avoid Date/string serialization issues. React Query will cache it.
  const { data: poolData, isLoading, error, refetch } = trpc.poolGetFull.useQuery(poolId);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Failed to load pool", error);
      alert("Failed to load pool. It may not exist.");
      router.push("/");
    }
  }, [error, router]);

  // Update poolName when poolData changes
  useEffect(() => {
    if (poolData) {
      setPoolName(poolData.name);
    }
  }, [poolData]);

  // Mutations
  const updatePoolNameMutation = trpc.poolUpdateName.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to update pool name", error);
      alert("Failed to update pool name");
    },
  });

  const createGroupMutation = trpc.groupCreate.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create group", error);
      alert("Failed to create group");
    },
  });

  const createPlayerMutation = trpc.playerCreate.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create player", error);
      alert("Failed to create player");
    },
  });

  const updatePlayerGroupMutation = trpc.playerUpdateGroup.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to move player", error);
      alert("Failed to move player");
    },
  });

  const drawPoolMutation = trpc.poolDraw.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      console.error("Failed to draw", error);
      alert(error?.message || "Failed to draw assignments");
    },
  });

  const handleUpdatePoolName = () => {
    if (!poolName.trim() || poolName === poolData?.name) return;
    updatePoolNameMutation.mutate({ id: poolId, name: poolName.trim() });
  };

  const handleAddGroup = () => {
    createGroupMutation.mutate({ poolId });
  };

  const handleAddPlayer = (groupId: number) => {
    const name = newPlayerNames.get(groupId)?.trim();
    if (!name) return;
    createPlayerMutation.mutate({ groupId, name });
    setNewPlayerNames(new Map(newPlayerNames.set(groupId, "")));
  };

  const handleMovePlayer = (playerId: string, targetGroupId: number) => {
    updatePlayerGroupMutation.mutate({ playerId, groupId: targetGroupId });
  };

  const handleDraw = () => {
    if (!poolData) return;
    const totalPlayers = poolData.groups.reduce((sum, g) => sum + g.players.length, 0);
    if (totalPlayers < 2) {
      alert("Need at least 2 players to draw");
      return;
    }
    drawPoolMutation.mutate(poolId);
  };

  // Check if drawing has been done (any player has toId)
  const isDrawn = poolData?.groups.some((g) => g.players.some((p) => p.toId !== null)) ?? false;

  const getPlayUrl = (playerId: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/play/${playerId}`;
  };

  const getAllPlayers = () => {
    if (!poolData) return [];
    return poolData.groups.flatMap((g) => g.players);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  if (error || !poolData) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Pool not found</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <TextField
              label="Pool Name"
              value={poolName}
              onChange={setPoolName}
              onBlur={handleUpdatePoolName}
              isDisabled={updatePoolNameMutation.isPending}
              className="flex-1"
            />
            <Button onPress={() => router.push("/")} className="mt-6">
              Back
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Groups</h2>
            {!isDrawn && (
              <Button onPress={handleAddGroup} isDisabled={isDrawn}>
                Add Group
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poolData.groups.map((group) => (
              <GroupListBox
                key={group.id}
                group={group}
                allGroups={poolData.groups}
                isDrawn={isDrawn}
                newPlayerName={newPlayerNames.get(group.id) || ""}
                onNewPlayerNameChange={(name) =>
                  setNewPlayerNames(new Map(newPlayerNames.set(group.id, name)))
                }
                onAddPlayer={() => handleAddPlayer(group.id)}
                onMovePlayer={handleMovePlayer}
              />
            ))}
          </div>

          {poolData.groups.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No groups yet. Click "Add Group" to create one.
            </div>
          )}
        </div>

        {!isDrawn && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Button
              onPress={handleDraw}
              isDisabled={drawPoolMutation.isPending || getAllPlayers().length < 2}
              className="w-full"
            >
              {drawPoolMutation.isPending ? "Drawing..." : "Draw Secret Santa Assignments"}
            </Button>
          </div>
        )}

        {isDrawn && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Player Links</h2>
            <p className="text-gray-600">
              Send these links to each player so they can see who they should give a gift to:
            </p>
            <div className="space-y-2">
              {getAllPlayers().map((player) => {
                const playUrl = getPlayUrl(player.id);
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(
                  `${player.name} Participe au tirage de ${poolData.name}`
                )}&body=${encodeURIComponent(playUrl)}`;
                return (
                  <div key={player.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                    <span className="font-medium flex-1">{player.name}</span>
                    <a
                      href={mailtoUrl}
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Send Email
                    </a>
                    <a
                      href={playUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View Link
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface GroupListBoxProps {
  group: Group;
  allGroups: Group[];
  isDrawn: boolean;
  newPlayerName: string;
  onNewPlayerNameChange: (name: string) => void;
  onAddPlayer: () => void;
  onMovePlayer: (playerId: string, targetGroupId: number) => void;
}

function GroupListBox({
  group,
  allGroups,
  isDrawn,
  newPlayerName,
  onNewPlayerNameChange,
  onAddPlayer,
  onMovePlayer,
}: GroupListBoxProps) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems(keys) {
      return Array.from(keys).map((key) => ({
        [PLAYER_DRAG_TYPE]: key as string,
        "text/plain": group.players.find((p) => p.id === key)?.name || "",
      }));
    },
    acceptedDragTypes: [PLAYER_DRAG_TYPE],
    async onRootDrop(e) {
      const items = await Promise.all(
        e.items
          .filter(isTextDropItem)
          .map(async (item) => {
            const playerId = await item.getText(PLAYER_DRAG_TYPE);
            return playerId;
          })
      );

      for (const playerId of items) {
        if (playerId && group.players.every((p) => p.id !== playerId)) {
          onMovePlayer(playerId, group.id);
        }
      }
    },
    async onReorder(e) {
      // Handle reordering within the same list if needed
    },
  });

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Group {group.id}</div>
      <ListBox
        items={group.players}
        dragAndDropHooks={isDrawn ? undefined : dragAndDropHooks}
        selectionMode="none"
        className="min-h-[200px]"
      >
        {(player: Player) => (
          <ListBoxItem id={player.id} textValue={player.name}>
            {player.name}
          </ListBoxItem>
        )}
      </ListBox>
      {!isDrawn && (
        <div className="flex gap-2">
          <TextField
            placeholder="Player name"
            value={newPlayerName}
            onChange={onNewPlayerNameChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddPlayer();
              }
            }}
            className="flex-1"
          />
          <Button onPress={onAddPlayer} isDisabled={!newPlayerName.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

