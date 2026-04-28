const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
]

export function extractYouTubeId(url: string): string | null {
  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}
