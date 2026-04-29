import { db } from '@/db'
import { queueItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/queue/[id]'>) {
  const { id: trackId } = await ctx.params

  // Remove first occurrence of this track in the queue
  const items = await db.select().from(queueItems).orderBy(asc(queueItems.position))
  const target = items.find((item) => item.trackId === trackId)
  if (!target) return Response.json({ error: 'Không tìm thấy' }, { status: 404 })

  await db.delete(queueItems)
    .where(eq(queueItems.position, target.position))

  return Response.json({ ok: true })
}
