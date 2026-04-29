'use client'

import { create } from 'zustand'
import { Track } from '@/types'
import { api } from '@/lib/api'

interface PlayerStore {
  playlist: Track[]
  queue: Track[]
  history: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  activeView: 'library' | 'queue' | 'history'
  isPlayerModalOpen: boolean
  isMusicPopupOpen: boolean
  likedTrackIds: string[]

  initialize: () => Promise<void>
  setPlaylist: (tracks: Track[]) => void
  addTrack: (track: Track) => void
  removeTrack: (id: string) => void
  playTrack: (track: Track) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  addToQueue: (track: Track) => void
  removeFromQueue: (id: string) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setIsPlaying: (playing: boolean) => void
  setActiveView: (view: 'library' | 'queue' | 'history') => void
  setPlayerModalOpen: (open: boolean) => void
  setMusicPopupOpen: (open: boolean) => void
  toggleLike: (id: string) => void
  updateTrack: (track: Track) => void
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  playlist: [],
  queue: [],
  history: [],
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  activeView: 'library',
  isPlayerModalOpen: false,
  isMusicPopupOpen: false,
  likedTrackIds: [],

  initialize: async () => {
    const [tracksData, queueData, historyData] = await Promise.all([
      api.tracks.getAll(),
      api.queue.getAll(),
      api.history.getAll(),
    ])
    set({
      playlist: tracksData.tracks,
      likedTrackIds: tracksData.likedTrackIds,
      queue: queueData.queue,
      history: historyData.history,
    })
  },

  setPlaylist: (tracks) => set({ playlist: tracks }),

  addTrack: (track) =>
    set((state) => ({ playlist: [...state.playlist, track] })),

  updateTrack: (track) =>
    set((state) => ({
      playlist: state.playlist.map((t) => (t.id === track.id ? track : t)),
      currentTrack: state.currentTrack?.id === track.id ? track : state.currentTrack,
    })),

  removeTrack: (id) => {
    api.tracks.delete(id)
    set((state) => ({
      playlist: state.playlist.filter((t) => t.id !== id),
      queue: state.queue.filter((t) => t.id !== id),
      currentTrack: state.currentTrack?.id === id ? null : state.currentTrack,
    }))
  },

  playTrack: (track) => {
    const state = get()
    if (state.currentTrack && state.currentTrack.id !== track.id) {
      api.history.add(track.id)
      set((s) => ({
        history: [s.currentTrack!, ...s.history.filter((h) => h.id !== s.currentTrack!.id)].slice(0, 50),
      }))
    } else if (!state.currentTrack) {
      api.history.add(track.id)
    }
    set({ currentTrack: track, isPlaying: true, currentTime: 0 })
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const { queue, playlist, currentTrack } = get()
    if (queue.length > 0) {
      const [next, ...rest] = queue
      if (currentTrack) {
        api.queue.remove(next.id)
        set((s) => ({ history: [currentTrack, ...s.history].slice(0, 50) }))
      }
      set({ currentTrack: next, queue: rest, isPlaying: true, currentTime: 0 })
      return
    }
    if (!currentTrack || playlist.length === 0) return
    const idx = playlist.findIndex((t) => t.id === currentTrack.id)
    const next = playlist[(idx + 1) % playlist.length]
    set((s) => ({ history: [currentTrack, ...s.history].slice(0, 50) }))
    set({ currentTrack: next, isPlaying: true, currentTime: 0 })
  },

  prev: () => {
    const { history, playlist, currentTrack } = get()
    if (history.length > 0) {
      const [prev, ...rest] = history
      set({ currentTrack: prev, history: rest, isPlaying: true, currentTime: 0 })
      return
    }
    if (!currentTrack || playlist.length === 0) return
    const idx = playlist.findIndex((t) => t.id === currentTrack.id)
    const prev = playlist[(idx - 1 + playlist.length) % playlist.length]
    set({ currentTrack: prev, isPlaying: true, currentTime: 0 })
  },

  addToQueue: (track) => {
    api.queue.add(track.id)
    set((state) => ({ queue: [...state.queue, track] }))
  },

  removeFromQueue: (id) => {
    api.queue.remove(id)
    set((state) => ({ queue: state.queue.filter((t) => t.id !== id) }))
  },

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: v }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setActiveView: (view) => set({ activeView: view }),
  setPlayerModalOpen: (open) => set({ isPlayerModalOpen: open }),
  setMusicPopupOpen: (open) => set({ isMusicPopupOpen: open }),

  toggleLike: (id) => {
    api.tracks.toggleLike(id)
    set((state) => ({
      likedTrackIds: state.likedTrackIds.includes(id)
        ? state.likedTrackIds.filter((x) => x !== id)
        : [...state.likedTrackIds, id],
    }))
  },
}))
