import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

import type { Coordinates } from '../types/geo'

import { getQiblaMapBounds } from '../utils/qiblaMapBounds'

type MapCenterUpdaterProps = {
  location: Coordinates
  enabled: boolean
  focusTarget?: Coordinates | null
}

// Steuert die Karten-Zentrierung bei GPS-Ermittlung und gezielter Standortauswahl.
export default function MapCenterUpdater({
  location,
  enabled,
  focusTarget = null,
}: MapCenterUpdaterProps) {
  const map = useMap()

  // Die erlaubten Weltkartengrenzen hängen vom geodätischen Weg zur Kaaba ab.
  // Bei einem Standortwechsel muss Leaflet die passende Weltkartenkopie verwenden,
  // damit beispielsweise der Pfad von Hawaii über die Datumsgrenze sichtbar bleibt.
  useEffect(() => {
    map.setMaxBounds(getQiblaMapBounds(location))
  }, [map, location])

  // GPS-Zentrierung: Bei manueller Standortwahl bleibt die Karte frei beweglich.
  useEffect(() => {
    if (!enabled) return

    map.setView([location.latitude, location.longitude], map.getZoom())
  }, [map, enabled, location.latitude, location.longitude])

  // Gezielte Zentrierung: Nach einer Suche oder beim Schließen der großen Karte.
  // Ein neuer focusTarget-Auftrag startet die Animation unabhängig vom GPS-Modus.
  useEffect(() => {
    if (!focusTarget) return

    map.flyTo([focusTarget.latitude, focusTarget.longitude], map.getZoom(), { duration: 0.8 })
  }, [map, focusTarget])

  return null
}
