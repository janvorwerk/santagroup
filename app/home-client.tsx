"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/lib/components/Button";
import { TextField } from "@/lib/components/TextField";

const STORAGE_KEY = "recent-pools";

export function HomeClient() {
  const router = useRouter();
  const [poolName, setPoolName] = useState("");
  const [recentPoolIds, setRecentPoolIds] = useState<string[]>([]);

  const createPoolMutation = trpc.poolCreate.useMutation({
    onSuccess: (newPool) => {
      saveRecentPoolId(newPool.id);
      router.push(`/pool/${newPool.id}`);
      setPoolName("");
    },
    onError: (error) => {
      console.error("Failed to create pool", error);
      alert("Échec de la création du tirage. Veuillez réessayer.");
    },
  });

  // Fetch pool data for recent pool IDs using a single query
  const { data: poolsData, isLoading: isLoadingPools } = trpc.poolGetFullMany.useQuery(
    recentPoolIds,
    {
      enabled: recentPoolIds.length > 0,
      retry: false,
    }
  );

  const recentPools =
    poolsData?.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
    })) || [];

  useEffect(() => {
    // Load recent pool IDs from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setRecentPoolIds(ids);
        } catch (e) {
          console.error("Failed to parse recent pools", e);
        }
      }
    }
  }, []);

  const saveRecentPoolId = (poolId: string) => {
    const updated = [poolId, ...recentPoolIds.filter((id) => id !== poolId)].slice(0, 10); // Keep last 10
    setRecentPoolIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleCreatePool = () => {
    if (!poolName.trim()) return;
    createPoolMutation.mutate({ name: poolName.trim() });
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Santa Group</h1>
          <p className="text-xl text-gray-600">Organise tes échanges de cadeaux</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Créer un nouveau tirage</h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextField
                  label="Nom du tirage"
                  placeholder="Entrer le nom du tirage"
                  value={poolName}
                  onChange={setPoolName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreatePool();
                    }
                  }}
                />
              </div>
              <Button
                onPress={handleCreatePool}
                isDisabled={!poolName.trim() || createPoolMutation.isPending}
              >
                {createPoolMutation.isPending ? "En cours..." : "Créer"}
              </Button>
            </div>
          </div>

          {recentPools.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800">Tirages récents</h2>
              {isLoadingPools ? (
                <div className="text-gray-500">Chargement…</div>
              ) : (
                <div className="space-y-2">
                  {recentPools.map((pool) => (
                    <Button
                      key={pool.id}
                      onPress={() => router.push(`/pool/${pool.id}`)}
                      className="w-full justify-start text-left bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-gray-900">{pool.name}</span>
                        <span className="text-sm text-gray-500">{formatDate(pool.createdAt)}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

