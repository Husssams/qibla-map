import { TileLayer } from 'react-leaflet'
import type { Theme } from '../../theme'

type MapBaseLayerProps = {
  theme: Theme
}

export default function MapBaseLayer({ theme }: MapBaseLayerProps) {
  return (
    <TileLayer
      // Bei einem Theme-Wechsel wird die Kartenebene neu erstellt.
      key={theme}
      // Nur die Kartenbilder erhalten im Dark Mode einen Farbfilter.
      className={theme === 'dark' ? 'qm-dark-map-tiles' : ''}
      // Wir verwenden unsere bisherige OpenStreetMap-Straßenkarte.
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      maxZoom={19}
      // Verhindert, dass OSM-Kartenbilder wegen eines fehlenden Referer-Headers blockiert werden.
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}
