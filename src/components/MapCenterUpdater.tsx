// Importiert useEffect aus React.
import { useEffect } from 'react'

// Importiert den Zugriff auf die Leaflet-Karte.
import { useMap } from 'react-leaflet'

// Importiert unseren Koordinatentyp.
import type { Coordinates } from '../types/geo'

// Definiert die Eingabewerte unserer Komponente.
type MapCenterUpdaterProps = {
  // Die geografische Position, auf die wir die Karte bewegen.
  location: Coordinates
}

// Aktualisiert den Kartenmittelpunkt bei einer Standortänderung.
export default function MapCenterUpdater({ location }: MapCenterUpdaterProps) {
  // Holt die vorhandene Leaflet-Karte.
  const map = useMap()

  // Reagiert auf Änderungen der geografischen Koordinaten.
  useEffect(() => {
    // Bewegt die Karte zum Standort und behält die aktuelle Zoomstufe.
    map.setView([location.latitude, location.longitude], map.getZoom())
  }, [map, location.latitude, location.longitude])

  // Diese Komponente zeigt selbst kein sichtbares Element an.
  return null
}
