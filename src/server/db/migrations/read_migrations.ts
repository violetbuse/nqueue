import * as postgres_migrations_raw from "./postgres/*.sql";
import * as sqlite_migrations_raw from "./sqlite/*.sql";

export type MigrationScript = {
  name: string;
  filename: string;
  content: string;
  statements: string[];
};

const postgres_migrations: MigrationScript[] =
  postgres_migrations_raw.default.map(({ default: migration_content }, idx) => {
    const filename = postgres_migrations_raw.filenames[idx];

    if (!filename) {
      throw new Error(`Migration filename not found at index ${idx}`);
    }

    const statements = migration_content.split("--> statement-breakpoint");

    return {
      name: filename.replace("./postgres/", "").slice(0, -4),
      filename,
      content: migration_content,
      statements,
    };
  });

const sqlite_migrations: MigrationScript[] = sqlite_migrations_raw.default.map(
  ({ default: migration_content }, idx) => {
    const filename = sqlite_migrations_raw.filenames[idx];

    if (!filename) {
      throw new Error(`Migration filename not found at index ${idx}`);
    }

    const statements = migration_content.split("--> statement-breakpoint");

    return {
      name: filename.replace("./sqlite/", "").slice(0, -4),
      filename,
      content: migration_content,
      statements,
    };
  },
);

export { postgres_migrations, sqlite_migrations };
