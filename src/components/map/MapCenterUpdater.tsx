import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

import type { Coordinates } from '../../types/geo'

import { getMapInteractionBounds } from '../../utils/qibla/qiblaMapBounds'

type MapCenterUpdaterProps = {
  location: Coordinates
  enabled: boolean
  focusTarget?: Coordinates | null
  hasRestoredViewport: boolean
  fitEnabled: boolean
}

// Steuert die normale GPS-Zentrierung und gezielte Standortwechsel.
// Während der vollständigen Pfadanpassung übernimmt der Fit-Controller.
export default function MapCenterUpdater({
  location,
  enabled,
  focusTarget = null,
  hasRestoredViewport,
  fitEnabled,
}: MapCenterUpdaterProps) {
  const map = useMap()

  // Merkt sich den zuletzt berücksichtigten GPS-Standort.
  const lastFollowedLocationRef = useRef<Coordinates | null>(
    hasRestoredViewport ? { latitude: location.latitude, longitude: location.longitude } : null,
  )

  // Merkt sich, ob die GPS-Zentrierung zuvor aktiviert war.
  const wasFollowingRef = useRef(enabled)

  // In beiden Modi gibt es feste Grenzen.
  // Der Pfadmodus erhält lediglich mehr Platz an den Polen.
  useEffect(() => {
    map.setMaxBounds(getMapInteractionBounds(fitEnabled))
  }, [map, fitEnabled])

  // GPS-Zentrierung: Eine wiederhergestellte Kartenansicht bleibt erhalten,
  // solange sich der Standort nicht verändert hat.
  useEffect(() => {
    const wasFollowing = wasFollowingRef.current
    wasFollowingRef.current = enabled

    if (!enabled) return

    const lastLocation = lastFollowedLocationRef.current

    const isSameLocation =
      lastLocation?.latitude === location.latitude && lastLocation?.longitude === location.longitude

    if (wasFollowing && isSameLocation) return

    // Im normalen Modus mindestens Zoom 3 verwenden.
    const zoom = Math.max(3, map.getZoom())

    map.setView([location.latitude, location.longitude], zoom)

    lastFollowedLocationRef.current = {
      latitude: location.latitude,
      longitude: location.longitude,
    }
  }, [map, enabled, location])

  // Gezielte Zentrierung nach einer Suche oder Standortauswahl.
  useEffect(() => {
    if (!focusTarget) return

    const zoom = Math.max(3, map.getZoom())

    map.flyTo([focusTarget.latitude, focusTarget.longitude], zoom, {
      duration: 0.8,
    })
  }, [map, focusTarget])

  return null
}
