type CameraOrientation = {
  alpha: number
  beta: number
  gamma: number
  absolute: boolean
}

// Berechnet die horizontale Blickrichtung der rückseitigen Kamera.
// Das Ergebnis ist ein Winkel von 0° bis unter 360°,
// bezogen auf die Nordreferenz des Orientierungssensors.
export function calculateCameraHeading(orientation: CameraOrientation): number | null {
  const { alpha, beta, gamma, absolute } = orientation

  // Relative Sensorwerte haben keine feste Nordreferenz.
  // Ungültige Zahlen dürfen ebenfalls nicht verarbeitet werden.
  if (!absolute || ![alpha, beta, gamma].every(Number.isFinite)) {
    return null
  }

  // JavaScript-Winkelfunktionen erwarten Radiant statt Grad.
  const toRad = Math.PI / 180
  const a = alpha * toRad
  const b = beta * toRad
  const g = gamma * toRad

  // Transformation der Rückkamera-Blickrichtung (Geräteachse -Z)
  // in das horizontale Erdkoordinatensystem nach W3C.
  const east = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g)
  const north = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g)

  // Zeigt die Kamera nahezu senkrecht nach oben oder unten,
  // ist ihre horizontale Blickrichtung nicht zuverlässig bestimmbar.
  if (Math.hypot(east, north) < 0.1) {
    return null
  }

  // atan2 berücksichtigt alle vier Himmelsrichtungsquadranten.
  // Die Modulo-Rechnung wandelt negative Winkel in 0° bis 360° um.
  return ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360
}
