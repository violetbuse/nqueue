import { ApiStorage } from "@/server/api/db/index.ts";
import { SqliteDB } from "@/server/db/index.ts";
import { ApiCronStorageSqlite } from "@/server/api/db/sqlite/cron.ts";

export class ApiStorageSqlite implements ApiStorage {
  private cron_storage: ApiCronStorageSqlite;
  constructor(private db: SqliteDB) {
    this.cron_storage = new ApiCronStorageSqlite(this.db);
  }

  public get cron() {
    return this.cron_storage;
  }
}
