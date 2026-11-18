// Berechnet den kürzesten Drehwinkel zwischen Kamerablickrichtung
// und Qibla-Richtung.
//
// Positiv bedeutet: nach rechts drehen.
// Negativ bedeutet: nach links drehen.
// Null bedeutet: beide Winkel stimmen rechnerisch überein.
export function calculateQiblaTurnAngle(qiblaBearing: number, cameraHeading: number): number {
  // Der zusätzliche Vollkreis verhindert Probleme am Übergang
  // zwischen 359° und 0°.
  return ((qiblaBearing - cameraHeading + 540) % 360) - 180
}
