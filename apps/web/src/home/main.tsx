import { init } from '@noriginmedia/norigin-spatial-navigation-core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/styles/tailwind.css'
import { HomePage } from './HomePage'

init({
  debug: false,
  visualDebug: false,
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Home root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
)
