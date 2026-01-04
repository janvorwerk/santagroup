"use client";

import { AlertDialog } from "@/lib/components/AlertDialog";
import { button, Button } from "@/lib/components/Button";
import { Dialog } from "@/lib/components/Dialog";
import { ListBox, ListBoxItem } from "@/lib/components/ListBox";
import { Modal } from "@/lib/components/Modal";
import { TextField } from "@/lib/components/TextField";
import { trpc } from "@/lib/trpc/client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { isTextDropItem, useDragAndDrop } from "react-aria-components";
import { cn } from "tailwind-variants";

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

export function PoolAdminClient({ poolId, cheatMode }: { poolId: string; cheatMode: boolean }) {
  const router = useRouter();
  const [poolName, setPoolName] = useState("");
  const [newPlayerNames, setNewPlayerNames] = useState<Map<number, string>>(new Map());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheatDialogOpen, setIsCheatDialogOpen] = useState(false);

  // Fetch pool data using tRPC hook
  // Note: initialPoolData is available from server but we let the query fetch it
  // to avoid Date/string serialization issues. React Query will cache it.
  const { data: poolData, isLoading, error, refetch } = trpc.poolGetFull.useQuery(poolId);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Failed to load pool", error);
      alert("Échec du chargement du tirage. Il se peut qu'il n'existe pas.");
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
      alert("Échec de la mise à jour du nom du tirage");
    },
  });

  const createGroupMutation = trpc.groupCreate.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create group", error);
      alert("Échec de la création du groupe");
    },
  });

  const createPlayerMutation = trpc.playerCreate.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create player", error);
      alert("Échec de la création du joueur");
    },
  });

  const updatePlayerGroupMutation = trpc.playerUpdateGroup.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to move player", error);
      alert("Échec du déplacement du joueur");
    },
  });

  const drawPoolMutation = trpc.poolDraw.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      console.error("Failed to draw", error);
      alert(error?.message ?? "Échec du tirage au sort");
    },
  });

  const deletePoolMutation = trpc.poolDelete.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: (error) => {
      console.error("Failed to delete pool", error);
      alert("Échec de la suppression du tirage");
    },
  });

  const deleteGroupMutation = trpc.groupDelete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete group", error);
      alert("Échec de la suppression du groupe");
    },
  });

  const deletePlayerMutation = trpc.playerDelete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete player", error);
      alert("Échec de la suppression du joueur");
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
      alert("Il faut au moins 2 joueurs pour faire le tirage");
      return;
    }
    drawPoolMutation.mutate(poolId);
  };

  const handleDeletePool = () => {
    deletePoolMutation.mutate({ id: poolId });
  };

  const handleDeleteGroup = (groupId: number) => {
    deleteGroupMutation.mutate({ id: groupId });
  };

  const handleDeletePlayer = (playerId: string) => {
    deletePlayerMutation.mutate({ id: playerId });
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

  const getDrawResults = () => {
    if (!poolData) return [];
    const allPlayers = getAllPlayers();
    return allPlayers
      .filter((p) => p.toId !== null)
      .map((p) => {
        const toPlayer = allPlayers.find((player) => player.id === p.toId);
        return {
          from: p.name,
          to: toPlayer?.name || "Inconnu",
        };
      });
  };

  if (isLoading) {
    return (
      <main className="h-full flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </main>
    );
  }

  if (error || !poolData) {
    return (
      <main className="h-full flex items-center justify-center">
        <div className="text-lg text-red-600">Tirage introuvable</div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col gap-4">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <TextField
            label="Nom du tirage"
            value={poolName}
            onChange={setPoolName}
            onBlur={handleUpdatePoolName}
            isDisabled={updatePoolNameMutation.isPending}
            className="flex-1"
          />
          <Button onPress={() => router.push("/")} className="mt-6">
            Retour
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Groupes</h2>
          <Button onPress={handleAddGroup} isDisabled={isDrawn}>
            Ajouter un groupe
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poolData.groups.map((group) => (
            <GroupListBox
              key={group.id}
              group={group}
              allGroups={poolData.groups}
              isDrawn={isDrawn}
              newPlayerName={newPlayerNames.get(group.id) || ""}
              onNewPlayerNameChange={(name) => setNewPlayerNames(new Map(newPlayerNames.set(group.id, name)))}
              onAddPlayer={() => handleAddPlayer(group.id)}
              onMovePlayer={handleMovePlayer}
              onDeleteGroup={() => handleDeleteGroup(group.id)}
              onDeletePlayer={handleDeletePlayer}
            />
          ))}
        </div>

        {poolData.groups.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Aucun groupe pour le moment. Cliquez sur "Ajouter un groupe" pour en créer un.
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
            {drawPoolMutation.isPending ? "Tirage en cours..." : "Effectuer le tirage au sort"}
          </Button>
        </div>
      )}

      {isDrawn && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Liens des joueurs</h2>
          <p className="text-gray-600">
            Envoyez un email à chaque joueur pour qu'il puisse voir à qui il doit offrir un cadeau :
          </p>
          <div className="space-y-2">
            {getAllPlayers().map((player) => {
              const playUrl = getPlayUrl(player.id);
              const mailtoUrl = `mailto:?subject=${encodeURIComponent(
                `${player.name}, participe au tirage de ${poolData.name} !`
              )}&body=${encodeURIComponent(
                `Caro, pour participer au tirage de ${poolData.name}, clique sur ce lien ${playUrl}`
              )}`;
              return (
                <div key={player.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <span className="font-medium flex-1">{player.name}</span>
                  <a href={mailtoUrl} target="santa-mail" className={button({ variant: "primary" })}>
                    Envoyer un e-mail
                  </a>
                  <Button
                    onPress={async () => {
                      await navigator.clipboard.writeText(playUrl);
                    }}
                  >
                    {"Copier le lien"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4 border-2 border-red-200">
        <h2 className="text-2xl font-semibold text-red-800">Zone de danger</h2>
        <p className="text-gray-600">Les actions dans cette section sont irréversibles. Veuillez agir avec prudence.</p>

        <div className="flex gap-4 justify-end">
          {isDrawn && cheatMode && (
            <Button variant="secondary" onPress={() => setIsCheatDialogOpen(true)}>
              Voir le tirage
            </Button>
          )}
          <Button
            variant="destructive"
            onPress={() => setIsDeleteDialogOpen(true)}
            isDisabled={deletePoolMutation.isPending}
          >
            Supprimer le tirage
          </Button>
        </div>
      </div>

      <Modal isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog
          title="Supprimer le tirage"
          variant="destructive"
          actionLabel="Supprimer"
          cancelLabel="Annuler"
          onAction={handleDeletePool}
        >
          Êtes-vous sûr de vouloir supprimer ce tirage ? Cette action est irréversible et supprimera tous les groupes et
          joueurs associés.
        </AlertDialog>
      </Modal>

      <Modal isOpen={isCheatDialogOpen} onOpenChange={setIsCheatDialogOpen}>
        <Dialog>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Résultats du tirage</h2>
          <div className="grid grid-cols-3">
            {getDrawResults().map((result, index) => (
              <Fragment key={index}>
                <span className="font-medium">{result.from}</span>
                <span className="text-gray-600 text-center">→</span>
                <span className="font-medium text-end self-end">{result.to}</span>
              </Fragment>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onPress={() => setIsCheatDialogOpen(false)}>Fermer</Button>
          </div>
        </Dialog>
      </Modal>
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
  onDeleteGroup: () => void;
  onDeletePlayer: (playerId: string) => void;
}

function GroupListBox({
  group,
  isDrawn,
  newPlayerName,
  onNewPlayerNameChange,
  onAddPlayer,
  onMovePlayer,
  onDeleteGroup,
  onDeletePlayer,
}: GroupListBoxProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems(keys) {
      if (isDrawn) return [];
      return Array.from(keys).map((key) => ({
        [PLAYER_DRAG_TYPE]: key as string,
        "text/plain": group.players.find((p) => p.id === key)?.name || "",
      }));
    },
    acceptedDragTypes: isDrawn ? [] : [PLAYER_DRAG_TYPE],
    async onRootDrop(e) {
      if (isDrawn) return;
      const items = await Promise.all(
        e.items.filter(isTextDropItem).map(async (item) => {
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
      if (isDrawn) return;
    },
  });

  return (
    <div className="flex flex-col gap-2">
      {!isDrawn && (
        <Button
          variant="secondary"
          onPress={() => {
            if (group.players.length === 0) {
              onDeleteGroup();
            } else if (selectedPlayerId) {
              onDeletePlayer(selectedPlayerId);
            }
          }}
          className="max-w-fit self-end"
          isDisabled={group.players.length > 0 && !selectedPlayerId}
        >
          <Trash2 className="w-4 h-auto" />
          {group.players.length === 0 ? <span>Supprimer le groupe</span> : <span>Supprimer le joueur</span>}
        </Button>
      )}
      <ListBox
        items={group.players}
        dragAndDropHooks={dragAndDropHooks}
        selectionMode={isDrawn ? "none" : "single"}
        selectedKeys={selectedPlayerId ? [selectedPlayerId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string | undefined;
          setSelectedPlayerId(selected ?? null);
        }}
        className={cn("min-h-[200px] flex-1 w-full", isDrawn && "opacity-50")}
      >
        {(player: Player) => (
          <ListBoxItem id={player.id} textValue={player.name}>
            <div className="flex items-center justify-between w-full">
              <span>{player.name}</span>
            </div>
          </ListBoxItem>
        )}
      </ListBox>
      {!isDrawn && (
        <div className="flex gap-2">
          <TextField
            placeholder="Nom du joueur"
            value={newPlayerName}
            onChange={onNewPlayerNameChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddPlayer();
              }
            }}
            className="flex-1 placeholder-shown:text-zinc-500"
          />
          <Button onPress={onAddPlayer} isDisabled={!newPlayerName.trim()}>
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
