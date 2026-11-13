import { Route, Routes } from 'react-router'

import AppLayout from './components/navigation/AppLayout'
import HelpPage from './pages/HelpPage'
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
        {/* Die Karte bleibt unsere Hauptseite. */}
        <Route index element={<MapPage />} />

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
