import { Navigate, Route, Routes, useLocation } from 'react-router'

import AppLayout from './components/navigation/AppLayout'
import LanguageSelectionPage from './pages/LanguageSelectionPage'
import { LANGUAGE_CHOICE_KEY } from './constants/supportedLanguages'
import HelpPage from './pages/HelpPage'
import CompassPage from './pages/CompassPage'
import CameraPage from './pages/CameraPage'
import QiblaFaqPage from './pages/QiblaFaqPage'
import ImprintPage from './pages/ImprintPage'
import PrivacyPage from './pages/PrivacyPage'
import MapPage from './pages/MapPage'
import NotFoundPage from './pages/NotFoundPage'
import AndroidBackHandler from './components/navigation/AndroidBackHandler'
import AndroidSeasonalIcon from './components/branding/AndroidSeasonalIcon'

// App verwaltet ausschließlich unsere Seiten und deren URLs.

function App() {
  // Aktuellen URL-Pfad ermitteln, beispielsweise /camera oder /map.
  const { pathname } = useLocation()

  // Prüfen, ob der Nutzer seine Sprache bereits
  // mit dem Weiter-Button bestätigt hat.
  const hasChosenLanguage = localStorage.getItem(LANGUAGE_CHOICE_KEY) === 'true'

  /*
   * Solange keine Sprachwahl abgeschlossen wurde,
   * dürfen keine anderen Seiten geöffnet werden.
   *
   * Auch manuell eingegebene URLs und unbekannte
   * Routen werden zur Sprachauswahl weitergeleitet.
   */
  if (!hasChosenLanguage && pathname !== '/') {
    return <Navigate to="/" replace />
  }

  // Nach der Sprachauswahl funktionieren alle
  // vorhandenen Routen wieder wie bisher.
  return (
    <>
      {/* Native Android-Zurück-Taste verwalten. */}
      <AndroidBackHandler />
      {/* Aktualisiert das Android-App-Symbol passend zum Ramadan. */}
      <AndroidSeasonalIcon />
      <Routes>
        <Route element={<AppLayout />}>
          {/* Beim ersten Besuch erscheint die Sprachauswahl.
            Bei späteren Starts öffnen wir direkt die Kamera. */}
          <Route
            index
            element={
              hasChosenLanguage ? <Navigate to="/camera" replace /> : <LanguageSelectionPage />
            }
          />

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
    </>
  )
}

export default App
