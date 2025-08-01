import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/server/db/migrations/sqlite",
  dialect: "sqlite",
  schema: "./src/server/db/schemas/sqlite.ts",
});
