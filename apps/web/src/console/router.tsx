import { BrowserRouter, Route, Routes } from 'react-router'
import { ConsolePage } from './pages/ConsolePage'
import { MenuDestinationPage } from './pages/MenuDestinationPage'
import { SettingsPage } from './pages/SettingsPage'

export function ConsoleRouter() {
  return (
    <BrowserRouter basename="/console">
      <Routes>
        <Route index element={<ConsolePage />} />
        <Route
          path="games"
          element={
            <MenuDestinationPage
              description="Browse and start an available game."
              title="Games"
            />
          }
        />
        <Route
          path="lobby"
          element={
            <MenuDestinationPage
              description="Create a room and manage connected players."
              title="Lobby"
            />
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
