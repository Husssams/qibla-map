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

    // Testet den Sonderfall: Benutzer steht genau an der Kaaba.
    it('rejects the exact Kaaba location', () => {
        // Erwartet einen Fehler, weil Start und Ziel identisch sind.
        expect(() => calculateQiblaBearing(KAABA_COORDINATES))
            .toThrow('Am Zielpunkt ist keine Qibla-Richtung definiert.')
    })

    // Testet einen ungültigen Breitengrad.
    it('rejects an invalid latitude', () => {
        // Erwartet einen Fehler bei einem Breitengrad von 150 Grad.
        expect(() => calculateQiblaBearing({
            latitude: 150,
            longitude: 8.68,
        })).toThrow('Ungültiger Breitengrad.')
    })

    // Testet einen ungültigen Längengrad.
    it('rejects an invalid longitude', () => {
        // Erwartet einen Fehler bei einem Längengrad von 250 Grad.
        expect(() => calculateQiblaBearing({
            latitude: 50.59,
            longitude: 250,
        })).toThrow('Ungültiger Längengrad.')
    })
})