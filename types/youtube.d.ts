declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1
    [key: string]: unknown
  }

  interface PlayerEvent {
    target: Player
    data: number
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: PlayerEvent) => void
  }

  interface PlayerOptions {
    videoId?: string
    playerVars?: PlayerVars
    events?: Events
  }

  class Player {
    constructor(el: HTMLElement | string, options: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    destroy(): void
    getCurrentTime(): number
    getDuration(): number
    setVolume(volume: number): void
    getPlayerState(): PlayerState
  }
}

interface Window {
  YT: typeof YT
  onYouTubeIframeAPIReady: () => void
}
