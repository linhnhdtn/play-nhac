'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Upload, Link } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { parseLrcFile } from '@/lib/lrc-parser'
import { extractYouTubeId } from '@/lib/youtube'
import { api } from '@/lib/api'

export default function AddTrackModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addTrack } = usePlayerStore()

  // File tab
  const audioRef = useRef<HTMLInputElement>(null)
  const lrcRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [lrcFile, setLrcFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')

  // YouTube tab
  const [ytUrl, setYtUrl] = useState('')
  const [ytTitle, setYtTitle] = useState('')
  const [ytArtist, setYtArtist] = useState('')

  const handleAddFile = async () => {
    if (!audioFile) return
    setLoading(true)
    try {
      const ext = audioFile.name.split('.').pop()?.toLowerCase() ?? 'mp3'
      const lyrics = lrcFile ? await parseLrcFile(lrcFile) : undefined

      const formData = new FormData()
      formData.set('mediaType', ext === 'mp4' ? 'mp4' : 'mp3')
      formData.set('title', title || audioFile.name.replace(/\.[^.]+$/, ''))
      if (artist) formData.set('artist', artist)
      formData.set('audio', audioFile)
      if (coverFile) formData.set('cover', coverFile)
      if (lyrics) formData.set('lyrics', JSON.stringify(lyrics))

      const track = await api.tracks.add(formData)
      addTrack(track)
      resetFile()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddYT = async () => {
    const videoId = extractYouTubeId(ytUrl)
    if (!videoId) return alert('URL YouTube không hợp lệ')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set('mediaType', 'youtube')
      formData.set('title', ytTitle || `YouTube: ${videoId}`)
      if (ytArtist) formData.set('artist', ytArtist)
      formData.set('youtubeId', videoId)

      const track = await api.tracks.add(formData)
      addTrack(track)
      resetYT()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const resetFile = () => {
    setAudioFile(null)
    setLrcFile(null)
    setCoverFile(null)
    setTitle('')
    setArtist('')
    if (audioRef.current) audioRef.current.value = ''
    if (lrcRef.current) lrcRef.current.value = ''
    if (coverRef.current) coverRef.current.value = ''
  }

  const resetYT = () => {
    setYtUrl('')
    setYtTitle('')
    setYtArtist('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Thêm bài hát
        </Button>
      } />
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm bài hát</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList className="bg-zinc-800 w-full">
            <TabsTrigger value="file" className="flex-1 gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Tải file
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex-1 gap-1.5">
              <Link className="w-3.5 h-3.5" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-3 mt-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                File nhạc (MP3 / MP4) *
              </label>
              <input
                ref={audioRef}
                type="file"
                accept=".mp3,.mp4,audio/*"
                className="w-full text-sm text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer cursor-pointer"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                File lời (.lrc)
              </label>
              <input
                ref={lrcRef}
                type="file"
                accept=".lrc"
                className="w-full text-sm text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer cursor-pointer"
                onChange={(e) => setLrcFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Ảnh bìa (JPG / PNG)
              </label>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="w-full text-sm text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer cursor-pointer"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <input
              type="text"
              placeholder="Tên bài hát"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              type="text"
              placeholder="Tên nghệ sĩ"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <Button
              className="w-full"
              onClick={handleAddFile}
              disabled={!audioFile || loading}
            >
              {loading ? 'Đang tải...' : 'Thêm vào thư viện'}
            </Button>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-3 mt-4">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              type="text"
              placeholder="Tên bài hát"
              value={ytTitle}
              onChange={(e) => setYtTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              type="text"
              placeholder="Tên nghệ sĩ"
              value={ytArtist}
              onChange={(e) => setYtArtist(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <Button
              className="w-full"
              onClick={handleAddYT}
              disabled={!ytUrl || loading}
            >
              {loading ? 'Đang thêm...' : 'Thêm vào thư viện'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
