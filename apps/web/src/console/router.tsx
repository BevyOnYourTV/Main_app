import { BrowserRouter, Route, Routes } from 'react-router'
import { ConsolePage } from './pages/ConsolePage'
import { GameLobbyPage } from './pages/GameLobbyPage'
import { GamesPage } from './pages/GamesPage'
import { LobbyPage } from './pages/LobbyPage'
import { SettingsPage } from './pages/SettingsPage'

export function ConsoleRouter() {
  return (
    <BrowserRouter basename="/console">
      <Routes>
        <Route index element={<ConsolePage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:gameId/lobby" element={<GameLobbyPage />} />
        <Route path="lobby" element={<LobbyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
