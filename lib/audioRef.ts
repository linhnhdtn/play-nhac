'use client'

interface CaptureableAudio extends HTMLAudioElement {
  captureStream(): MediaStream
}

let _audioEl: CaptureableAudio | null = null

export function registerAudioElement(el: HTMLAudioElement | null): void {
  _audioEl = el as CaptureableAudio | null
}

export function getAudioElement(): CaptureableAudio | null {
  return _audioEl
}
