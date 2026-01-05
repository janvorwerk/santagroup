import { PoolAdminClient } from "./pool-admin-client";

export default async function PoolAdminPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as it's now a Promise in Next.js
  const { id } = await params;

  // Client component will fetch the data using tRPC hooks
  return <PoolAdminClient poolId={id} cheatMode />;
}
