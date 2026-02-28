// Module-level singleton — only one audio instance ever exists
// This means stop() from ANY component always stops the right thing

let _audio = null
let _abortController = null
let _onEndCallback = null

export function playAudio(url, { onStart, onEnd } = {}) {
  stopAudio()  // always stop previous before starting new

  _abortController = null  // fetch already done at this point, url is ready

  _audio = new Audio(url)
  _onEndCallback = onEnd

  _audio.onplay = () => {
    if (onStart) onStart()
  }

  _audio.onended = () => {
    URL.revokeObjectURL(url)
    _audio = null
    if (onEnd) onEnd()
  }

  _audio.onerror = () => {
    URL.revokeObjectURL(url)
    _audio = null
    if (onEnd) onEnd()
  }

  _audio.play().catch((e) => {
    console.error('Audio play error:', e)
    if (onEnd) onEnd()
  })
}

export function fetchAndPlay(text, signal, { onStart, onEnd, onFallback } = {}) {
  // Returns a cancel function
  const controller = new AbortController()
  _abortController = controller

  fetch('/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) throw new Error('TTS fetch failed')
      return res.blob()
    })
    .then((blob) => {
      if (controller.signal.aborted) return
      const url = URL.createObjectURL(blob)
      playAudio(url, { onStart, onEnd })
    })
    .catch((err) => {
      if (err.name === 'AbortError') return
      console.warn('ElevenLabs failed, falling back:', err)
      if (onFallback) onFallback(text)
      if (onEnd) onEnd()
    })
}

export function stopAudio() {
  // Cancel in-flight fetch
  if (_abortController) {
    _abortController.abort()
    _abortController = null
  }

  // Stop playing audio
  if (_audio) {
    _audio.pause()
    _audio.src = ''
    _audio = null
  }

  // Fire end callback so UI state updates
  if (_onEndCallback) {
    _onEndCallback()
    _onEndCallback = null
  }
}

export function isPlaying() {
  return _audio !== null && !_audio.paused
}