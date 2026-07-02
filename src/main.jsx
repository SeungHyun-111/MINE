import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { installChunkRecovery } from './lib/chunkRecovery.js'

installChunkRecovery()

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    registration?.update()
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
