// Importiert die Kartenkomponenten und den Standortmarker.
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
// Importiert unseren vorhandenen Typ für geografische Koordinaten.
import type { Coordinates } from '../types/geo'

// Importiert das benötigte CSS von Leaflet.
import 'leaflet/dist/leaflet.css'

// Definiert die Eingabewerte unserer Kartenkomponente.
type QiblaMapViewProps = {
  // Die geografische Position, die auf der Karte angezeigt wird.
  location: Coordinates
}

// Definiert unsere neue React-Komponente.
// Empfängt den Standort von der übergeordneten React-Komponente.
export default function QiblaMapView({ location }: QiblaMapViewProps) {
  // Gibt die Benutzeroberfläche der Karte zurück.
  return (
    // Erstellt eine Karte mit dem übergebenen Standort als Mittelpunkt.
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={16}
      style={{ height: '500px', width: '100%' }}
    >
      {/* Lädt die Straßenkarte von OpenStreetMap. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
