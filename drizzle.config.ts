import * as dotenv from "dotenv";

import { defineConfig } from "drizzle-kit";

// Read local connection file
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  breakpoints: false,
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: true,
  },
});
