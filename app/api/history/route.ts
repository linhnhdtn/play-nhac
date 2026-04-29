import { db } from '@/db'
import { historyItems, tracks } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { LyricLine } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await db.select().from(historyItems).orderBy(desc(historyItems.playedAt)).limit(50)
  const history = await Promise.all(
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
  return Response.json({ history: history.filter(Boolean) })
}

export async function POST(request: Request) {
  const { trackId } = await request.json() as { trackId: string }
  await db.insert(historyItems).values({ trackId })
  return Response.json({ ok: true })
}
