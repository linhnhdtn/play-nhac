import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const sqlite = new Database(path.join(process.cwd(), 'nhac.db'))

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    media_type TEXT NOT NULL,
    src TEXT NOT NULL,
    cover_url TEXT,
    duration REAL,
    lyrics TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS liked_tracks (
    track_id TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS queue_items (
    position INTEGER NOT NULL,
    track_id TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS history_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT NOT NULL,
    played_at INTEGER DEFAULT (unixepoch())
  );
`)

export const db = drizzle(sqlite, { schema })
