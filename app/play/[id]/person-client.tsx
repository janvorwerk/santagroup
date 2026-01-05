"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/lib/components/Button";

interface PersonData {
  id: string;
  name: string;
  groupId: number;
  toId: string | null;
  assignedTo: {
    id: string;
    name: string;
    groupId: number;
    toId: string | null;
  } | null;
}

export function PersonClient({ personId }: { personId: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Fetch person data using tRPC hook
  // Note: initialPersonData is available from server but we let the query fetch it
  // to avoid type serialization issues. React Query will cache it.
  const { data: personData, isLoading, error } = trpc.personGetById.useQuery(personId);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  if (isLoading) {
    return (
      <main className="flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </main>
    );
  }

  if (error || !personData) {
    return (
      <main className="flex items-center justify-center">
        <div className="text-lg text-red-600">Personne introuvable</div>
      </main>
    );
  }

  const hasAssignment = personData.assignedTo !== null;

  return (
    <main className="flex items-center justify-center">
      <div className="w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {personData.name} !</h1>
          <p className="text-gray-600">
            {hasAssignment
              ? "Cliquez sur le bouton ci-dessous pour découvrir à qui vous devez offrir un cadeau."
              : "Le tirage au sort n'a pas encore été effectué. Veuillez revenir plus tard."}
          </p>
        </div>

        {hasAssignment && (
          <div className="space-y-4">
            {!isRevealed ? (
              <Button onPress={handleReveal} className="w-full">
                Révéler votre Secret Santa
              </Button>
            ) : (
              <div className="text-center space-y-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-lg font-semibold text-gray-800">Vous devez offrir un cadeau à :</p>
                <p className="text-3xl font-bold text-blue-600">
                  {personData.assignedTo?.name || "Inconnu"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

