/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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

interface Person {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
}

interface Group {
  id: number;
  poolId: string | null;
  persons: Person[];
}

interface PoolData {
  id: string;
  name: string;
  createdAt: Date | string;
  groups: Group[];
}

const PERSON_DRAG_TYPE = "application/x-santa-person";

export function PoolAdminClient({ poolId, cheatMode }: { poolId: string; cheatMode: boolean }) {
  const router = useRouter();
  const [poolName, setPoolName] = useState("");
  const [newPersonNames, setNewPersonNames] = useState<Map<number, string>>(new Map());
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

  const createPersonMutation = trpc.personCreate.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to create person", error);
      alert("Échec de la création de la personne");
    },
  });

  const updatePersonGroupMutation = trpc.personUpdateGroup.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to move person", error);
      alert("Échec du déplacement de la personne");
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

  const deletePersonMutation = trpc.personDelete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete person", error);
      alert("Échec de la suppression de la personne");
    },
  });

  const handleUpdatePoolName = () => {
    if (!poolName.trim() || poolName === poolData?.name) return;
    updatePoolNameMutation.mutate({ id: poolId, name: poolName.trim() });
  };

  const handleAddGroup = () => {
    createGroupMutation.mutate({ poolId });
  };

  const handleAddPerson = (groupId: number) => {
    const name = newPersonNames.get(groupId)?.trim();
    if (!name) return;
    createPersonMutation.mutate({ groupId, name });
    setNewPersonNames(new Map(newPersonNames.set(groupId, "")));
  };

  const handleMovePerson = (personId: string, targetGroupId: number) => {
    updatePersonGroupMutation.mutate({ personId, groupId: targetGroupId });
  };

  const handleDraw = () => {
    if (!poolData) return;
    const totalPersons = poolData.groups.reduce((sum, g) => sum + g.persons.length, 0);
    if (totalPersons < 2) {
      alert("Il faut au moins 2 personnes pour faire le tirage");
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

  const handleDeletePerson = (personId: string) => {
    deletePersonMutation.mutate({ id: personId });
  };

  // Check if drawing has been done (any person has toId)
  const isDrawn = poolData?.groups.some((g) => g.persons.some((p) => p.toId !== null)) ?? false;

  const getPlayUrl = (personId: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/play/${personId}`;
  };

  const getAllPersons = () => {
    if (!poolData) return [];
    return poolData.groups.flatMap((g) => g.persons);
  };

  const getDrawResults = () => {
    if (!poolData) return [];
    const allPersons = getAllPersons();
    return allPersons
      .filter((p) => p.toId !== null)
      .map((p) => {
        const toPerson = allPersons.find((person) => person.id === p.toId);
        return {
          from: p.name,
          to: toPerson?.name || "Inconnu",
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
              newPersonName={newPersonNames.get(group.id) || ""}
              onNewPersonNameChange={(name) => setNewPersonNames(new Map(newPersonNames.set(group.id, name)))}
              onAddPerson={() => handleAddPerson(group.id)}
              onMovePerson={handleMovePerson}
              onDeleteGroup={() => handleDeleteGroup(group.id)}
              onDeletePerson={handleDeletePerson}
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
            isDisabled={drawPoolMutation.isPending || getAllPersons().length < 2}
            className="w-full"
          >
            {drawPoolMutation.isPending ? "Tirage en cours..." : "Effectuer le tirage au sort"}
          </Button>
        </div>
      )}

      {isDrawn && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Résultat</h2>
          <p className="text-gray-600">
            Envoyez son lien personnel à chaque personne pour qu'elle puisse voir à qui il doit offrir un cadeau :
          </p>
          <div className="space-y-2">
            {getAllPersons().map((person) => {
              const playUrl = getPlayUrl(person.id);
              const mailtoUrl = `mailto:?subject=${encodeURIComponent(
                `${person.name}, participe au tirage de ${poolData.name} !`
              )}&body=${encodeURIComponent(
                `${person.name}, pour participer au tirage de ${poolData.name}, clique sur ce lien ${playUrl}`
              )}`;
              return (
                <div key={person.id} className="max-w-3xl flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <span className="font-medium flex-1">{person.name}</span>
                  <Button
                    onPress={async () => {
                      await navigator.clipboard.writeText(playUrl);
                    }}
                  >
                    {"Copier le lien"}
                  </Button>{" "}
                  <a href={mailtoUrl} target="santagroup" className={button({ variant: "primary" })}>
                    Envoyer un e-mail
                  </a>
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
          personnes associées.
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
  newPersonName: string;
  onNewPersonNameChange: (name: string) => void;
  onAddPerson: () => void;
  onMovePerson: (personId: string, targetGroupId: number) => void;
  onDeleteGroup: () => void;
  onDeletePerson: (personId: string) => void;
}

function GroupListBox({
  group,
  isDrawn,
  newPersonName,
  onNewPersonNameChange,
  onAddPerson,
  onMovePerson,
  onDeleteGroup,
  onDeletePerson,
}: GroupListBoxProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems(keys) {
      if (isDrawn) return [];
      return Array.from(keys).map((key) => ({
        [PERSON_DRAG_TYPE]: key as string,
        "text/plain": group.persons.find((p) => p.id === key)?.name || "",
      }));
    },
    acceptedDragTypes: isDrawn ? [] : [PERSON_DRAG_TYPE],
    async onRootDrop(e) {
      if (isDrawn) return;
      const items = await Promise.all(
        e.items.filter(isTextDropItem).map(async (item) => {
          const personId = await item.getText(PERSON_DRAG_TYPE);
          return personId;
        })
      );

      for (const personId of items) {
        if (personId && group.persons.every((p) => p.id !== personId)) {
          onMovePerson(personId, group.id);
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
            if (group.persons.length === 0) {
              onDeleteGroup();
            } else if (selectedPersonId) {
              onDeletePerson(selectedPersonId);
            }
          }}
          className="max-w-fit self-end"
          isDisabled={group.persons.length > 0 && !selectedPersonId}
        >
          <Trash2 className="w-4 h-auto" />
          {group.persons.length === 0 ? <span>Supprimer le groupe</span> : <span>Supprimer la personne</span>}
        </Button>
      )}
      <ListBox
        items={group.persons}
        dragAndDropHooks={dragAndDropHooks}
        selectionMode={isDrawn ? "none" : "single"}
        selectedKeys={selectedPersonId ? [selectedPersonId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string | undefined;
          setSelectedPersonId(selected ?? null);
        }}
        className={cn("min-h-[200px] flex-1 w-full", isDrawn && "opacity-50")}
      >
        {(person: Person) => (
          <ListBoxItem id={person.id} textValue={person.name}>
            <div className="flex items-center justify-between w-full">
              <span>{person.name}</span>
            </div>
          </ListBoxItem>
        )}
      </ListBox>
      {!isDrawn && (
        <div className="flex gap-2">
          <TextField
            placeholder="Nom de la personne"
            value={newPersonName}
            onChange={onNewPersonNameChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddPerson();
              }
            }}
            className="flex-1 placeholder-shown:text-zinc-500"
          />
          <Button onPress={onAddPerson} isDisabled={!newPersonName.trim()}>
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
