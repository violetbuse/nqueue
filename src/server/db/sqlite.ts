import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  sqlite_schema as schema,
  swim_sqlite_schema,
  runner_sqlite_schema,
} from "./schemas";
import {
  migrate_sqlite,
  migrate_swim_sqlite,
  migrate_runner_sqlite,
  sqlite_needs_migration,
  swim_needs_migration,
  runner_needs_migration,
} from "./migrations";
import { logger } from "../logging";

export const create_sqlite_db = (
  db_url: string,
  automatically_migrate: boolean = false,
  enable_logging: boolean = false
) => {
  const db = drizzle(db_url, {
    schema,
    logger: enable_logging,
  });

  db.$client.pragma("journal_mode = WAL");

  const needs_migration = sqlite_needs_migration(db);

  if (needs_migration) {
    if (automatically_migrate) {
      migrate_sqlite(db);
    } else {
      logger.error(
        "SQLite database needs migration, but automatic migration is disabled. Please run migrations manually."
      );
      throw new Error("SQLite database needs migration");
    }
  }

  return db;
};

export const create_swim_db = (
  swim_db_url: string,
  automatically_migrate: boolean = false
) => {
  const swim_db = drizzle(swim_db_url, {
    schema: swim_sqlite_schema,
  });

  swim_db.$client.pragma("journal_mode = WAL");

  const needs_migration = swim_needs_migration(swim_db);

  if (needs_migration) {
    if (automatically_migrate) {
      migrate_swim_sqlite(swim_db);
    } else {
      logger.error(
        "Swim SQLite database needs migration, but automatic migration is disabled. Please run migrations manually."
      );
      throw new Error("Swim SQLite database needs migration");
    }
  }

  return swim_db;
};

export const create_runner_db = (
  runner_db_url: string,
  automatically_migrate: boolean = false
) => {
  const runner_db = drizzle(runner_db_url, {
    schema: runner_sqlite_schema,
  });

  runner_db.$client.pragma("journal_mode = WAL");

  const needs_migration = runner_needs_migration(runner_db);

  if (needs_migration) {
    if (automatically_migrate) {
      migrate_runner_sqlite(runner_db);
    } else {
      logger.error(
        "Runner SQLite database needs migration, but automatic migration is disabled. Please run migrations manually."
      );
      throw new Error("Runner SQLite database needs migration");
    }
  }

  return runner_db;
};
