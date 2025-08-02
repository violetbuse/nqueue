import { Database } from "better-sqlite3";
import { sqlite_migrations, postgres_migrations } from "./read_migrations";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Sql } from "postgres";
import { sql } from "drizzle-orm";

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
    "SELECT * FROM migrations WHERE name = ?",
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
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`,
      );
    });
  }
};

export const migrate_postgres = async (db: PostgresDB) => {
  await db.execute(create_migrations_table);

  for (const migration of postgres_migrations) {
    const { name, statements } = migration;

    const existing = await db.execute(
      sql`SELECT * FROM migrations WHERE name = ${name}`,
    );

    if (existing.length > 0) {
      continue;
    }

    db.transaction(async (txn) => {
      for (const statement of statements) {
        txn.execute(statement);
      }

      await txn.execute(
        sql`INSERT INTO migrations (name, applied_at) VALUES (${name}, ${Date.now()});`,
      );
    });
  }
};
