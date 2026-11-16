import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/styles/tailwind.css'
import { ControllerPage } from './pages/ControllerPage'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Controller root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ControllerPage />
  </StrictMode>,
)
