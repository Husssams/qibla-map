import { useEffect, useMemo, useRef } from 'react'
import { divIcon, type Marker as LeafletMarker } from 'leaflet'
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet'

import type { Coordinates } from '../../types/geo'
import type { MapViewport } from '../../types/mapViewport'
import type { Theme } from '../../theme'

import { getQiblaMapBounds } from '../../utils/qibla/qiblaMapBounds'
import MapBaseLayer from './MapBaseLayer'
import MapCenterUpdater from './MapCenterUpdater'
import QiblaPathLayer from './QiblaPathLayer'
import { createQiblaArrowHtml } from '../../utils/qibla/qiblaArrow'

import 'leaflet/dist/leaflet.css'

type QiblaMapViewProps = {
  location: Coordinates
  viewport: MapViewport | null
  onViewportChange: (viewport: MapViewport) => void
  qiblaBearing: number | null
  isQiblaPathVisible: boolean
  theme: Theme
  isSelectingLocation: boolean
  followLocation: boolean
  focusTarget?: Coordinates | null
  onSelectLocation: (location: Coordinates) => void
}

// Leaflet positioniert den Marker, während das innere Pfeilsymbol unabhängig rotiert.
function createLocationPinIcon(qiblaBearing: number | null) {
  return divIcon({
    className: 'qm-location-marker',
    html: `${createQiblaArrowHtml(qiblaBearing)}<span class="qm-location-marker__pin"></span>`,
    iconSize: [40, 42],
    iconAnchor: [20, 38],
  })
}

// Passt die Leaflet-Karte an, wenn ihr Container vergrößert oder verkleinert wird.
function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false })
    })

    observer.observe(map.getContainer())

    return () => {
      observer.disconnect()
    }
  }, [map])

  return null
}

// Beobachtet Änderungen des Kartenmittelpunkts und der Zoomstufe.
// Die Ereignisse werden erst nach einer abgeschlossenen Bewegung verarbeitet,
// damit wir nicht bei jedem Animationsframe React-State aktualisieren.
function MapViewportTracker({
  onViewportChange,
}: {
  onViewportChange: (viewport: MapViewport) => void
}) {
  const map = useMap()

  function reportViewport() {
    const center = map.getCenter()

    // Den Längengrad bewusst nicht normalisieren:
    // Für Wege über die Datumsgrenze benötigen wir ggf. eine verschobene Weltkarte.
    onViewportChange({
      center: {
        latitude: center.lat,
        longitude: center.lng,
      },
      zoom: map.getZoom(),
    })
  }

  // moveend erfasst Verschiebungen, zoomend erfasst Zoomänderungen.
  useMapEvents({
    moveend: reportViewport,
    zoomend: reportViewport,
  })

  return null
}

// Ermöglicht die Standortauswahl durch einen Kartenklick.
// Dieser Handler wird nur im geöffneten Auswahlmodus eingebunden.
function MapLocationClickHandler({
  onSelectLocation,
}: {
  onSelectLocation: (location: Coordinates) => void
}) {
  useMapEvents({
    click(event) {
      onSelectLocation({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  return null
}

// Zeigt die Karte, steuert die Standortauswahl und aktualisiert den Marker.
export default function QiblaMapView({
  location,
  viewport,
  onViewportChange,
  qiblaBearing,
  isQiblaPathVisible,
  theme,
  isSelectingLocation,
  followLocation,
  focusTarget = null,
  onSelectLocation,
}: QiblaMapViewProps) {
  const markerRef = useRef<LeafletMarker | null>(null)
  const locationPinIcon = useMemo(() => createLocationPinIcon(qiblaBearing), [qiblaBearing])

  // Beim ersten Laden erhält Leaflet die passende Weltkartenkopie.
  // Spätere Standortwechsel aktualisiert MapCenterUpdater über setMaxBounds().
  return (
    // Verhindert zu starkes Herauszoomen, bei dem mehrere Weltkarten nebeneinander erscheinen.
    <MapContainer
      center={[
        viewport?.center.latitude ?? location.latitude,
        viewport?.center.longitude ?? location.longitude,
      ]}
      zoom={viewport?.zoom ?? 16}
      minZoom={3}
      maxBounds={getQiblaMapBounds(location)}
      maxBoundsViscosity={1.0}
      className="qibla-map"
    >
      <MapResizeHandler />
      <MapViewportTracker onViewportChange={onViewportChange} />

      <MapBaseLayer theme={theme} />

      {/* GPS-Zentrierung und gezielte Kartenbewegungen werden getrennt gesteuert. */}
      <MapCenterUpdater
        location={location}
        enabled={followLocation}
        focusTarget={focusTarget}
        hasRestoredViewport={viewport !== null}
      />

      {/* Der optionale Pfad wird nur bei aktivierter Checkbox berechnet und gezeichnet. Beim Ausschalten entfernt React die Polyline vollständig aus der Karte. */}
      {isQiblaPathVisible && <QiblaPathLayer location={location} />}

      {isSelectingLocation && <MapLocationClickHandler onSelectLocation={onSelectLocation} />}

      {/* Der Marker ist nur im Auswahlmodus verschiebbar. */}
      <Marker
        position={[location.latitude, location.longitude]}
        icon={locationPinIcon}
        draggable={isSelectingLocation}
        autoPan
        autoPanPadding={[60, 60]}
        ref={markerRef}
        eventHandlers={{
          dragend() {
            // Die neue Position wird erst nach dem Loslassen übernommen.
            const position = markerRef.current?.getLatLng()

            if (!position) return

            onSelectLocation({
              latitude: position.lat,
              longitude: position.lng,
            })
          },
        }}
      />
    </MapContainer>
  )
}
