import { ApiStorage } from "@/server/api/db";
import { SqliteDB } from "@/server/db";
import { ApiCronStorageSqlite } from "@/server/api/db/sqlite/cron";

export class ApiStorageSqlite implements ApiStorage {
  private cron_storage: ApiCronStorageSqlite;
  constructor(private db: SqliteDB) {
    this.cron_storage = new ApiCronStorageSqlite(this.db);
  }

  public get cron() {
    return this.cron_storage;
  }
}
