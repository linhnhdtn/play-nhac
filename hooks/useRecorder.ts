'use client'

import { useRef, useState, useCallback, useEffect, type RefObject } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getAudioElement } from '@/lib/audioRef'

const CANVAS_W = 390
const CANVAS_H = 780
// html2canvas captures ~50-150ms per frame; 10fps = 100ms interval
const CAPTURE_INTERVAL_MS = 100

function getSupportedMimeType(): string {
  const candidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export interface UseRecorderReturn {
  isRecording: boolean
  recordingTime: number
  recordedBlob: Blob | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  downloadRecording: () => void
  clearRecording: () => void
}

export function useRecorder(popupRef: RefObject<HTMLElement | null>): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const captureActiveRef = useRef(false)
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const displayStreamRef = useRef<MediaStream | null>(null)
  const allTracksRef = useRef<MediaStreamTrack[]>([])
  const mimeTypeRef = useRef<string>('')
  // Reuse a single canvas passed to html2canvas each time
  const h2cCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const cleanup = useCallback(() => {
    captureActiveRef.current = false
    if (captureTimerRef.current !== null) { clearTimeout(captureTimerRef.current); captureTimerRef.current = null }
    if (clockTimerRef.current !== null) { clearInterval(clockTimerRef.current); clockTimerRef.current = null }
    allTracksRef.current.forEach((t) => t.stop())
    allTracksRef.current = []
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop())
      displayStreamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    if (typeof MediaRecorder === 'undefined') {
      alert('Trình duyệt này không hỗ trợ quay màn hình.')
      return
    }
    const popupEl = popupRef.current
    if (!popupEl) return

    // Lazy-load html2canvas to keep initial bundle small
    const html2canvas = (await import('html2canvas')).default

    // Canvas that streams to MediaRecorder
    const streamCanvas = document.createElement('canvas')
    streamCanvas.width = CANVAS_W
    streamCanvas.height = CANVAS_H
    const streamCtx = streamCanvas.getContext('2d')!

    // Separate canvas for html2canvas to render into (reused each frame)
    const renderCanvas = document.createElement('canvas')
    renderCanvas.width = CANVAS_W
    renderCanvas.height = CANVAS_H
    h2cCanvasRef.current = renderCanvas

    const videoStream = streamCanvas.captureStream(10)

    // Capture loop: render popup → copy to stream canvas
    captureActiveRef.current = true
    const capture = async () => {
      if (!captureActiveRef.current) return
      try {
        await html2canvas(popupEl, {
          canvas: renderCanvas,
          useCORS: true,
          allowTaint: false,
          logging: false,
          scale: 1,
          width: CANVAS_W,
          height: CANVAS_H,
          // Ignore the recording indicator pulse dot to avoid flickering
          ignoreElements: () => false,
        })
        streamCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
        streamCtx.drawImage(renderCanvas, 0, 0)
      } catch {
        // Ignore individual frame errors
      }
      if (captureActiveRef.current) {
        captureTimerRef.current = setTimeout(capture, CAPTURE_INTERVAL_MS)
      }
    }
    capture()

    // Audio capture
    const { currentTrack } = usePlayerStore.getState()
    const isYouTube = currentTrack?.mediaType === 'youtube'
    const audioTracks: MediaStreamTrack[] = []

    if (!isYouTube) {
      const audioEl = getAudioElement()
      if (audioEl && typeof audioEl.captureStream === 'function') {
        try {
          const s = audioEl.captureStream()
          s.getAudioTracks().forEach((t) => audioTracks.push(t))
        } catch {
          // CORS or unsupported — video-only
        }
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })
        displayStreamRef.current = displayStream
        displayStream.getVideoTracks().forEach((t) => t.stop())
        displayStream.getAudioTracks().forEach((t) => audioTracks.push(t))
      } catch {
        // User cancelled — video-only
      }
    }

    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks(), ...audioTracks]
    allTracksRef.current = tracks
    const combinedStream = new MediaStream(tracks)

    const mimeType = getSupportedMimeType()
    mimeTypeRef.current = mimeType
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
    const recorder = new MediaRecorder(combinedStream, options)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      setRecordedBlob(blob)
      chunksRef.current = []
    }

    recorder.start(100)

    setRecordingTime(0)
    clockTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    setIsRecording(true)
  }, [isRecording, popupRef])

  const stopRecording = useCallback(() => {
    cleanup()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    setIsRecording(false)
  }, [cleanup])

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    const { currentTrack } = usePlayerStore.getState()
    const safeName = (currentTrack?.title ?? 'recording')
      .replace(/[^a-z0-9\-_\s]/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 60)
    const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm'
    a.download = `${safeName}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [recordedBlob])

  const clearRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordingTime(0)
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
    }
  }, [cleanup])

  return { isRecording, recordingTime, recordedBlob, startRecording, stopRecording, downloadRecording, clearRecording }
}
