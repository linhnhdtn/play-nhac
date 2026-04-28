'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  Maximize2,
} from 'lucide-react'

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    setVolume,
    setCurrentTime,
    setPlayerModalOpen,
    setMusicPopupOpen,
  } = usePlayerStore()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (val: number | readonly number[]) => {
    const v = Array.isArray(val) ? (val as number[])[0] : (val as number)
    const t = (v / 100) * duration
    setCurrentTime(t)
  }

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center gap-4">
      {/* Track info */}
      <button
        className="flex items-center gap-3 w-56 min-w-0 group cursor-pointer text-left"
        onClick={() => currentTrack && setPlayerModalOpen(true)}
        disabled={!currentTrack}
      >
        <div className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">
            {currentTrack?.title ?? 'Chưa chọn bài'}
          </p>
          {currentTrack?.artist && (
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
          )}
        </div>
        {currentTrack && (
          <ChevronUp className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
        )}
      </button>

      {/* Cinematic popup trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="text-zinc-400 hover:text-white flex-shrink-0"
        onClick={() => currentTrack && setMusicPopupOpen(true)}
        disabled={!currentTrack}
        title="Mở popup nhạc"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={prev}
            disabled={!currentTrack}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-40"
            onClick={togglePlay}
            disabled={!currentTrack}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 translate-x-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={next}
            disabled={!currentTrack}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
        <div className="w-full max-w-lg flex items-center gap-2">
          <span className="text-xs text-zinc-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="flex-1"
            disabled={!currentTrack || duration === 0}
          />
          <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-36">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <Slider
          value={[volume * 100]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? (val as number[])[0] : (val as number)
            setVolume(v / 100)
          }}
          max={100}
          step={1}
          className="w-24"
        />
      </div>
    </div>
  )
}
