import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA, SCHEMA_VERSION } from "./schema";

type SqliteDb = DatabaseSync;

const globalForDb = globalThis as unknown as { meridianDb?: SqliteDb };

export function resolveDbPath() {
  const configured = process.env.DATABASE_PATH;
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), "data", "meridian.db");
}

function open(file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

function currentVersion(db: SqliteDb) {
  try {
    const row = db.prepare("SELECT version FROM schema_meta LIMIT 1").get() as { version?: number } | undefined;
    return row?.version ?? 0;
  } catch {
    return 0;
  }
}

export function getDb() {
  if (globalForDb.meridianDb) return globalForDb.meridianDb;
  const file = resolveDbPath();
  let db = open(file);
  const version = currentVersion(db);
  if (version !== SCHEMA_VERSION) {
    db.close();
    for (const extra of ["", "-wal", "-shm"]) {
      const target = extra ? `${file}${extra}` : file;
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }
    db = open(file);
    db.exec(SCHEMA);
    db.prepare("INSERT INTO schema_meta (version) VALUES (?)").run(SCHEMA_VERSION);
  } else {
    db.exec(SCHEMA);
  }
  globalForDb.meridianDb = db;
  return db;
}

export function resetDbCache() {
  globalForDb.meridianDb?.close();
  globalForDb.meridianDb = undefined;
}

export function all<T>(sql: string, params: unknown[] = []) {
  return getDb().prepare(sql).all(...params) as T[];
}

export function one<T>(sql: string, params: unknown[] = []) {
  return (getDb().prepare(sql).get(...params) as T | undefined) ?? null;
}

export function run(sql: string, params: unknown[] = []) {
  return getDb().prepare(sql).run(...params);
}

export function tx<T>(fn: (db: SqliteDb) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
