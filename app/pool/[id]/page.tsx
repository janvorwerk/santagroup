/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { PoolClient } from "./pool-client";

export default async function PoolAdminPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as it's now a Promise in Next.js
  const { id } = await params;

  // Client component will fetch the data using tRPC hooks
  return <PoolClient poolId={id} cheatMode />;
}
