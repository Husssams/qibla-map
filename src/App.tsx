// Importiert die CSS-Datei für das Design.
import './App.css'
// Importiert unseren selbst definierten Datentyp.
import type { Coordinates } from './types/geo'
// Importiert die geografischen Koordinaten der Kaaba.
import { KAABA_COORDINATES } from './constants/kaaba'
// Importiert unsere Funktion zur Berechnung der Qibla-Richtung.
import { calculateQiblaBearing } from './utils/qiblaBearing'

// Erstellt einen festen Teststandort.
const testLocation: Coordinates = {
  // Breitengrad von Gießen.
  latitude: 50.59,

  // Längengrad von Gießen.
  longitude: 8.68,
}
// Berechnet die Qibla-Richtung für unseren Teststandort.
const qiblaBearing = calculateQiblaBearing(testLocation)

// Definiert unsere Hauptkomponente.
function App() {
  // Gibt die Benutzeroberfläche zurück.
  return (
    <main>
      {/* Zeigt den Namen unserer Anwendung. */}
      <h1>QiblaMap</h1>

      {/* Beschreibt die Aufgabe unserer Anwendung. */}
      <p>Finde deine Gebetsrichtung auf der Karte.</p>

      {/* Zeigt die Koordinaten unseres Teststandorts an. */}
      <p>
        Teststandort: {testLocation.latitude}°, {testLocation.longitude}°
      </p>

      {/* Zeigt die geografischen Koordinaten der Kaaba an. */}
      <p>
        Kaaba: {KAABA_COORDINATES.latitude}°, {KAABA_COORDINATES.longitude}°
      </p>
      {/* Zeigt den berechneten Qibla-Winkel an. */}
      <p>
        Qibla-Richtung: {qiblaBearing.toFixed(1)}°
      </p>
    </main>
  )
}

// Macht die Komponente für andere Dateien verfügbar.
export default App