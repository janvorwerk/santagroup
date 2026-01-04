"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/lib/components/Button";

interface PlayerData {
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

export function PlayerClient({ playerId }: { playerId: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Fetch player data using tRPC hook
  // Note: initialPlayerData is available from server but we let the query fetch it
  // to avoid type serialization issues. React Query will cache it.
  const { data: playerData, isLoading, error } = trpc.playerGetById.useQuery(playerId);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  if (error || !playerData) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg text-red-600">Player not found</div>
      </main>
    );
  }

  const hasAssignment = playerData.assignedTo !== null;

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {playerData.name}!</h1>
          <p className="text-gray-600">
            {hasAssignment
              ? "Click the button below to reveal who you should give a gift to."
              : "The Secret Santa drawing has not been completed yet. Please check back later."}
          </p>
        </div>

        {hasAssignment && (
          <div className="space-y-4">
            {!isRevealed ? (
              <Button onPress={handleReveal} className="w-full">
                Unveil Your Secret Santa
              </Button>
            ) : (
              <div className="text-center space-y-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-lg font-semibold text-gray-800">You should give a gift to:</p>
                <p className="text-3xl font-bold text-blue-600">
                  {playerData.assignedTo?.name || "Unknown"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

