// Importiert die Kartenkomponenten aus React Leaflet.
import { MapContainer, TileLayer } from 'react-leaflet'

// Importiert das benötigte CSS von Leaflet.
import 'leaflet/dist/leaflet.css'

// Definiert unsere neue React-Komponente.
export default function QiblaMapView() {
  // Gibt die Benutzeroberfläche der Karte zurück.
  return (
    // Erstellt eine Karte mit dem Mittelpunkt Gießen.
    <MapContainer
      center={[50.59, 8.68]}
      zoom={16}
      style={{ height: '500px', width: '100%' }}
    >
      {/* Lädt die Straßenkarte von OpenStreetMap. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}