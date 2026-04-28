'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { Slider } from '@/components/ui/slider'
import { formatTime } from '@/lib/utils'
import {
  X,
  Bookmark,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Music,
  Video,
  Square,
  Download,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useRecorder } from '@/hooks/useRecorder'

export default function PlayerModal() {
  const {
    isPlayerModalOpen,
    setPlayerModalOpen,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    setCurrentTime,
    setVolume,
  } = usePlayerStore()

  const prevVolumeRef = useRef(0.8)

  const popupRef = useRef<HTMLDivElement>(null)
  const { isRecording, recordingTime, recordedBlob, startRecording, stopRecording, downloadRecording, clearRecording } = useRecorder(popupRef)

  const fmtRecTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

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
    // getBoundingClientRect gives viewport-relative positions;
    // subtract container's rect and add current scrollTop for container-relative offset
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const relativeTop = elRect.top - containerRect.top + container.scrollTop
    const target = relativeTop - (container.clientHeight - el.offsetHeight) / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [activeIdx])

  if (!isPlayerModalOpen) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (val: number | readonly number[]) => {
    const v = Array.isArray(val) ? (val as number[])[0] : (val as number)
    setCurrentTime((v / 100) * duration)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setPlayerModalOpen(false)}
    >
      <div
        ref={popupRef}
        className="relative w-[390px] h-[780px] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background: blurred album art */}
        {currentTrack?.coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-70"
            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-8 pt-10 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (isRecording) {
                  stopRecording()
                } else {
                  setPlayerModalOpen(false)
                  clearRecording()
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {isRecording ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-red-400 tabular-nums">
                  {fmtRecTime(recordingTime)}
                </span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                Mỗi ngày một bài nhạc hay
              </p>
            )}

            <div className="flex items-center gap-1.5">
              {recordedBlob && !isRecording && (
                <button
                  onClick={downloadRecording}
                  title="Tải video"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecording()
                  } else {
                    clearRecording()
                    startRecording()
                  }
                }}
                disabled={!currentTrack}
                title={isRecording ? 'Dừng quay' : 'Quay video'}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                  isRecording
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isRecording ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Album Art */}
          <div className="flex justify-center mb-5 flex-shrink-0">
            <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-2xl bg-zinc-700 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
              {currentTrack?.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-16 h-16 text-zinc-400" />
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white leading-tight truncate px-2">
              {currentTrack?.title ?? 'Chưa chọn bài'}
            </h2>
            {currentTrack?.artist && (
              <p className="text-sm text-zinc-300 mt-1">{currentTrack.artist}</p>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4 flex-shrink-0">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              disabled={!currentTrack || duration === 0}
              className="mb-1"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-5 flex-shrink-0">
            <button
              onClick={() => {
                if (volume > 0) {
                  prevVolumeRef.current = volume
                  setVolume(0)
                } else {
                  setVolume(prevVolumeRef.current || 0.8)
                }
              }}
              disabled={!currentTrack}
              className="text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={prev}
              disabled={!currentTrack}
              className="text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-7 h-7" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-40 shadow-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 translate-x-0.5" />
              )}
            </button>
            <button
              onClick={next}
              disabled={!currentTrack}
              className="text-zinc-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-7 h-7" />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Lyrics */}
          {lyrics.length > 0 ? (
            <div
              ref={lyricsRef}
              className="flex-1 overflow-y-auto space-y-2 scrollbar-hide"
            >
              {lyrics.map((line, i) => (
                <p
                  key={i}
                  className={`text-center leading-relaxed transition-colors duration-300 ${
                    i === activeIdx
                      ? 'text-white font-semibold text-base'
                      : i < activeIdx
                      ? 'text-zinc-500 text-sm'
                      : 'text-zinc-400 text-sm'
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
    </div>
  )
}
