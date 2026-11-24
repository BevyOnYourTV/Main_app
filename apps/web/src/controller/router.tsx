import { BrowserRouter, Route, Routes } from 'react-router'
import { ControllerPage } from './pages/ControllerPage'
import { RoomPage } from './pages/RoomPage'

export function ControllerRouter() {
  return (
    <BrowserRouter basename="/controller">
      <Routes>
        <Route index element={<ControllerPage />} />
        <Route path="join/:roomCode" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  )
}
