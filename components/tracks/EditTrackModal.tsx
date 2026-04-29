'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Music, Tv2, X, Upload, FileAudio, FileText, Pencil } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { parseLrc, parseLrcFile, lyricsToLrc } from '@/lib/lrc-parser'
import { api } from '@/lib/api'
import type { Track } from '@/types'

interface Props {
  track: Track
  open: boolean
  onClose: () => void
}

type LrcMode = 'file' | 'direct'

export default function EditTrackModal({ track, open, onClose }: Props) {
  const { updateTrack } = usePlayerStore()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [title, setTitle] = useState(track.title)
  const [artist, setArtist] = useState(track.artist ?? '')

  // Cover
  const coverRef = useRef<HTMLInputElement>(null)
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(track.coverUrl ?? null)
  const [removeCover, setRemoveCover] = useState(false)

  // Audio (non-YouTube only)
  const audioRef = useRef<HTMLInputElement>(null)
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null)

  // LRC
  const lrcRef = useRef<HTMLInputElement>(null)
  const [lrcMode, setLrcMode] = useState<LrcMode>('file')
  const [newLrcFile, setNewLrcFile] = useState<File | null>(null)
  const [clearLyrics, setClearLyrics] = useState(false)
  const [lrcText, setLrcText] = useState('')
  const hasLyrics = Boolean(track.lyrics?.length)

  useEffect(() => {
    setTitle(track.title)
    setArtist(track.artist ?? '')
    setCoverPreview(track.coverUrl ?? null)
    setNewCoverFile(null)
    setNewAudioFile(null)
    setNewLrcFile(null)
    setRemoveCover(false)
    setClearLyrics(false)
    setLrcMode('file')
    setLrcText('')
    setNotice(null)
  }, [track])

  const handleCoverChange = (file: File | null) => {
    setNewCoverFile(file)
    setRemoveCover(false)
    if (file) {
      setCoverPreview(URL.createObjectURL(file))
    } else {
      setCoverPreview(track.coverUrl ?? null)
    }
  }

  const handleRemoveCover = () => {
    setRemoveCover(true)
    setNewCoverFile(null)
    setCoverPreview(null)
    if (coverRef.current) coverRef.current.value = ''
  }

  const handleSwitchToDirect = () => {
    setLrcMode('direct')
    // Pre-fill with current lyrics if textarea is empty
    if (!lrcText && track.lyrics?.length) {
      setLrcText(lyricsToLrc(track.lyrics))
    }
    setNewLrcFile(null)
    setClearLyrics(false)
    if (lrcRef.current) lrcRef.current.value = ''
  }

  const handleSwitchToFile = () => {
    setLrcMode('file')
  }

  const handleSave = async () => {
    setLoading(true)
    setNotice(null)
    try {
      const formData = new FormData()
      formData.set('title', title.trim() || track.title)
      formData.set('artist', artist.trim())

      if (newCoverFile) formData.set('cover', newCoverFile)
      if (removeCover) formData.set('removeCover', 'true')

      if (track.mediaType !== 'youtube' && newAudioFile) {
        formData.set('audio', newAudioFile)
      }

      if (lrcMode === 'direct') {
        if (lrcText.trim()) {
          formData.set('lyrics', JSON.stringify(parseLrc(lrcText)))
        } else {
          formData.set('clearLyrics', 'true')
        }
      } else {
        if (newLrcFile) {
          formData.set('lyrics', JSON.stringify(await parseLrcFile(newLrcFile)))
        } else if (clearLyrics) {
          formData.set('clearLyrics', 'true')
        }
      }

      const updated = await api.tracks.update(track.id, formData)
      updateTrack(updated)
      setNotice({ type: 'success', msg: 'Đã lưu thành công!' })
    } catch {
      setNotice({ type: 'error', msg: 'Lưu thất bại. Vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài hát</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover */}
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : track.mediaType === 'youtube' ? (
                <Tv2 className="w-8 h-8 text-red-400" />
              ) : (
                <Music className="w-8 h-8 text-zinc-500" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-zinc-400 font-medium">Ảnh bìa</p>
              <div className="flex gap-2 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2.5 py-1.5 transition-colors">
                  <Upload className="w-3 h-3" />
                  {coverPreview ? 'Thay ảnh' : 'Chọn ảnh'}
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)}
                  />
                </label>
                {(coverPreview || track.coverUrl) && (
                  <button
                    onClick={handleRemoveCover}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2.5 py-1.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Tên bài hát</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nghệ sĩ</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Không rõ"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          {/* Audio file (non-YouTube) */}
          {track.mediaType !== 'youtube' && (
            <div>
              <label className="text-xs text-zinc-400 block mb-1">File nhạc (MP3 / MP4)</label>
              <label className="cursor-pointer flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 hover:bg-zinc-700 transition-colors">
                <FileAudio className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300 truncate">
                  {newAudioFile ? newAudioFile.name : 'Giữ nguyên file hiện tại'}
                </span>
                <input
                  ref={audioRef}
                  type="file"
                  accept=".mp3,.mp4,audio/*"
                  className="hidden"
                  onChange={(e) => setNewAudioFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {/* LRC section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400 font-medium">
                Lời bài hát
                {hasLyrics && lrcMode === 'file' && !clearLyrics && (
                  <span className="ml-2 text-green-400">● Đang có lời</span>
                )}
                {clearLyrics && (
                  <span className="ml-2 text-red-400">● Sẽ xóa lời</span>
                )}
              </label>

              {/* Mode toggle */}
              <div className="flex rounded overflow-hidden border border-zinc-700 text-xs">
                <button
                  onClick={handleSwitchToFile}
                  className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                    lrcMode === 'file'
                      ? 'bg-zinc-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Upload file
                </button>
                <button
                  onClick={handleSwitchToDirect}
                  className={`flex items-center gap-1 px-2.5 py-1 transition-colors border-l border-zinc-700 ${
                    lrcMode === 'direct'
                      ? 'bg-zinc-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  <Pencil className="w-3 h-3" />
                  Chỉnh sửa
                </button>
              </div>
            </div>

            {/* Upload mode */}
            {lrcMode === 'file' && (
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 hover:bg-zinc-700 transition-colors">
                  <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate">
                    {newLrcFile ? newLrcFile.name : 'Chọn file .lrc'}
                  </span>
                  <input
                    ref={lrcRef}
                    type="file"
                    accept=".lrc"
                    className="hidden"
                    onChange={(e) => {
                      setNewLrcFile(e.target.files?.[0] ?? null)
                      setClearLyrics(false)
                    }}
                  />
                </label>
                {(hasLyrics || newLrcFile) && !clearLyrics && (
                  <button
                    onClick={() => {
                      setClearLyrics(true)
                      setNewLrcFile(null)
                      if (lrcRef.current) lrcRef.current.value = ''
                    }}
                    className="text-xs text-red-400 hover:text-red-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2.5 py-2 transition-colors flex-shrink-0"
                  >
                    Xóa lời
                  </button>
                )}
                {clearLyrics && (
                  <button
                    onClick={() => setClearLyrics(false)}
                    className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded px-2.5 py-2 transition-colors flex-shrink-0"
                  >
                    Hoàn tác
                  </button>
                )}
              </div>
            )}

            {/* Direct edit mode */}
            {lrcMode === 'direct' && (
              <div className="space-y-1.5">
                <textarea
                  value={lrcText}
                  onChange={(e) => setLrcText(e.target.value)}
                  spellCheck={false}
                  placeholder={`[00:10.00]Lời dòng đầu tiên\n[00:15.50]Lời dòng tiếp theo\n...`}
                  className="w-full h-44 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-zinc-500 resize-none leading-relaxed placeholder:text-zinc-600"
                />
                <p className="text-xs text-zinc-500">
                  Định dạng: <code className="text-zinc-400">[mm:ss.cs]nội dung</code> — mỗi dòng một câu.
                  {lrcText.trim() === '' && hasLyrics && (
                    <span className="ml-1 text-amber-400">Để trống sẽ xóa toàn bộ lời.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {notice && (
          <p className={`text-sm text-center rounded px-3 py-2 ${
            notice.type === 'success'
              ? 'bg-green-950 text-green-400 border border-green-800'
              : 'bg-red-950 text-red-400 border border-red-800'
          }`}>
            {notice.type === 'success' ? '✓' : '✕'} {notice.msg}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 border border-zinc-700" onClick={onClose}>
            Đóng
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
