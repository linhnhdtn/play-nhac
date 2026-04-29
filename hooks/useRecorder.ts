'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getAudioElement } from '@/lib/audioRef'

const VIDEO_BITRATE = 20_000_000
const AUDIO_BITRATE = 256_000

function getSupportedMimeType(): string {
  const candidates = [
    // H.264 High profile @ Level 4.0 (1080p) — sharper than Baseline at same bitrate
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    // Fallback: generic H.264 (Chrome may pick Baseline)
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    // VP9 — best compression but software-only, can stutter on weaker CPUs
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

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const captureStreamRef = useRef<MediaStream | null>(null)
  const fallbackAudioStreamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('')

  const cleanup = useCallback(() => {
    if (clockTimerRef.current !== null) {
      clearInterval(clockTimerRef.current)
      clockTimerRef.current = null
    }
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((t) => t.stop())
      captureStreamRef.current = null
    }
    if (fallbackAudioStreamRef.current) {
      fallbackAudioStreamRef.current.getTracks().forEach((t) => t.stop())
      fallbackAudioStreamRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    cleanup()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    setIsRecording(false)
  }, [cleanup])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      alert('Trình duyệt này không hỗ trợ quay màn hình.')
      return
    }

    // Hints (Chrome 94+) so the picker defaults to the current tab and audio toggle:
    // - preferCurrentTab + selfBrowserSurface:'include' → puts current tab front-and-center
    // - displaySurface:'browser' → defaults dialog to "Chrome Tab" view
    // - systemAudio:'include' → keep system audio toggle visible for full-screen capture
    // No width/height constraint: let the browser capture the tab at its native pixel size.
    // A max-resolution constraint would only downscale → blurry output when viewed at 1080p.
    const constraints = {
      video: {
        displaySurface: 'browser',
        frameRate: 30,
        // Hint up to 1440p — on HiDPI/Retina screens this lets Chrome capture
        // at the tab's full pixel density. On regular 1080p monitors it has
        // no effect (constraint is ideal, not min/max).
        width: { ideal: 2560 },
        height: { ideal: 1440 },
      },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      systemAudio: 'include',
    } as unknown as DisplayMediaStreamOptions

    let captureStream: MediaStream
    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia(constraints)
    } catch {
      return // user cancelled the picker
    }
    captureStreamRef.current = captureStream

    // Auto-stop when user clicks the browser's "Stop sharing" button
    captureStream.getVideoTracks().forEach((t) => {
      t.addEventListener('ended', () => stopRecording())
    })

    // Audio: prefer the audio that came from getDisplayMedia (tab/system audio).
    // If user didn't tick "Share tab audio", fall back to the <audio> element directly
    // so the recording always has music for non-YouTube tracks.
    let audioTracks: MediaStreamTrack[] = captureStream.getAudioTracks()
    if (audioTracks.length === 0) {
      const audioEl = getAudioElement()
      if (audioEl && typeof audioEl.captureStream === 'function') {
        try {
          const elStream = audioEl.captureStream()
          fallbackAudioStreamRef.current = elStream
          audioTracks = elStream.getAudioTracks()
        } catch {
          // CORS-tainted source or unsupported — record video-only
        }
      }
    }

    const combinedStream = new MediaStream([
      ...captureStream.getVideoTracks(),
      ...audioTracks,
    ])

    const mimeType = getSupportedMimeType()
    mimeTypeRef.current = mimeType
    const options: MediaRecorderOptions = {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    }
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
  }, [isRecording, stopRecording])

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
