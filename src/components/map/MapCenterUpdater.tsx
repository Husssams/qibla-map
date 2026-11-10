import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

import type { Coordinates } from '../../types/geo'

import { getQiblaMapBounds } from '../../utils/qibla/qiblaMapBounds'

type MapCenterUpdaterProps = {
  location: Coordinates
  enabled: boolean
  focusTarget?: Coordinates | null
  hasRestoredViewport: boolean
}

// Steuert die Karten-Zentrierung bei GPS-Ermittlung und gezielter Standortauswahl.
export default function MapCenterUpdater({
  location,
  enabled,
  focusTarget = null,
  hasRestoredViewport,
}: MapCenterUpdaterProps) {
  const map = useMap()

  // Bei einer wiederhergestellten Karte gilt der ursprüngliche Standort
  // bereits als berücksichtigt. Dadurch wird die Ansicht beim Einbinden
  // nicht sofort wieder auf den Standort zentriert.
  const lastFollowedLocationRef = useRef<Coordinates | null>(
    hasRestoredViewport ? { latitude: location.latitude, longitude: location.longitude } : null,
  )

  // Erkennt, ob die automatische Zentrierung neu aktiviert wurde.
  const wasFollowingRef = useRef(enabled)

  // Die erlaubten Weltkartengrenzen hängen vom geodätischen Weg zur Kaaba ab.
  // Bei einem Standortwechsel muss Leaflet die passende Weltkartenkopie verwenden,
  // damit beispielsweise der Pfad von Hawaii über die Datumsgrenze sichtbar bleibt.
  useEffect(() => {
    map.setMaxBounds(getQiblaMapBounds(location))
  }, [map, location])

  // GPS-Zentrierung: Eine gespeicherte Ansicht wird beim erneuten Einbinden
  // respektiert. Neue GPS-Positionen werden weiterhin automatisch zentriert.
  useEffect(() => {
    const wasFollowing = wasFollowingRef.current
    wasFollowingRef.current = enabled

    if (!enabled) return

    const lastLocation = lastFollowedLocationRef.current

    const isSameLocation =
      lastLocation?.latitude === location.latitude && lastLocation?.longitude === location.longitude

    // Keine erneute Zentrierung, wenn die aktuelle GPS-Position bereits
    // berücksichtigt wurde und der Benutzer nur den Kartenausschnitt bewegt hat.
    if (wasFollowing && isSameLocation) return

    map.setView([location.latitude, location.longitude], map.getZoom())

    lastFollowedLocationRef.current = {
      latitude: location.latitude,
      longitude: location.longitude,
    }
  }, [map, enabled, location.latitude, location.longitude])

  // Gezielte Zentrierung: Nach einer Suche oder beim Schließen der großen Karte.
  // Ein neuer focusTarget-Auftrag startet die Animation unabhängig vom GPS-Modus.
  useEffect(() => {
    if (!focusTarget) return

    map.flyTo([focusTarget.latitude, focusTarget.longitude], map.getZoom(), { duration: 0.8 })
  }, [map, focusTarget])

  return null
}
