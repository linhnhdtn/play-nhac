import { db } from '@/db'
import { queueItems, tracks } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import type { LyricLine } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await db.select().from(queueItems).orderBy(asc(queueItems.position))
  const queue = await Promise.all(
    items.map(async (item) => {
      const track = await db.select().from(tracks).where(eq(tracks.id, item.trackId)).get()
      if (!track) return null
      return {
        id: track.id,
        title: track.title,
        artist: track.artist ?? undefined,
        mediaType: track.mediaType,
        src: track.src,
        coverUrl: track.coverUrl ?? undefined,
        lyrics: track.lyrics ? (JSON.parse(track.lyrics) as LyricLine[]) : undefined,
      }
    })
  )
  return Response.json({ queue: queue.filter(Boolean) })
}

export async function POST(request: Request) {
  const { trackId } = await request.json() as { trackId: string }

  const existing = await db.select().from(queueItems).orderBy(asc(queueItems.position))
  const nextPosition = existing.length > 0
    ? existing[existing.length - 1].position + 1
    : 0

  await db.insert(queueItems).values({ position: nextPosition, trackId })
  return Response.json({ ok: true })
}

export async function DELETE() {
  await db.delete(queueItems)
  return Response.json({ ok: true })
}
