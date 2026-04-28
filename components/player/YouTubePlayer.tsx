'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'

let apiLoaded = false

function loadYTApi(): Promise<void> {
  if (apiLoaded) return Promise.resolve()
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      resolve()
    }
  })
}

export default function YouTubePlayer() {
  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    next,
  } = usePlayerStore()

  const isYT = currentTrack?.mediaType === 'youtube'

  useEffect(() => {
    if (!isYT || !containerRef.current) return

    let mounted = true
    loadYTApi().then(() => {
      if (!mounted || !containerRef.current) return
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }

      const div = document.createElement('div')
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(div)

      playerRef.current = new window.YT.Player(div, {
        videoId: currentTrack!.src,
        playerVars: { autoplay: 1, controls: 0 },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume * 100)
            setDuration(e.target.getDuration())
            if (isPlaying) e.target.playVideo()
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setDuration(e.target.getDuration())
              if (tickRef.current) clearInterval(tickRef.current)
              tickRef.current = setInterval(() => {
                if (playerRef.current) {
                  setCurrentTime(playerRef.current.getCurrentTime())
                }
              }, 500)
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              if (tickRef.current) clearInterval(tickRef.current)
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              if (tickRef.current) clearInterval(tickRef.current)
              next()
            }
          },
        },
      })
    })

    return () => {
      mounted = false
      if (tickRef.current) clearInterval(tickRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, isYT])

  useEffect(() => {
    if (!playerRef.current || !isYT) return
    if (isPlaying) playerRef.current.playVideo()
    else playerRef.current.pauseVideo()
  }, [isPlaying, isYT])

  useEffect(() => {
    if (playerRef.current && isYT) {
      playerRef.current.setVolume(volume * 100)
    }
  }, [volume, isYT])

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-4 w-0 h-0 overflow-hidden pointer-events-none"
      aria-hidden
    />
  )
}
