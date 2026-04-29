'use client'

import { useState } from 'react'
import { Track } from '@/types'
import { usePlayerStore } from '@/store/playerStore'
import { Button } from '@/components/ui/button'
import { Music, Play, ListEnd, Trash2, Tv2, Pencil } from 'lucide-react'
import EditTrackModal from './EditTrackModal'

interface Props {
  track: Track
}

export default function TrackItem({ track }: Props) {
  const { currentTrack, isPlaying, playTrack, addToQueue, removeTrack, setMusicPopupOpen } =
    usePlayerStore()
  const [editOpen, setEditOpen] = useState(false)

  const isActive = currentTrack?.id === track.id

  return (
    <>
      <div
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isActive ? 'bg-zinc-700' : 'hover:bg-zinc-800'
        }`}
        onDoubleClick={() => playTrack(track)}
      >
        <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : track.mediaType === 'youtube' ? (
            <Tv2 className="w-4 h-4 text-red-400" />
          ) : (
            <Music className="w-4 h-4 text-zinc-400" />
          )}
          {isActive && isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-sm animate-pulse"
                    style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>
            {track.title}
          </p>
          {track.artist && (
            <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-zinc-400 hover:text-white"
            title="Phát ngay"
            onClick={() => {
              playTrack(track)
              setMusicPopupOpen(true)
            }}
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-zinc-400 hover:text-white"
            title="Thêm vào hàng đợi"
            onClick={() => addToQueue(track)}
          >
            <ListEnd className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-zinc-400 hover:text-blue-400"
            title="Chỉnh sửa"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-zinc-400 hover:text-red-400"
            title="Xóa"
            onClick={() => removeTrack(track.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <EditTrackModal
        track={track}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}
