// Importiert die Testfunktionen von Vitest.
import { describe, it, expect } from 'vitest'

// Importiert unsere Qibla-Berechnungsfunktion.
import { calculateQiblaBearing } from './qiblaBearing'

// Importiert die gespeicherten Koordinaten der Kaaba.
import { KAABA_COORDINATES } from '../constants/kaaba'

// Gruppiert die Tests unserer Berechnungsfunktion.
describe('calculateQiblaBearing', () => {
  // Definiert einen Test für den Standort Gießen.
  it('calculates the correct Qibla direction for Gießen', () => {
    // Berechnet die Qibla-Richtung anhand der Testkoordinaten.
    const result = calculateQiblaBearing({
      latitude: 50.59,
      longitude: 8.68,
    })

    // Überprüft, ob das Ergebnis ungefähr 128,4 Grad beträgt.
    expect(result).toBeCloseTo(128.4, 1)
  })

  it('returns null at the exact Kaaba location', () => {
    expect(calculateQiblaBearing(KAABA_COORDINATES)).toBeNull()
  })

  // Testet einen ungültigen Breitengrad.
  it('rejects an invalid latitude', () => {
    // Erwartet einen Fehler bei einem Breitengrad von 150 Grad.
    expect(() =>
      calculateQiblaBearing({
        latitude: 150,
        longitude: 8.68,
      }),
    ).toThrow('Ungültiger Breitengrad.')
  })

  // Testet einen ungültigen Längengrad.
  it('rejects an invalid longitude', () => {
    // Erwartet einen Fehler bei einem Längengrad von 250 Grad.
    expect(() =>
      calculateQiblaBearing({
        latitude: 50.59,
        longitude: 250,
      }),
    ).toThrow('Ungültiger Längengrad.')
  })

  // Prüft, ob der erlaubte Grenzwert 180 akzeptiert wird.
  it('accepts longitude at 180 degrees', () => {
    // Erwartet, dass die Berechnung keinen Fehler auslöst.
    expect(() =>
      calculateQiblaBearing({
        // Verwendet einen gültigen Breitengrad.
        latitude: 50.59,

        // Verwendet den maximal erlaubten Längengrad.
        longitude: 180,
      }),
    ).not.toThrow()
  })

  // Prüft, ob ein Längengrad oberhalb des Grenzwerts abgelehnt wird.
  it('rejects longitude above 180 degrees', () => {
    // Erwartet einen Fehler für den ungültigen Längengrad.
    expect(() =>
      calculateQiblaBearing({
        // Verwendet einen gültigen Breitengrad.
        latitude: 50.59,

        // Überschreitet den maximal erlaubten Längengrad.
        longitude: 180.01,
      }),
    ).toThrow('Ungültiger Längengrad.')
  })

  // Prüft, ob NaN als Breitengrad abgelehnt wird.
  it('rejects NaN as latitude', () => {
    // Erwartet einen Fehler bei einem ungültigen Breitengrad.
    expect(() =>
      calculateQiblaBearing({
        // NaN ist keine gültige geografische Koordinate.
        latitude: NaN,

        // Verwendet einen gültigen Längengrad.
        longitude: 8.68,
      }),
    ).toThrow('Ungültiger Breitengrad.')
  })

  // Prüft, ob Infinity als Längengrad abgelehnt wird.
  it('rejects Infinity as longitude', () => {
    // Erwartet einen Fehler bei einem unendlichen Längengrad.
    expect(() =>
      calculateQiblaBearing({
        // Verwendet einen gültigen Breitengrad.
        latitude: 50.59,

        // Infinity ist kein gültiger geografischer Längengrad.
        longitude: Infinity,
      }),
    ).toThrow('Ungültiger Längengrad.')
  })

  // Testet die Qibla-Richtung für Berlin.
  it('calculates the Qibla direction for Berlin', () => {
    // Ruft unsere Berechnungsfunktion mit den Koordinaten von Berlin auf.
    const result = calculateQiblaBearing({
      // Breitengrad von Berlin.
      latitude: 52.52,

      // Längengrad von Berlin.
      longitude: 13.405,
    })

    // Vergleicht den berechneten Winkel mit unserem Referenzwert.
    expect(result).toBeCloseTo(136.58, 2)
  })

  // Testet die Qibla-Richtung für London.
  it('calculates the Qibla direction for London', () => {
    // Berechnet die Qibla-Richtung für London.
    const result = calculateQiblaBearing({
      // Breitengrad von London.
      latitude: 51.5074,

      // Negativer Längengrad, weil London westlich des Nullmeridians liegt.
      longitude: -0.1278,
    })

    // Vergleicht das Ergebnis mit dem unabhängigen WGS84-Referenzwert.
    expect(result).toBeCloseTo(118.87, 2)
  })

  // Testet die Qibla-Richtung für New York.
  it('calculates the Qibla direction for New York', () => {
    // Berechnet die Qibla-Richtung für New York.
    const result = calculateQiblaBearing({
      // Breitengrad von New York.
      latitude: 40.7128,

      // Negativer Längengrad von New York.
      longitude: -74.006,
    })

    // Vergleicht den Winkel mit dem WGS84-Referenzwert.
    expect(result).toBeCloseTo(58.4, 2)
  })

  // Testet die Normalisierung eines negativen Anfangswinkels.
  it('normalizes the Qibla direction for Tokyo', () => {
    // Berechnet die Qibla-Richtung für Tokio.
    const result = calculateQiblaBearing({
      // Breitengrad von Tokio.
      latitude: 35.6762,

      // Längengrad von Tokio.
      longitude: 139.6503,
    })

    // Prüft den erwarteten geografischen Winkel.
    expect(result).toBeCloseTo(293.07, 2)

    // Prüft, dass der Winkel nicht negativ ist.
    expect(result).toBeGreaterThanOrEqual(0)

    // Prüft, dass der Winkel kleiner als 360 Grad ist.
    expect(result).toBeLessThan(360)
  })

  // Testet einen Standort ungefähr einen Meter von der Kaaba entfernt.
  it('rejects locations extremely close to the Kaaba', () => {
    // Erstellt einen Teststandort ungefähr 1,1 Meter nördlich der Kaaba.
    const nearbyLocation = {
      // Erhöht den Breitengrad der Kaaba minimal.
      latitude: KAABA_COORDINATES.latitude + 0.00001,

      // Verwendet denselben Längengrad wie die Kaaba.
      longitude: KAABA_COORDINATES.longitude,
    }

    // Erwartet, dass keine unzuverlässige Richtung zurückgegeben wird.
    expect(calculateQiblaBearing(nearbyLocation)).toBeNull()
  })

  // Verhindert den Absturz durch die echten Koordinaten eines Kaaba-Suchergebnisses.
  it('handles a geocoding result very close to the Kaaba', () => {
    const location = {
      latitude: 21.42245079,
      longitude: 39.826189,
    }

    expect(calculateQiblaBearing(location)).toBeNull()
  })
})
