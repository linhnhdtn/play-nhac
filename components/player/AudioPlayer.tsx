'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { registerAudioElement } from '@/lib/audioRef'

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    next,
  } = usePlayerStore()

  const isAudioTrack =
    currentTrack?.mediaType === 'mp3' || currentTrack?.mediaType === 'mp4'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioTrack) return
    audio.src = currentTrack.src
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentTrack?.id, isAudioTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioTrack) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying, isAudioTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  // Seek from external (e.g. clicking progress bar)
  const lastSeekRef = useRef<number>(0)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isAudioTrack) return
    if (Math.abs(currentTime - audio.currentTime) > 1.5) {
      audio.currentTime = currentTime
    }
  }, [currentTime, isAudioTrack])

  useEffect(() => {
    registerAudioElement(audioRef.current)
    return () => { registerAudioElement(null) }
  }, [])

  return (
    <audio
      ref={audioRef}
      hidden
      onTimeUpdate={(e) => {
        const t = (e.target as HTMLAudioElement).currentTime
        setCurrentTime(t)
        lastSeekRef.current = t
      }}
      onDurationChange={(e) =>
        setDuration((e.target as HTMLAudioElement).duration)
      }
      onEnded={() => {
        setIsPlaying(false)
        next()
      }}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
    />
  )
}
