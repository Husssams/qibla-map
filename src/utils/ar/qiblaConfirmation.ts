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
  // Bei falscher Haltung oder fehlender Richtung
  // niemals eine alte Bestätigung weiterverwenden.
  if (!isCameraUpright || turnAngle === null || !Number.isFinite(turnAngle)) {
    return INITIAL_QIBLA_CONFIRMATION
  }

  // Eine gültige Bestätigung bleibt bei kleinen
  // seitlichen Drehungen bestehen.
  if (state.confirmed) {
    if (Math.abs(turnAngle) >= 20) {
      return INITIAL_QIBLA_CONFIRMATION
    }

    return state
  }

  // Neue Bestätigung nur innerhalb von ±2°.
  if (Math.abs(turnAngle) > 2) {
    return INITIAL_QIBLA_CONFIRMATION
  }

  return {
    confirmed: true,
  }
}
