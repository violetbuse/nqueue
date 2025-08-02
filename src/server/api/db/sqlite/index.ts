import { ApiStorage } from "..";
import { SqliteDB } from "../../../db";
import { ApiCronStorageSqlite } from "./cron";

export class ApiStorageSqlite implements ApiStorage {
  private cron_storage: ApiCronStorageSqlite;
  constructor(private db: SqliteDB) {
    this.cron_storage = new ApiCronStorageSqlite(this.db);
  }

  public get cron() {
    return this.cron_storage;
  }
}
