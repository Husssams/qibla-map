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
  // Bei manueller Standortwahl soll die Karte nicht automatisch springen.
  enabled: boolean
}

// Aktualisiert den Kartenmittelpunkt bei einer Standortänderung.
export default function MapCenterUpdater({ location, enabled }: MapCenterUpdaterProps) {
  // Holt die vorhandene Leaflet-Karte.
  const map = useMap()

  // Reagiert auf Änderungen der geografischen Koordinaten.
  useEffect(() => {
    // Bei manueller Standortwahl bleibt der aktuelle Kartenausschnitt erhalten.
    if (!enabled) return

    // Bei GPS-Ermittlung bewegt sich die Karte zum neuen Standort.
    map.setView([location.latitude, location.longitude], map.getZoom())
  }, [map, enabled, location.latitude, location.longitude])

  // Diese Komponente zeigt selbst kein sichtbares Element an.
  return null
}
