'use client'

import { usePlayerStore } from '@/store/playerStore'
import TrackList from '@/components/tracks/TrackList'
import QueuePanel from '@/components/queue/QueuePanel'
import HistoryPanel from '@/components/history/HistoryPanel'
import LyricDisplay from '@/components/lyrics/LyricDisplay'

export default function MainContent() {
  const { activeView, currentTrack } = usePlayerStore()

  const hasLyrics = currentTrack?.lyrics && currentTrack.lyrics.length > 0

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className={`flex flex-col border-r border-zinc-800 min-h-0 ${hasLyrics ? 'w-1/2' : 'w-full'}`}>
        {activeView === 'library' && <TrackList />}
        {activeView === 'queue' && <QueuePanel />}
        {activeView === 'history' && <HistoryPanel />}
      </div>

      {/* Lyric panel */}
      {hasLyrics && (
        <div className="w-1/2 bg-zinc-950 min-h-0">
          <div className="flex items-center px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Lời bài hát</h2>
            <span className="ml-2 text-xs text-zinc-500 truncate">
              — {currentTrack?.title}
            </span>
          </div>
          <div className="h-[calc(100%-48px)]">
            <LyricDisplay lyrics={currentTrack!.lyrics!} />
          </div>
        </div>
      )}
    </div>
  )
}
