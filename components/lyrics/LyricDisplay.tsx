'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { LyricLine } from '@/types'

interface Props {
  lyrics: LyricLine[]
}

export default function LyricDisplay({ lyrics }: Props) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeIdx = lyrics.reduce((acc, line, i) => {
    if (line.time <= currentTime) return i
    return acc
  }, -1)

  useEffect(() => {
    if (activeIdx < 0 || !containerRef.current) return
    const el = containerRef.current.children[activeIdx] as HTMLElement
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIdx])

  if (lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Không có lyric
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-8 space-y-3 scrollbar-hide"
    >
      {lyrics.map((line, i) => (
        <p
          key={i}
          className={`text-center text-lg leading-relaxed transition-all duration-300 ${
            i === activeIdx
              ? 'text-white font-semibold scale-105'
              : i < activeIdx
              ? 'text-zinc-500'
              : 'text-zinc-400'
          }`}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}
