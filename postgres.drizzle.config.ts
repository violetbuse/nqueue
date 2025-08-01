import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/server/db/migrations/postgres",
  dialect: "postgresql",
  schema: "./src/server/db/schemas/postgres.ts",
});
