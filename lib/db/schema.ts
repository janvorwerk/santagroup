/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { sql } from "drizzle-orm";
import { serial, pgTable, text, timestamp, uuid, foreignKey } from "drizzle-orm/pg-core";

export const pool = pgTable("pool", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const group = pgTable("group", {
  id: serial("id").primaryKey(),
  poolId: uuid("pool_id").references(() => pool.id, { onDelete: "cascade" }),
});

export const person = pgTable(
  "person",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    groupId: serial("group_id").references(() => group.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    toId: uuid("to_id"),
  },

  (table) => [
    foreignKey({
      columns: [table.toId],
      foreignColumns: [table.id],
    }),
  ]
);
