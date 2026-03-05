let _audio = null
let _onEndCallback = null

export function playAudio(url, { onStart, onEnd } = {}) {
  stopAudio()
  _audio = new Audio(url)
  _onEndCallback = onEnd

  _audio.onplay = () => { if (onStart) onStart() }
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
  if (onFallback) onFallback(text)
}

export function stopAudio() {
  if (_audio) {
    _audio.pause()
    _audio.src = ''
    _audio = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  if (_onEndCallback) {
    _onEndCallback()
    _onEndCallback = null
  }
}

export function isPlaying() {
  return _audio !== null && !_audio.paused
}