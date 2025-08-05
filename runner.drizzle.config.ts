import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/server/db/migrations/runner",
  dialect: "sqlite",
  schema: "./src/server/db/schemas/runner.ts",
});
