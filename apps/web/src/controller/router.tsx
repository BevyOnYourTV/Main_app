import { HashRouter, Route, Routes } from 'react-router'
import { CodeEntryPage } from './pages/CodeEntryPage'
import { ControllerPage } from './pages/ControllerPage'
import { NamePage } from './pages/NamePage'

export function ControllerRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route index element={<ControllerPage />} />
        <Route path="code" element={<CodeEntryPage />} />
        <Route path="name" element={<NamePage />} />
      </Routes>
    </HashRouter>
  )
}
