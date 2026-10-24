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

    // Prüft, ob der erlaubte Grenzwert 180 akzeptiert wird.
    it('accepts longitude at 180 degrees', () => {

        // Erwartet, dass die Berechnung keinen Fehler auslöst.
        expect(() => calculateQiblaBearing({
            // Verwendet einen gültigen Breitengrad.
            latitude: 50.59,

            // Verwendet den maximal erlaubten Längengrad.
            longitude: 180,
        })).not.toThrow()
    })

    // Prüft, ob ein Längengrad oberhalb des Grenzwerts abgelehnt wird.
    it('rejects longitude above 180 degrees', () => {

        // Erwartet einen Fehler für den ungültigen Längengrad.
        expect(() => calculateQiblaBearing({
            // Verwendet einen gültigen Breitengrad.
            latitude: 50.59,

            // Überschreitet den maximal erlaubten Längengrad.
            longitude: 180.01,
        })).toThrow('Ungültiger Längengrad.')
    })

    // Prüft, ob NaN als Breitengrad abgelehnt wird.
    it('rejects NaN as latitude', () => {

        // Erwartet einen Fehler bei einem ungültigen Breitengrad.
        expect(() => calculateQiblaBearing({

            // NaN ist keine gültige geografische Koordinate.
            latitude: NaN,

            // Verwendet einen gültigen Längengrad.
            longitude: 8.68,

        })).toThrow('Ungültiger Breitengrad.')
    })

    // Prüft, ob Infinity als Längengrad abgelehnt wird.
    it('rejects Infinity as longitude', () => {

        // Erwartet einen Fehler bei einem unendlichen Längengrad.
        expect(() => calculateQiblaBearing({

            // Verwendet einen gültigen Breitengrad.
            latitude: 50.59,

            // Infinity ist kein gültiger geografischer Längengrad.
            longitude: Infinity,

        })).toThrow('Ungültiger Längengrad.')
    })
})