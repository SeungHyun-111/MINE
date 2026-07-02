const RELOAD_KEY = 'mine:chunk-reload-attempted'

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
  if (sessionStorage.getItem(RELOAD_KEY) === 'true') {
    return
  }

  sessionStorage.setItem(RELOAD_KEY, 'true')
  window.location.reload()
}

export function installChunkRecovery() {
  window.addEventListener('load', () => {
    sessionStorage.removeItem(RELOAD_KEY)
  })

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
