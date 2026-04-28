'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { formatTime } from '@/lib/utils'
import {
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Heart,
  ListMusic,
  Music,
} from 'lucide-react'
import { getAudioElement } from '@/lib/audioRef'

const BARS = Array.from({ length: 32 }, (_, i) => ({
  height: 20 + ((i * 13 + 7) % 40),
  delay: ((i * 0.05) % 0.8).toFixed(2),
  duration: (0.4 + ((i * 7 + 3) % 5) * 0.08).toFixed(2),
}))

export default function MusicPopup() {
  const {
    isMusicPopupOpen,
    setMusicPopupOpen,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    likedTrackIds,
    toggleLike,
  } = usePlayerStore()

  const lyricsRef = useRef<HTMLDivElement>(null)
  const lyrics = currentTrack?.lyrics ?? []

  const activeIdx = lyrics.reduce((acc, line, i) => {
    if (line.time <= currentTime) return i
    return acc
  }, -1)

  useEffect(() => {
    if (activeIdx < 0 || !lyricsRef.current) return
    const container = lyricsRef.current
    const el = container.children[activeIdx] as HTMLElement
    if (!el) return
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const relativeTop = elRect.top - containerRect.top + container.scrollTop
    const target = relativeTop - (container.clientHeight - el.offsetHeight) / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [activeIdx])

  if (!isMusicPopupOpen) return null

  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-50"
      onClick={() => setMusicPopupOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className="relative w-[880px] h-[460px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background: blurred cover art */}
        {currentTrack?.coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-60"
            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-zinc-900" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Close button */}
        <button
          onClick={() => setMusicPopupOpen(false)}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 min-h-0 gap-0">
          {/* Left panel */}
          <div className="w-[42%] flex flex-col justify-center px-8 py-6 gap-4 flex-shrink-0">
            <div>
              <h2 className="italic text-xl font-medium text-gray-200 tracking-wide">
                🎶 Mỗi ngày một bản nhạc hay
              </h2>
            </div>
            <div></div>
            <div></div>
            {/* Title + artist */}
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                {currentTrack?.title ?? 'Chưa chọn bài'}
              </h2>
              {currentTrack?.artist && (
                <p className="text-base text-zinc-300 mt-1">{currentTrack.artist}</p>
              )}
            </div>

            {/* Dual album art panels */}
            <div className="flex items-center -space-x-4">
              {/* Square panel */}
              <div className="relative z-10 w-[118px] h-[118px] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20 flex-shrink-0 bg-zinc-700 flex items-center justify-center">
                {currentTrack?.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-10 h-10 text-zinc-400" />
                )}
              </div>

              {/* Vinyl disc panel — always rotates while popup open */}
              <div className="relative w-[128px] h-[128px] flex-shrink-0 vinyl-spin">
                {/* Disc background */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at center, #2a2a2a 28%, #111 62%, #1c1c1c 100%)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                />
                {/* Sheen highlight (asymmetric — makes rotation visible) */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.08) 30deg, transparent 90deg, transparent 200deg, rgba(255,255,255,0.05) 240deg, transparent 300deg)',
                  }}
                />
                {/* Album art circle (≈64% of disc) */}
                <div className="absolute inset-[18%] rounded-full overflow-hidden ring-1 ring-white/10">
                  {currentTrack?.coverUrl ? (
                    <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <Music className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                </div>
                {/* Center hole */}
                <div className="absolute inset-[44%] rounded-full bg-white/85 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Right panel: Lyrics */}
          <div className="flex-1 py-6 pr-10 flex flex-col min-h-0">
            {lyrics.length > 0 ? (
              <div
                ref={lyricsRef}
                className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-2"
              >
                {lyrics.map((line, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed transition-all duration-300 ${
                      i === activeIdx
                        ? 'text-cyan-300 font-semibold text-base scale-[1.03] origin-left'
                        : 'text-white/50 text-sm'
                    }`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">Không có lyric</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 px-8 pt-3">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const t = parseFloat(e.target.value)
              const audio = getAudioElement()
              if (audio) audio.currentTime = t
            }}
            className="w-full h-1 appearance-none rounded-full cursor-pointer accent-cyan-400"
            style={{
              background: `linear-gradient(to right, rgb(34 211 238) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.15) 0%)`,
            }}
          />
        </div>

        {/* Bottom bar: waveform + controls */}
        <div className="relative z-10 flex items-center gap-4 px-8 py-3 border-t border-white/10">
          {/* Waveform */}
          <div className="flex items-end gap-[2px] h-8 flex-shrink-0">
            {BARS.map((bar, i) => (
              <span
                key={i}
                className="inline-block w-[3px] rounded-full bg-cyan-400/70 origin-bottom"
                style={{
                  height: `${bar.height}%`,
                  animation: isPlaying
                    ? `waveBar ${bar.duration}s ease-in-out ${bar.delay}s infinite`
                    : 'none',
                  transform: isPlaying ? undefined : 'scaleY(0.3)',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            <button
              onClick={() => currentTrack && toggleLike(currentTrack.id)}
              disabled={!currentTrack}
              className="text-zinc-400 hover:text-rose-400 disabled:opacity-40 transition-colors"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
            <button
              onClick={prev}
              disabled={!currentTrack}
              className="text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-40 shadow-lg transition-colors flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 translate-x-0.5" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!currentTrack}
              className="text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Time */}
          <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
