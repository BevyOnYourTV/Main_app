import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/styles/tailwind.css'
import { ControllerRouter } from './router'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Controller root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ControllerRouter />
  </StrictMode>,
)
