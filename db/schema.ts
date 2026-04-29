import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  mediaType: text('media_type', { enum: ['mp3', 'mp4', 'youtube'] }).notNull(),
  src: text('src').notNull(),
  coverUrl: text('cover_url'),
  duration: real('duration'),
  lyrics: text('lyrics'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
})

export const likedTracks = sqliteTable('liked_tracks', {
  trackId: text('track_id').primaryKey(),
})

export const queueItems = sqliteTable('queue_items', {
  position: integer('position').notNull(),
  trackId: text('track_id').notNull(),
})

export const historyItems = sqliteTable('history_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trackId: text('track_id').notNull(),
  playedAt: integer('played_at').default(sql`(unixepoch())`),
})
