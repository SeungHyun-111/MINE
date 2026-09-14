const RELOAD_KEY = 'mine:chunk-reload-attempted'
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000

function isChunkLoadError(reason) {
  const message = String(reason?.message || reason || '')

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Expected a JavaScript-or-Wasm module script') ||
    message.includes('error loading dynamically imported module')
  )
}

function reloadOnce() {
  const lastAttempt = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
  if (lastAttempt && Date.now() - lastAttempt < RELOAD_COOLDOWN_MS) {
    return
  }

  sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  window.location.reload()
}

export function installChunkRecovery() {
  window.addEventListener('error', (event) => {
    if (isChunkLoadError(event.error || event.message)) {
      reloadOnce()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      reloadOnce()
    }
  })
}
