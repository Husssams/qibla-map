import type { Coordinates } from './geo'

// Beschreibt den sichtbaren Ausschnitt der Leaflet-Karte.
// Mittelpunkt und Zoomstufe werden gemeinsam gespeichert,
// damit wir die Ansicht nach einem Seitenwechsel wiederherstellen können.
export type MapViewport = {
  center: Coordinates
  zoom: number
}
