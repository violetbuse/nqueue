import { Database } from "better-sqlite3";
import {
  sqlite_migrations,
  postgres_migrations,
  swim_sqlite_migrations,
  runner_sqlite_migrations,
} from "@/server/db/migrations/read_migrations";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Sql } from "postgres";
import { asc, sql } from "drizzle-orm";

type SqliteDB = BetterSQLite3Database<Record<string, unknown>> & {
  $client: Database;
};
type PostgresDB = PostgresJsDatabase<Record<string, unknown>> & {
  $client: Sql<{}>;
};

const create_migrations_table = `
  CREATE TABLE IF NOT EXISTS migrations (
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
  );
`;

export const migrate_sqlite = (db: SqliteDB) => {
  db.run(create_migrations_table);

  const existing_migrations = db.$client.prepare(
    "SELECT * FROM migrations WHERE name = ?"
  );

  for (const migration of sqlite_migrations) {
    const { name, statements } = migration;

    const existing = existing_migrations.get(name);

    if (existing) {
      continue;
    }

    db.transaction((txn) => {
      for (const statement of statements) {
        txn.run(statement);
      }

      txn.run(
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`
      );
    });
  }
};

export const sqlite_needs_migration = (db: SqliteDB): [boolean, string[]] => {
  const result = db
    .select({ name: sql<string>`name`, applied_at: sql<number>`applied_at` })
    .from(sql`migrations`)
    .orderBy(asc(sql`name`))
    .all();

  const unapplied_migrations = sqlite_migrations.filter(
    (migration) => !result.some((r) => r.name === migration.name)
  );

  const needs_migration = unapplied_migrations.length > 0;
  const migration_names = unapplied_migrations.map((m) => m.name);

  return [needs_migration, migration_names];
};

export const migrate_swim_sqlite = (db: SqliteDB) => {
  db.run(create_migrations_table);

  const existing_migrations = db.$client.prepare(
    "SELECT * FROM migrations WHERE name = ?"
  );

  for (const migration of swim_sqlite_migrations) {
    const { name, statements } = migration;

    const existing = existing_migrations.get(name);

    if (existing) {
      continue;
    }

    db.transaction((txn) => {
      for (const statement of statements) {
        txn.run(statement);
      }

      txn.run(
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`
      );
    });
  }
};

export const swim_needs_migration = (db: SqliteDB): [boolean, string[]] => {
  const result = db
    .select({ name: sql<string>`name`, applied_at: sql<number>`applied_at` })
    .from(sql`migrations`)
    .orderBy(asc(sql`name`))
    .all();

  const unapplied_migrations = swim_sqlite_migrations.filter(
    (migration) => !result.some((r) => r.name === migration.name)
  );

  const needs_migration = unapplied_migrations.length > 0;
  const migration_names = unapplied_migrations.map((m) => m.name);

  return [needs_migration, migration_names];
};

export const migrate_runner_sqlite = (db: SqliteDB) => {
  db.run(create_migrations_table);

  const existing_migrations = db.$client.prepare(
    "SELECT * FROM migrations WHERE name = ?"
  );

  for (const migration of runner_sqlite_migrations) {
    const { name, statements } = migration;

    const existing = existing_migrations.get(name);

    if (existing) {
      continue;
    }

    db.transaction((txn) => {
      for (const statement of statements) {
        txn.run(statement);
      }

      txn.run(
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`
      );
    });
  }
};

export const runner_needs_migration = (db: SqliteDB): [boolean, string[]] => {
  const result = db
    .select({ name: sql<string>`name`, applied_at: sql<number>`applied_at` })
    .from(sql`migrations`)
    .orderBy(asc(sql`name`))
    .all();

  const unapplied_migrations = runner_sqlite_migrations.filter(
    (migration) => !result.some((r) => r.name === migration.name)
  );

  const needs_migration = unapplied_migrations.length > 0;
  const migration_names = unapplied_migrations.map((m) => m.name);

  return [needs_migration, migration_names];
};

export const migrate_postgres = async (db: PostgresDB) => {
  await db.execute(create_migrations_table);

  for (const migration of postgres_migrations) {
    const { name, statements } = migration;

    const existing = await db.execute(
      sql`SELECT * FROM migrations WHERE name = ${name}`
    );

    if (existing.length > 0) {
      continue;
    }

    db.transaction(async (txn) => {
      for (const statement of statements) {
        txn.execute(statement);
      }

      await txn.execute(
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`
      );
    });
  }
};

export const postgres_needs_migration = async (
  db: PostgresDB
): Promise<[boolean, string[]]> => {
  const result = await db
    .select({ name: sql<string>`name`, applied_at: sql<number>`applied_at` })
    .from(sql`migrations`)
    .orderBy(asc(sql`name`));

  const unapplied_migrations = postgres_migrations.filter(
    (migration) => !result.some((r) => r.name === migration.name)
  );

  const needs_migration = unapplied_migrations.length > 0;
  const migration_names = unapplied_migrations.map((m) => m.name);

  return [needs_migration, migration_names];
};
