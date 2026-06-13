import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import * as schema from "./schema/index";

// Make the sqlite db relative to this file's location (lib/db/src/index.ts)
const sqlitePath = path.resolve(__dirname, "../sqlite.db");
const sqlite = new Database(sqlitePath);
export const db = drizzle(sqlite, { schema });

export * from "./schema/index";
