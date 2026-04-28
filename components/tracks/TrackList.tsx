'use client'

import { usePlayerStore } from '@/store/playerStore'
import TrackItem from './TrackItem'
import AddTrackModal from './AddTrackModal'
import { Music } from 'lucide-react'

export default function TrackList() {
  const playlist = usePlayerStore((s) => s.playlist)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300">Thư viện</h2>
        <AddTrackModal />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {playlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
            <Music className="w-10 h-10" />
            <p className="text-sm">Chưa có bài hát nào</p>
            <p className="text-xs">Nhấn "Thêm bài hát" để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.map((track) => (
              <TrackItem key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
