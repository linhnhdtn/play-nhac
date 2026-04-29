import type { Track, LyricLine } from '@/types'

export const api = {
  tracks: {
    getAll: (): Promise<{ tracks: Track[]; likedTrackIds: string[] }> =>
      fetch('/api/tracks').then((r) => r.json()),

    add: (formData: FormData): Promise<Track> =>
      fetch('/api/tracks', { method: 'POST', body: formData }).then((r) => r.json()),

    update: (id: string, formData: FormData): Promise<Track> =>
      fetch(`/api/tracks/${id}`, { method: 'PUT', body: formData }).then((r) => r.json()),

    delete: (id: string): Promise<void> =>
      fetch(`/api/tracks/${id}`, { method: 'DELETE' }).then(() => {}),

    toggleLike: (id: string): Promise<{ liked: boolean }> =>
      fetch(`/api/tracks/${id}/like`, { method: 'POST' }).then((r) => r.json()),
  },

  queue: {
    getAll: (): Promise<{ queue: Track[] }> =>
      fetch('/api/queue').then((r) => r.json()),

    add: (trackId: string): Promise<void> =>
      fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      }).then(() => {}),

    remove: (trackId: string): Promise<void> =>
      fetch(`/api/queue/${trackId}`, { method: 'DELETE' }).then(() => {}),
  },

  history: {
    getAll: (): Promise<{ history: Track[] }> =>
      fetch('/api/history').then((r) => r.json()),

    add: (trackId: string): Promise<void> =>
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      }).then(() => {}),
  },
}
