'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Music, Tv2 } from 'lucide-react'

export default function HistoryPanel() {
  const { history, playTrack } = usePlayerStore()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300">Đã nghe gần đây</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
            <Music className="w-10 h-10" />
            <p className="text-sm">Chưa có lịch sử phát</p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer"
                onDoubleClick={() => playTrack(track)}
              >
                <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  {track.mediaType === 'youtube' ? (
                    <Tv2 className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Music className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  {track.artist && (
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
