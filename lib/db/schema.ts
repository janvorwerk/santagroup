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

export const player = pgTable(
  "player",
  {
    id: uuid("id")
      .primaryKey()
      .notNull()
      .default(sql`gen_random_uuid()`),
    groupId: serial("group_id").references(() => group.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    toId: uuid("to_id"),
  },

  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.toId],
        foreignColumns: [table.id],
      }),
    };
  }
);
