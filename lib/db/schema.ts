import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pool = pgTable("pool", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  key: uuid("key")
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  admin: text("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
