import { db } from '@/db'
import { tracks, likedTracks, queueItems, historyItems } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { unlink, writeFile } from 'fs/promises'
import path from 'path'
import type { LyricLine } from '@/types'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, ctx: RouteContext<'/api/tracks/[id]'>) {
  const { id } = await ctx.params
  const track = await db.select().from(tracks).where(eq(tracks.id, id)).get()
  if (!track) return Response.json({ error: 'Không tìm thấy' }, { status: 404 })

  const formData = await request.formData()
  const title = formData.get('title') as string | null
  const artist = formData.get('artist') as string | null
  const lyricsJson = formData.get('lyrics') as string | null
  const removeCover = formData.get('removeCover') === 'true'
  const clearLyrics = formData.get('clearLyrics') === 'true'

  const patch: Partial<typeof track> = {}
  if (title !== null) patch.title = title
  if (artist !== null) patch.artist = artist || null
  if (clearLyrics) patch.lyrics = null
  else if (lyricsJson !== null) patch.lyrics = lyricsJson

  // Replace audio file (non-YouTube only)
  const audioFile = formData.get('audio') as File | null
  if (audioFile && track.mediaType !== 'youtube') {
    if (track.src.startsWith('/uploads/')) {
      await unlink(path.join(process.cwd(), 'public', track.src)).catch(() => {})
    }
    const ext = audioFile.name.split('.').pop()?.toLowerCase() ?? 'mp3'
    const filename = `${id}-audio.${ext}`
    await writeFile(path.join(process.cwd(), 'public/uploads', filename), Buffer.from(await audioFile.arrayBuffer()))
    patch.src = `/uploads/${filename}`
  }

  // Replace or remove cover
  const coverFile = formData.get('cover') as File | null
  if (coverFile) {
    if (track.coverUrl?.startsWith('/uploads/')) {
      await unlink(path.join(process.cwd(), 'public', track.coverUrl)).catch(() => {})
    }
    const ext = coverFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${id}-cover.${ext}`
    await writeFile(path.join(process.cwd(), 'public/uploads', filename), Buffer.from(await coverFile.arrayBuffer()))
    patch.coverUrl = `/uploads/${filename}`
  } else if (removeCover && track.coverUrl?.startsWith('/uploads/')) {
    await unlink(path.join(process.cwd(), 'public', track.coverUrl)).catch(() => {})
    patch.coverUrl = null
  }

  if (Object.keys(patch).length > 0) {
    await db.update(tracks).set(patch).where(eq(tracks.id, id))
  }

  const updated = await db.select().from(tracks).where(eq(tracks.id, id)).get()
  return Response.json({
    id: updated!.id,
    title: updated!.title,
    artist: updated!.artist ?? undefined,
    mediaType: updated!.mediaType,
    src: updated!.src,
    coverUrl: updated!.coverUrl ?? undefined,
    lyrics: updated!.lyrics ? (JSON.parse(updated!.lyrics) as LyricLine[]) : undefined,
  })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/tracks/[id]'>) {
  const { id } = await ctx.params
  const track = await db.select().from(tracks).where(eq(tracks.id, id)).get()
  if (!track) return Response.json({ error: 'Không tìm thấy' }, { status: 404 })

  if (track.src.startsWith('/uploads/')) {
    await unlink(path.join(process.cwd(), 'public', track.src)).catch(() => {})
  }
  if (track.coverUrl?.startsWith('/uploads/')) {
    await unlink(path.join(process.cwd(), 'public', track.coverUrl)).catch(() => {})
  }

  await db.delete(tracks).where(eq(tracks.id, id))
  await db.delete(likedTracks).where(eq(likedTracks.trackId, id))
  await db.delete(queueItems).where(eq(queueItems.trackId, id))
  await db.delete(historyItems).where(eq(historyItems.trackId, id))
  return Response.json({ ok: true })
}
