import { Navigate, Route, Routes } from 'react-router'

import AppLayout from './components/navigation/AppLayout'
import HelpPage from './pages/HelpPage'
import CompassPage from './pages/CompassPage'
import CameraPage from './pages/CameraPage'
import QiblaFaqPage from './pages/QiblaFaqPage'
import ImprintPage from './pages/ImprintPage'
import PrivacyPage from './pages/PrivacyPage'
import MapPage from './pages/MapPage'
import NotFoundPage from './pages/NotFoundPage'

// App verwaltet ausschließlich unsere Seiten und deren URLs.
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Bis zur Sprachauswahl leitet die Startseite zur Karte weiter. */}
        <Route index element={<Navigate to="/map" replace />} />

        {/* Die Qibla-Karte erhält eine eigene dauerhafte URL. */}
        <Route path="map" element={<MapPage />} />
        {/* Eigene Seite für den zukünftigen Live-Kompass. */}
        <Route path="compass" element={<CompassPage />} />
        {/* Die AR-Kameraseite erhält eine eigene URL.
    Der Kamerazugriff wird später in CameraPage implementiert. */}
        <Route path="camera" element={<CameraPage />} />
        {/* Erste zusätzliche Seite mit eigenem URL-Pfad. */}
        <Route path="help" element={<HelpPage />} />
        {/* Häufige Fragen über die Qibla und die Kaaba. */}
        <Route path="qibla-faq" element={<QiblaFaqPage />} />
        {/* Rechtliche Informationen mit eigenen, dauerhaften URL-Pfaden. */}
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="imprint" element={<ImprintPage />} />
        {/* Fallback für unbekannte URLs, beispielsweise "/helps". */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
