// Importiert die Kartenkomponenten und den Standortmarker.
import { MapContainer, CircleMarker } from 'react-leaflet'
// Importiert unseren vorhandenen Typ für geografische Koordinaten.
import type { Coordinates } from '../types/geo'

// Importiert das benötigte CSS von Leaflet.
import 'leaflet/dist/leaflet.css'
// Importiert unsere Komponente zur Aktualisierung des Kartenmittelpunkts.
import MapCenterUpdater from './MapCenterUpdater'

import MapBaseLayer from './MapBaseLayer'
import type { Theme } from '../theme'

import { useMapEvents } from 'react-leaflet'

// Definiert die Eingabewerte unserer Kartenkomponente.
type QiblaMapViewProps = {
  // Die geografische Position, die auf der Karte angezeigt wird.
  location: Coordinates
  theme: Theme
  onMapTap?: () => void
}

// Reagiert auf ein Antippen der interaktiven Leaflet-Karte.
function MapTapHandler({ onTap }: { onTap: () => void }) {
  useMapEvents({
    click: onTap,
  })

  return null
}

// Definiert unsere neue React-Komponente.
// Empfängt den Standort von der übergeordneten React-Komponente.
export default function QiblaMapView({ location, theme, onMapTap }: QiblaMapViewProps) {
  // Gibt die Benutzeroberfläche der Karte zurück.
  return (
    // Erstellt eine Karte mit dem übergebenen Standort als Mittelpunkt.
    <MapContainer center={[location.latitude, location.longitude]} zoom={16} className="qibla-map">
      {/* Zeigt die Straßenkarte im passenden Light- oder Dark-Mode an. */}
      <MapBaseLayer theme={theme} />
      {/* Aktualisiert den Kartenmittelpunkt bei einem neuen Standort. */}
      <MapCenterUpdater location={location} />
      {/* Ein Antippen schließt die vergrößerte Kartenansicht. */}
      {onMapTap && <MapTapHandler onTap={onMapTap} />}

      {/* Markiert den übergebenen Teststandort auf der Karte. */}
      <CircleMarker
        // Die geografischen Koordinaten unseres Teststandorts.
        center={[location.latitude, location.longitude]}

        // Der Radius des Kreises beträgt 8 Bildschirmpixel.
        radius={8}

        // Legt die Darstellung des Standortmarkers fest.
        pathOptions={{
          // Farbe der Kreisumrandung.
          color: '#2563eb',

          // Farbe der Kreisfläche.
          fillColor: '#2563eb',

          // Deckkraft der Kreisfläche: 80 Prozent.
          fillOpacity: 0.8,
        }}
      />
    </MapContainer>
  )
}
