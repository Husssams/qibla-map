
import { useEffect, useRef } from 'react'
import { divIcon, type Marker as LeafletMarker } from 'leaflet'
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet'

import type { Coordinates } from '../types/geo'
import type { Theme } from '../theme'

import MapBaseLayer from './MapBaseLayer'
import MapCenterUpdater from './MapCenterUpdater'

import 'leaflet/dist/leaflet.css'

type QiblaMapViewProps = {
  location: Coordinates
  theme: Theme
  isSelectingLocation: boolean
  followLocation: boolean
  focusTarget?: Coordinates | null
  onSelectLocation: (location: Coordinates) => void
}

// Eigener Standortmarker, unabhängig von den Standardbildern von Leaflet.
const locationPinIcon = divIcon({
  className: 'qm-location-marker',
  html: '<span class="qm-location-marker__pin"></span>',
  iconSize: [40, 42],
  iconAnchor: [20, 38],
})

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
  theme,
  isSelectingLocation,
  followLocation,
  focusTarget = null,
  onSelectLocation,
}: QiblaMapViewProps) {
  const markerRef = useRef<LeafletMarker | null>(null)

  return (
    <MapContainer center={[location.latitude, location.longitude]} zoom={16} className="qibla-map">
      <MapResizeHandler />

      <MapBaseLayer theme={theme} />

      {/* GPS-Zentrierung und gezielte Kartenbewegungen werden getrennt gesteuert. */}
      <MapCenterUpdater location={location} enabled={followLocation} focusTarget={focusTarget} />

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
