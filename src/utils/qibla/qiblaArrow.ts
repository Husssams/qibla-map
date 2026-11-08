// Erzeugt das Pfeilsymbol unabhängig von Leaflet, damit die Rotation testbar bleibt.
export function createQiblaArrowHtml(bearing: number | null): string {
  // Am Zielpunkt gibt es keine definierte Qibla-Richtung und damit keinen Pfeil.
  if (bearing === null) {
    return ''
  }

  return `<span
    class="qm-location-marker__arrow"
    style="transform: translateX(-50%) rotate(${bearing}deg)"
  ></span>`
}
