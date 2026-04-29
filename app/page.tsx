'use client'

import { useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MainContent from '@/components/layout/MainContent'
import PlayerBar from '@/components/player/PlayerBar'
import AudioPlayer from '@/components/player/AudioPlayer'
import YouTubePlayer from '@/components/player/YouTubePlayer'
import PlayerModal from '@/components/player/PlayerModal'
import MusicPopup from '@/components/player/MusicPopup'
import { usePlayerStore } from '@/store/playerStore'

export default function HomePage() {
  const initialize = usePlayerStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      <PlayerBar />
      <AudioPlayer />
      <YouTubePlayer />
      <PlayerModal />
      <MusicPopup />
    </div>
  )
}
