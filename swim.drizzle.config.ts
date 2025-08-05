import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/server/db/migrations/swim",
  dialect: "sqlite",
  schema: "./src/server/db/schemas/swim.ts",
});
