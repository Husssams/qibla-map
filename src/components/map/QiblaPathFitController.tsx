import { useCallback, useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

import type { Coordinates } from '../../types/geo'
import type { MapViewport } from '../../types/mapViewport'
import { getMapInteractionBounds, getQiblaPathFitBounds } from '../../utils/qibla/qiblaMapBounds'

type QiblaPathFitControllerProps = {
  location: Coordinates
  enabled: boolean
  isSelectingLocation: boolean
  restoreViewport: MapViewport | null
}

const DEFAULT_MIN_ZOOM = 3
const FIT_MIN_ZOOM = 1

// Passt die Karte an den gesamten WGS84-Qibla-Pfad an.
// Die Einstellung funktioniert auch in der vergrößerten Kartenansicht.
export default function QiblaPathFitController({
  location,
  enabled,
  isSelectingLocation,
  restoreViewport,
}: QiblaPathFitControllerProps) {
  const map = useMap()

  // Eine neu eingebundene Karte gilt zunächst als noch nicht angepasst.
  // Ist die Checkbox bereits aktiv, wird der Pfad beim Start eingepasst.
  const wasEnabledRef = useRef(false)

  // Merkt sich, ob die große Standortauswahl zuvor geöffnet war.
  const wasSelectingRef = useRef(isSelectingLocation)

  // Merkt sich den Standort der letzten Pfadanpassung.
  const lastFitLocationRef = useRef<Coordinates>({
    latitude: location.latitude,
    longitude: location.longitude,
  })

  // Berechnet die Grenzen des aktuellen Pfads und passt die Karte an.
  // useCallback hält die Funktion stabil, solange Karte und Standort
  // unverändert bleiben.
  const fitPath = useCallback(() => {
    const bounds = getQiblaPathFitBounds({
      latitude: location.latitude,
      longitude: location.longitude,
    })

    // An der Kaaba existiert kein sinnvoller Qibla-Pfad.
    if (!bounds) return

    // Animationen stoppen und feste Grenzen für den Pfadmodus setzen.
    map.stop()
    map.setMinZoom(FIT_MIN_ZOOM)
    map.setMaxBounds(getMapInteractionBounds(true))

    // Passt den vollständigen Pfad mit Abstand zum Kartenrand ein.
    map.fitBounds(bounds, {
      padding: [24, 24],
      animate: false,
    })
  }, [map, location.latitude, location.longitude])

  // Unser MapResizeHandler ruft invalidateSize() auf, sobald sich
  // die Kartengröße ändert. Leaflet meldet dies mit "resize".
  //
  // Besonders wichtig beim Schließen der vergrößerten Karte:
  // Wir passen den Pfad nochmals an die tatsächliche Größe an.
  useMapEvents({
    resize() {
      if (!enabled) return

      fitPath()
    },
  })

  useEffect(() => {
    const wasEnabled = wasEnabledRef.current
    const wasSelecting = wasSelectingRef.current

    // Die bisherigen Zustände für den nächsten Durchlauf merken.
    wasEnabledRef.current = enabled
    wasSelectingRef.current = isSelectingLocation

    const lastLocation = lastFitLocationRef.current

    const locationChanged =
      lastLocation.latitude !== location.latitude || lastLocation.longitude !== location.longitude

    const selectionModeChanged = wasSelecting !== isSelectingLocation

    if (enabled) {
      // Eine Anpassung ist erforderlich, wenn sie neu aktiviert wurde,
      // ein anderer Standort ausgewählt wurde oder sich der
      // große Kartenmodus geöffnet beziehungsweise geschlossen hat.
      //
      // Bei unverändertem Zustand vermeiden wir unnötige Sprünge.
      if (!wasEnabled || locationChanged || selectionModeChanged) {
        fitPath()

        lastFitLocationRef.current = {
          latitude: location.latitude,
          longitude: location.longitude,
        }
      }

      return
    }

    // War die Anpassung bereits ausgeschaltet, passiert nichts.
    if (!wasEnabled) return

    // Beim Ausschalten beenden wir die automatische Anpassung.
    map.stop()
    map.setMinZoom(DEFAULT_MIN_ZOOM)

    // Falls eine vorherige Ansicht gespeichert wurde, verwenden wir sie.
    // Andernfalls nehmen wir den aktuell ausgewählten Standort.
    const targetCenter = restoreViewport?.center ?? location
    const targetZoom = Math.max(DEFAULT_MIN_ZOOM, restoreViewport?.zoom ?? 16)

    map.setView([targetCenter.latitude, targetCenter.longitude], targetZoom, { animate: false })

    // Prüfen, ob wir zum ausgewählten Standort zurückkehren.
    // Eine abweichende gespeicherte Ansicht, beispielsweise Berlin,
    // soll dagegen unverändert wiederhergestellt werden.
    const sameLatitude = Math.abs(targetCenter.latitude - location.latitude) < 0.000001

    const longitudeDifference = Math.abs(
      ((((targetCenter.longitude - location.longitude + 180) % 360) + 360) % 360) - 180,
    )

    if (sameLatitude && longitudeDifference < 0.000001) {
      // Den Marker nach Möglichkeit innerhalb des sichtbaren
      // Bereichs halten, ohne über die Weltkartengrenzen zu gehen.
      // Bei Polarstandorten darf er nahe am Rand bleiben.
      map.panInside([location.latitude, location.longitude], {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 80],
        animate: false,
      })
    }
  }, [map, enabled, isSelectingLocation, location, restoreViewport, fitPath])

  return null
}
