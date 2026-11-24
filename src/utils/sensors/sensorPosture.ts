
//5° ist unser erster strenger Testwert.
export const MAX_COMPASS_TILT_DEGREES = 5
export const MAX_CAMERA_TILT_DEGREES = 5

/*
 * Der Kompass darf nur bei nahezu horizontalem
 * Smartphone eine Qibla-Richtung anzeigen.
 *
 * Beta: Neigung nach vorne oder hinten.
 * Gamma: Neigung nach links oder rechts.
 *
 * Nahe der horizontalen Lage können wir die
 * gemeinsame Neigung näherungsweise berechnen.
 */
export function isCompassLevel(
  beta: number | null,
  gamma: number | null,
): boolean {
  if (
    beta === null ||
    gamma === null ||
    !Number.isFinite(beta) ||
    !Number.isFinite(gamma)
  ) {
    return false
  }

  return Math.hypot(beta, gamma) <= MAX_COMPASS_TILT_DEGREES
}

/*
 * Die Rückkamera soll bei aufrechter Hochformathaltung
 * verwendet werden.
 *
 * Beta liegt dabei ungefähr bei +90°.
 * Gamma begrenzen wir hier bewusst nicht zusätzlich,
 * da diese Rotation auch die Blickrichtung beeinflusst.
 */
export function isCameraHeldUpright(beta: number | null): boolean {
  if (beta === null || !Number.isFinite(beta)) {
    return false
  }

  return Math.abs(beta - 90) <= MAX_CAMERA_TILT_DEGREES
}
