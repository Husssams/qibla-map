// Speichert den Zustand unserer AR-Bestätigung.
export type QiblaConfirmationState = {
  confirmed: boolean
}

export const INITIAL_QIBLA_CONFIRMATION: QiblaConfirmationState = {
  confirmed: false,
}

// Aktualisiert die Bestätigung anhand der Kamerablickrichtung.
// Innerhalb von 2° wird sofort bestätigt.
// Erst ab 20° Abweichung wird die Bestätigung aufgehoben.
export function updateQiblaConfirmation(
  state: QiblaConfirmationState,
  turnAngle: number | null,
  isCameraUpright: boolean,
): QiblaConfirmationState {
  // Eine bestehende Bestätigung beibehalten, solange die
  // Kamera weniger als 20° von der Qibla abweicht.
  if (state.confirmed) {
    if (turnAngle !== null && Number.isFinite(turnAngle) && Math.abs(turnAngle) >= 20) {
      return INITIAL_QIBLA_CONFIRMATION
    }

    return state
  }

  // Ohne gültige Richtung oder geeignete Kamerahaltung
  // wird keine neue Bestätigung ausgelöst.
  if (
    turnAngle === null ||
    !Number.isFinite(turnAngle) ||
    !isCameraUpright ||
    Math.abs(turnAngle) > 2
  ) {
    return INITIAL_QIBLA_CONFIRMATION
  }

  // Sobald wir innerhalb von ±2° sind, wird sofort bestätigt.
  // Wir verlangen keine zusätzliche Wartezeit mehr.
  return {
    confirmed: true,
  }
}
