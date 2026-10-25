// Importiert die Kartenkomponenten und den Standortmarker.
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'

// Importiert das benötigte CSS von Leaflet.
import 'leaflet/dist/leaflet.css'

// Definiert unsere neue React-Komponente.
export default function QiblaMapView() {
  // Gibt die Benutzeroberfläche der Karte zurück.
  return (
    // Erstellt eine Karte mit dem Mittelpunkt Gießen.
    <MapContainer center={[50.59, 8.68]} zoom={16} style={{ height: '500px', width: '100%' }}>
      {/* Lädt die Straßenkarte von OpenStreetMap. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Markiert unseren Teststandort Gießen auf der Karte. */}
      <CircleMarker
        // Die geografischen Koordinaten unseres Teststandorts.
        center={[50.59, 8.68]}

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
