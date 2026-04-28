'use client'

import { usePlayerStore } from '@/store/playerStore'
import { Button } from '@/components/ui/button'
import { Music, X, Tv2 } from 'lucide-react'

export default function QueuePanel() {
  const { queue, removeFromQueue, playTrack } = usePlayerStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300">
          Hàng đợi ({queue.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
            <Music className="w-10 h-10" />
            <p className="text-sm">Hàng đợi trống</p>
          </div>
        ) : (
          <div className="space-y-1">
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer"
                onDoubleClick={() => playTrack(track)}
              >
                <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  onClick={() => removeFromQueue(track.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
