import { BrowserRouter, Route, Routes } from 'react-router'
import { ConsolePage } from './pages/ConsolePage'
import { PlayPage } from './pages/play'

export function ConsoleRouter() {
  return (
    <BrowserRouter basename="/console">
      <Routes>
        <Route index element={<ConsolePage />} />
        <Route path="play" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}