import { Route, Routes } from 'react-router'

import MapPage from './pages/MapPage'

// App übernimmt die Seitenverwaltung.
// Unsere Kartenfunktionen liegen jetzt vollständig in MapPage.
function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
    </Routes>
  )
}

export default App
