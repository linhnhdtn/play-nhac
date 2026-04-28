export type MediaType = 'mp3' | 'mp4' | 'youtube'

export interface LyricLine {
  time: number
  text: string
}

export interface Track {
  id: string
  title: string
  artist?: string
  mediaType: MediaType
  src: string
  lyrics?: LyricLine[]
  coverUrl?: string
  duration?: number
}
