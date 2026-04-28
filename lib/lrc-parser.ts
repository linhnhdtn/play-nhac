import { LyricLine } from '@/types'

const LRC_LINE_RE = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

export function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = []

  for (const raw of text.split('\n')) {
    const match = raw.trim().match(LRC_LINE_RE)
    if (!match) continue
    const [, mm, ss, cs, lyric] = match
    const time =
      parseInt(mm) * 60 +
      parseInt(ss) +
      parseInt(cs) / (cs.length === 3 ? 1000 : 100)
    const text = lyric.trim()
    if (text) lines.push({ time, text })
  }

  return lines.sort((a, b) => a.time - b.time)
}

export async function parseLrcFile(file: File): Promise<LyricLine[]> {
  const text = await file.text()
  return parseLrc(text)
}
