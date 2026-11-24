import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@noriginmedia/norigin-spatial-navigation-core';
import '../shared/styles/tailwind.css'
import { ConsoleRouter } from './router'
import { SdkProvider } from '../shared/provider/SdkContext'

init({
  debug: false,
  visualDebug: false
});

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Console root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <SdkProvider device_type='console'>
      <ConsoleRouter/>
    </SdkProvider>
  </StrictMode>,
)
