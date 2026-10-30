import { useEffect, useRef } from 'react'
import { divIcon, type Marker as LeafletMarker } from 'leaflet'
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet'

import type { Coordinates } from '../types/geo'
import type { Theme } from '../theme'

import MapCenterUpdater from './MapCenterUpdater'
import MapBaseLayer from './MapBaseLayer'

import 'leaflet/dist/leaflet.css'

// Definiert die Eingabewerte unserer Kartenkomponente.
type QiblaMapViewProps = {
  location: Coordinates
  theme: Theme
  isSelectingLocation: boolean
  followLocation: boolean
  onSelectLocation: (location: Coordinates) => void
}

// Definiert einen eigenen Standortmarker, unabhängig von Leaflet-Bilddateien.
const locationPinIcon = divIcon({
  className: 'qm-location-marker',
  html: '<span class="qm-location-marker__pin"></span>',
  iconSize: [40, 42],
  iconAnchor: [20, 38],
})

// Aktualisiert Leaflet, wenn sich der Kartencontainer vergrößert.
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

// Reagiert auf einen kurzen Klick oder Fingertipp auf die Karte.
function MapLocationClickHandler({
  onSelectLocation,
}: {
  onSelectLocation: (location: Coordinates) => void
}) {
  useMapEvents({
    click(event) {
      // Nur ein Kartenklick setzt einen Standort, nicht das Verschieben der Karte.
      onSelectLocation({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  return null
}

// Zeigt die Karte und den verschiebbaren Standortmarker an.
export default function QiblaMapView({
  location,
  theme,
  isSelectingLocation,
  followLocation,
  onSelectLocation,
}: QiblaMapViewProps) {
  const markerRef = useRef<LeafletMarker | null>(null)

  return (
    <MapContainer center={[location.latitude, location.longitude]} zoom={16} className="qibla-map">
      {/* Korrigiert die Kartengröße nach dem Öffnen und Schließen. */}
      <MapResizeHandler />

      {/* Zeigt die Karte im ausgewählten Design an. */}
      <MapBaseLayer theme={theme} />

      {/* Zentriert nur dann neu, wenn die Position von außen vorgegeben wird. */}
      <MapCenterUpdater location={location} enabled={followLocation} />

      {/* Ein Kartenklick wählt nur im geöffneten Auswahlmodus einen Standort. */}
      {isSelectingLocation && <MapLocationClickHandler onSelectLocation={onSelectLocation} />}

      {/* Der Marker bleibt geografisch verankert und ist im Auswahlmodus verschiebbar. */}
      <Marker
        position={[location.latitude, location.longitude]}
        icon={locationPinIcon}
        draggable={isSelectingLocation}
        autoPan
        autoPanPadding={[60, 60]}
        ref={markerRef}
        eventHandlers={{
          dragend() {
            // Erst beim Loslassen übernehmen wir die neue Position.
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
