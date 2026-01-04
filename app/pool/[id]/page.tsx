import { PoolAdminClient } from "./pool-admin-client";
import { getPoolFull } from "@/lib/server/pool";
import { notFound } from "next/navigation";

export default async function PoolAdminPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as it's now a Promise in Next.js
  const { id } = await params;
  
  // Server-side validation: check if pool exists
  const poolData = await getPoolFull(id);
  
  if (!poolData) {
    notFound();
  }

  // Client component will fetch the data using tRPC hooks
  return <PoolAdminClient poolId={id} />;
}

