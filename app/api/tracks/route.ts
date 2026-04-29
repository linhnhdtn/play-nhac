import { db } from '@/db'
import { tracks, likedTracks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { parseLrc } from '@/lib/lrc-parser'
import type { LyricLine } from '@/types'

const execFileAsync = promisify(execFile)

async function generateLyricsFromAudio(
  audioPath: string,
  uploadsDir: string,
  srtBasename: string,
  title: string
): Promise<string | null> {
  const convertScript = path.join(process.cwd(), 'convert.py')
  const srtPath = path.join(uploadsDir, `${srtBasename}.srt`)
  const lrcPath = path.join(uploadsDir, `${srtBasename}.lrc`)

  try {
    await execFileAsync('whisper', [
      audioPath,
      '--model', 'base',
      '--language', 'Vietnamese',
      '--output_format', 'srt',
      '--output_dir', uploadsDir,
    ])

    await execFileAsync('python3', [convertScript, srtPath, title])

    const lrcContent = await readFile(lrcPath, 'utf-8')
    const lyricLines = parseLrc(lrcContent)
    return lyricLines.length > 0 ? JSON.stringify(lyricLines) : null
  } catch (err) {
    console.error('[whisper/convert] Lỗi tạo lyrics tự động:', err)
    return null
  } finally {
    await Promise.allSettled([
      unlink(srtPath).catch(() => {}),
      unlink(lrcPath).catch(() => {}),
    ])
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const allTracks = await db.select().from(tracks).orderBy(tracks.createdAt)
  const liked = await db.select().from(likedTracks)
  const likedSet = new Set(liked.map((l) => l.trackId))

  const result = allTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist ?? undefined,
    mediaType: t.mediaType,
    src: t.src,
    coverUrl: t.coverUrl ?? undefined,
    duration: t.duration ?? undefined,
    lyrics: t.lyrics ? (JSON.parse(t.lyrics) as LyricLine[]) : undefined,
  }))

  return Response.json({ tracks: result, likedTrackIds: [...likedSet] })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const mediaType = formData.get('mediaType') as string
  const title = formData.get('title') as string
  const artist = formData.get('artist') as string | null
  const lyricsJson = formData.get('lyrics') as string | null

  const id = generateId()
  let src = ''
  let coverUrl: string | null = null
  let autoLyricsJson: string | null = null

  if (mediaType === 'youtube') {
    src = formData.get('youtubeId') as string
  } else {
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) return Response.json({ error: 'Thiếu file audio' }, { status: 400 })

    const ext = audioFile.name.split('.').pop()?.toLowerCase() ?? 'mp3'
    const audioFilename = `${id}-audio.${ext}`
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    await writeFile(path.join(process.cwd(), 'public/uploads', audioFilename), audioBuffer)
    src = `/uploads/${audioFilename}`

    if (!lyricsJson) {
      const audioAbsPath = path.join(process.cwd(), 'public/uploads', audioFilename)
      const uploadsDir = path.join(process.cwd(), 'public/uploads')
      const srtBasename = audioFilename.replace(/\.[^.]+$/, '')
      autoLyricsJson = await generateLyricsFromAudio(audioAbsPath, uploadsDir, srtBasename, title)
    }
  }

  const coverFile = formData.get('cover') as File | null
  if (coverFile) {
    const ext = coverFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const coverFilename = `${id}-cover.${ext}`
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
    await writeFile(path.join(process.cwd(), 'public/uploads', coverFilename), coverBuffer)
    coverUrl = `/uploads/${coverFilename}`
  }

  await db.insert(tracks).values({
    id,
    title,
    artist: artist || null,
    mediaType: mediaType as 'mp3' | 'mp4' | 'youtube',
    src,
    coverUrl,
    lyrics: lyricsJson || autoLyricsJson || null,
  })

  const created = await db.select().from(tracks).where(eq(tracks.id, id)).get()
  return Response.json({
    id: created!.id,
    title: created!.title,
    artist: created!.artist ?? undefined,
    mediaType: created!.mediaType,
    src: created!.src,
    coverUrl: created!.coverUrl ?? undefined,
    lyrics: created!.lyrics ? JSON.parse(created!.lyrics) : undefined,
  })
}
