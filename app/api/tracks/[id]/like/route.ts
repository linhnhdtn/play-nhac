import { db } from '@/db'
import { likedTracks } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, ctx: RouteContext<'/api/tracks/[id]/like'>) {
  const { id } = await ctx.params
  const existing = await db.select().from(likedTracks).where(eq(likedTracks.trackId, id)).get()

  if (existing) {
    await db.delete(likedTracks).where(eq(likedTracks.trackId, id))
    return Response.json({ liked: false })
  } else {
    await db.insert(likedTracks).values({ trackId: id })
    return Response.json({ liked: true })
  }
}
