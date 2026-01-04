import { PlayerClient } from "./player-client";
import { getPlayerById } from "@/lib/server/pool";
import { notFound } from "next/navigation";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as it's now a Promise in Next.js
  const { id } = await params;
  
  // Server-side validation: check if player exists
  const playerData = await getPlayerById(id);
  
  if (!playerData) {
    notFound();
  }

  // Client component will fetch the data using tRPC hooks
  return <PlayerClient playerId={id} />;
}

