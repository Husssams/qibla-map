import { useMemo } from 'react'
import type { LatLngTuple, PathOptions } from 'leaflet'
import { Polyline } from 'react-leaflet'

import type { Coordinates } from '../types/geo'
import { calculateQiblaPath } from '../utils/qiblaPath'

type QiblaPathLayerProps = {
  location: Coordinates
}

// Die Linie soll sich von den Straßen und Kartenbeschriftungen abheben.
// interactive: false verhindert, dass sie Kartenklicks oder andere
// Interaktionen mit der eigentlichen Karte abfängt.
const PATH_OPTIONS: PathOptions = {
  color: '#0284c7',
  weight: 3,
  opacity: 0.9,
  dashArray: '8 6',
  interactive: false,
}

// Diese Komponente kümmert sich ausschließlich um die Darstellung.
// Die WGS84-Berechnung bleibt unabhängig von React und Leaflet testbar.
export default function QiblaPathLayer({ location }: QiblaPathLayerProps) {
  // Eine Neuberechnung ist nur nötig, wenn sich der Standort ändert.
  // Beim normalen Zoomen oder Verschieben der Karte bleibt der Pfad gleich.
  const positions = useMemo<LatLngTuple[]>(() => {
    const path = calculateQiblaPath(location)

    // Unsere geografischen Daten verwenden benannte Eigenschaften.
    // Leaflet erwartet dagegen Koordinatenpaare in der Reihenfolge
    // [Breitengrad, Längengrad].
    return path.map((point): LatLngTuple => [point.latitude, point.longitude])
  }, [location])

  // Direkt an der Kaaba ist die Richtung undefiniert.
  // Ein leerer Pfad darf deshalb keine Polyline erzeugen.
  if (positions.length < 2) {
    return null
  }

  // Polyline verbindet die berechneten WGS84-Zwischenpunkte.
  // Sie verändert weder den Kartenmittelpunkt noch die Zoomstufe.
  return <Polyline positions={positions} pathOptions={PATH_OPTIONS} />
}
