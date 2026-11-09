import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/styles/tailwind.css'
import { DevPage } from './pages/DevPage'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Developer mode root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <DevPage />
  </StrictMode>,
)
