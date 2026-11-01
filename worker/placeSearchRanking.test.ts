
import { describe, expect, it } from 'vitest'
import { rankPlaceSuggestions } from './placeSearchRanking'

// SCHRITT 1: Wir erstellen eine Testgruppe für unsere Sortierfunktion.
//
// describe() fasst mehrere zusammengehörige Tests zusammen.
// Der erste Parameter ist der Name der Testgruppe.
// Der zweite Parameter ist eine Funktion, die unsere Tests enthält.
//
// it() beschreibt einen einzelnen Testfall.
// Jeder Test überprüft ein bestimmtes erwartetes Verhalten.
//
// expect() prüft später, ob das tatsächliche Ergebnis richtig ist.
describe('rankPlaceSuggestions', () => {
  // TEST 1: Ein bekannter Ort soll vor einem weniger relevanten Treffer stehen.
  it('prefers a highly relevant landmark over a weaker text match', () => {
    // SCHRITT 2: Wir rufen die echte Sortierfunktion auf.
    //
    // Der erste Parameter ist der eingegebene Suchtext: "قلعة حلب".
    // Der zweite Parameter ist eine Liste mit zwei Beispieltreffern.
    //
    // Diese Treffer haben wir selbst festgelegt.
    // Wir rufen Geoapify hier NICHT über das Internet auf.
    //
    // Die Funktion bewertet beide Treffer und liefert sie sortiert zurück.
    // Das Ergebnis speichern wir in der Variable results.
    const results = rankPlaceSuggestions('قلعة حلب', [
      {
        // Treffer 1: Ein Geschäft in Berlin.
        // Es enthält unseren arabischen Suchtext im Namen.
        label: 'Aleppo Burg قلعة حلب, Berlin, Germany',

        // Koordinaten dieses Beispieltreffers.
        latitude: 52.48,
        longitude: 13.42,

        // Der eigentliche Name, ohne die vollständige Adresse.
        name: 'Aleppo Burg قلعة حلب',

        // Beispielhafte Bewertungen für diesen Treffer.
        confidence: 0.55,
        importance: 0.2,
        popularity: 1,
      },
      {
        // Treffer 2: Die gesuchte Zitadelle in Aleppo.
        // Ihr englischer Name enthält den arabischen Suchtext nicht.
        label: 'Citadel of Aleppo, Aleppo, Syria',
        latitude: 36.19,
        longitude: 37.16,
        name: 'Citadel of Aleppo',

        // Höhere Bewertungen sollen diesen Treffer bevorzugen.
        confidence: 0.95,
        importance: 0.9,
        popularity: 5,
      },
    ])

    // SCHRITT 3: Wir prüfen das Ergebnis.
    //
    // results ist die sortierte Liste.
    // results[0] greift auf das ERSTE Element zu.
    // Arrays beginnen in JavaScript bei Index 0.
    //
    // .label liest den Ortsnamen aus diesem Element.
    // .toBe() prüft, ob der Wert genau dem erwarteten Text entspricht.
    //
    // Der Test besteht nur, wenn die Zitadelle auf Platz 1 steht.
    expect(results[0].label).toBe('Citadel of Aleppo, Aleppo, Syria')
  })

  // TEST 2: Ein exakter Ortsname soll eine teilweise Übereinstimmung schlagen.
  it('prefers an exact place name when other scores are equal', () => {
    // Wir suchen nach "Berlin" und übergeben zwei Treffer.
    // Es gibt diesmal keine Geoapify-Bewertungen.
    // Deshalb entscheidet hauptsächlich die Textübereinstimmung.
    const results = rankPlaceSuggestions('Berlin', [
      {
        // Dieser Name beginnt mit "Berlin", ist aber nicht exakt gleich.
        // Unsere Funktion vergibt dafür 15 Textpunkte.
        label: 'Berlin Street, Germany',
        name: 'Berlin Street',
        latitude: 50,
        longitude: 10,
      },
      {
        // Dieser Name stimmt exakt mit "Berlin" überein.
        // Unsere Funktion vergibt dafür 30 Textpunkte.
        label: 'Berlin, Germany',
        name: 'Berlin',
        latitude: 52.5,
        longitude: 13.4,
      },
    ])

    // Prüft, ob "Berlin" nach der Sortierung an erster Stelle steht.
    // Obwohl "Berlin Street" ursprünglich zuerst in der Liste stand.
    expect(results[0].name).toBe('Berlin')
  })

  // TEST 3: Groß- und Kleinschreibung sollen keinen Unterschied machen.
  it('compares names without case sensitivity', () => {
    // Der Suchtext enthält große Buchstaben und äußere Leerzeichen.
    // Unsere normalizeText()-Funktion macht daraus "berlin".
    const results = rankPlaceSuggestions('  BERLIN  ', [
      {
        label: 'Berlin, Germany',
        name: 'Berlin',
        latitude: 52.5,
        longitude: 13.4,
      },
    ])

    // Prüft, ob der einzige Treffer zurückgegeben wird.
    // Achtung: Dieser Test prüft den Textvergleich noch nicht ausreichend,
    // weil die Liste sowieso nur einen Treffer enthält.
    expect(results[0].label).toBe('Berlin, Germany')
  })

  // TEST 4: Bei gleicher Punktzahl bleibt die ursprüngliche Reihenfolge.
  it('preserves the original order when scores are equal', () => {
    // Wir erstellen eine Liste und speichern sie in places.
    // Beide Treffer erhalten dieselbe Bewertung: 0 Punkte.
    // Weder "First" noch "Second" passt zum Suchtext "Unknown".
    const places = [
      { label: 'First', latitude: 50, longitude: 10 },
      { label: 'Second', latitude: 51, longitude: 11 },
    ]

    // Ruft unsere Sortierfunktion mit der ursprünglichen Liste auf.
    const results = rankPlaceSuggestions('Unknown', places)

    // .map() geht durch alle Elemente der Ergebnisliste.
    // Für jedes Element gibt (place) => place.label nur den Namen zurück.
    //
    // Aus:
    // [{ label: 'First', ... }, { label: 'Second', ... }]
    //
    // wird:
    // ['First', 'Second']
    //
    // .toEqual() vergleicht hier den Inhalt der gesamten Liste.
    // Die ursprüngliche Reihenfolge soll erhalten bleiben.
    expect(results.map((place) => place.label)).toEqual(['First', 'Second'])

    // Prüft zusätzlich, ob unsere ursprüngliche Liste unverändert blieb.
    //
    // Warum ist das wichtig?
    // Unsere Sortierfunktion benutzt [...places], um eine Kopie zu erstellen.
    // Dadurch verändert .sort() nicht direkt die übergebene Liste.
    expect(places[0].label).toBe('First')
  })
})
