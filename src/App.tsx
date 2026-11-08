import { Route, Routes } from 'react-router'

import AppLayout from './components/navigation/AppLayout'
import HelpPage from './pages/HelpPage'
import MapPage from './pages/MapPage'

// App verwaltet ausschließlich unsere Seiten und deren URLs.
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Die Karte bleibt unsere Hauptseite. */}
        <Route index element={<MapPage />} />

        {/* Erste zusätzliche Seite mit eigenem URL-Pfad. */}
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
  )
}

export default App