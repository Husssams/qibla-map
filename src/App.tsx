import { Route, Routes } from 'react-router'

import AppLayout from './components/navigation/AppLayout'
import MapPage from './pages/MapPage'

// App verwaltet nur die Routen.
// Das gemeinsame Layout bleibt beim Wechsel zwischen Seiten erhalten.
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Die Karten-Hauptseite wird unter "/" angezeigt. */}
        <Route index element={<MapPage />} />
      </Route>
    </Routes>
  )
}

export default App
