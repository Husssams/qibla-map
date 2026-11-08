import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchPlaces } from './placeSearchApi'

// SCHRITT 1: Nach JEDEM Test räumen wir unsere Änderungen auf.
//
// afterEach() wird automatisch nach jedem einzelnen it()-Test ausgeführt.
// Das ist wichtig, weil wir in den Tests die echte fetch-Funktion ersetzen.
//
// vi.unstubAllGlobals() macht diese Ersetzung wieder rückgängig.
// So beeinflusst die simulierte Antwort eines Tests nicht den nächsten Test.
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchPlaces', () => {
  // TEST 1: Prüft eine erfolgreiche Suche mit arabischem Suchtext.
  it('returns place suggestions from the worker', async () => {
    // SCHRITT 1: Wir legen fest, welche Daten unser Worker angeblich zurückgibt.
    // "suggestions" ist der API-Feldname für die Liste der gefundenen Orte.
    // "label", "latitude" und "longitude" sind unsere eigenen Feldnamen
    // aus dem Typ PlaceSuggestion in worker/geoapify.ts.
    const fakeData = {
      suggestions: [
        {
          label: 'Omayyad Mosque, Damascus, Syria',
          latitude: 33.511,
          longitude: 36.306,
        },
      ],
    }

    // SCHRITT 2: JSON.stringify wandelt das JavaScript-Objekt in JSON-Text um.
    // Denn eine HTTP-Antwort enthält Textdaten und nicht direkt unser Objekt.
    const jsonText = JSON.stringify(fakeData)

    // SCHRITT 3: new Response erstellt eine künstliche HTTP-Antwort.
    // Der Inhalt ist jsonText und der HTTP-Status ist standardmäßig 200.
    // Hier wird noch keine Netzwerkanfrage gesendet.
    const fakeResponse = new Response(jsonText)

    // SCHRITT 4: vi.fn() kommt aus Vitest.
    // Es erstellt eine künstliche Funktion, die wir kontrollieren können.
    const fakeFetch = vi.fn()

    // SCHRITT 5: Wir bestimmen, was fakeFetch später zurückgeben soll.
    // mockResolvedValue sorgt dafür, dass fakeFetch ein erfolgreiches
    // Promise mit unserer künstlichen HTTP-Antwort zurückgibt.
    fakeFetch.mockResolvedValue(fakeResponse)

    // SCHRITT 6: Wir ersetzen die echte globale fetch-Funktion.
    // 'fetch' ist der Name der Funktion, die ersetzt werden soll.
    // fakeFetch ist unsere eigene künstliche Funktion aus Schritt 4.
    //
    // Ab jetzt verwendet searchPlaces() bei einem fetch-Aufruf unseren Mock.
    // Dadurch wird kein echter Server kontaktiert.
    vi.stubGlobal('fetch', fakeFetch)

    // SCHRITT 7: Erst JETZT führen wir die zu testende Funktion aus.
    // searchPlaces ruft intern fetch auf und erhält unsere künstliche Antwort.
    // await wartet, bis sie die JSON-Daten verarbeitet hat.
    const result = await searchPlaces('الجامع الأموي')

    // SCHRITT 5: Wir prüfen den zurückgegebenen Inhalt.
    //
    // expect(result) wählt den tatsächlichen Wert aus.
    // .toEqual(...) vergleicht den Inhalt des gesamten Objekts.
    //
    // Wir erwarten:
    // ok: true bedeutet, dass die Suche erfolgreich war.
    // suggestions enthält die gefundene Ortsliste.
    expect(result).toEqual({
      ok: true,
      suggestions: [
        {
          label: 'Omayyad Mosque, Damascus, Syria',
          latitude: 33.511,
          longitude: 36.306,
        },
      ],
    })

    // SCHRITT 6: Wir prüfen zusätzlich, WIE fetch aufgerufen wurde.
    //
    // fakeFetch merkt sich automatisch seine bisherigen Aufrufe.
    // .toHaveBeenCalledWith(...) kontrolliert die übergebenen Argumente.
    //
    // ${...} setzt einen JavaScript-Ausdruck in einen Template-String ein.
    // encodeURIComponent() kodiert den arabischen Suchtext für eine URL.
    //
    // signal: undefined bedeutet, dass hier kein AbortSignal übergeben wurde.
    expect(fakeFetch).toHaveBeenCalledWith(`/api/search?q=${encodeURIComponent('الجامع الأموي')}`, {
      signal: undefined,
    })
  })

  // TEST 2: Ungültige Koordinaten dürfen nicht übernommen werden.
  it('filters out invalid place coordinates', async () => {
    // Hier erstellen wir den Mock direkt innerhalb von stubGlobal().
    // Er funktioniert genauso wie fakeFetch im ersten Test.
    //
    // Die simulierte Antwort enthält drei Treffer:
    // 1. Einen ungültigen Breitengrad von 120.
    // 2. Einen gültigen Ort.
    // 3. Einen Treffer ohne Koordinaten.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            suggestions: [
              { label: 'Invalid place', latitude: 120, longitude: 13 },
              { label: 'Valid place', latitude: 52.5, longitude: 13.4 },
              { label: 'Missing coordinates' },
            ],
          }),
        ),
      ),
    )

    const result = await searchPlaces('Berlin')

    // Nur der gültige Treffer darf in der Ergebnisliste bleiben.
    // Die beiden anderen müssen herausgefiltert werden.
    expect(result).toEqual({
      ok: true,
      suggestions: [{ label: 'Valid place', latitude: 52.5, longitude: 13.4 }],
    })
  })

  // TEST 3: Das gemeinsame Tagesbudget ist aufgebraucht.
  it('recognizes an exhausted daily search budget', async () => {
    // Simuliert eine HTTP-Antwort mit Status 429.
    //
    // Der zweite Parameter von Response ist ein Optionsobjekt.
    // { status: 429 } legt den HTTP-Status fest.
    //
    // Obwohl der Server einen Fehler meldet, wird fetch selbst
    // erfolgreich mit einem Response-Objekt abgeschlossen.
    // searchPlaces muss den HTTP-Status und den JSON-Fehler auswerten.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'dailyLimitReached' }), { status: 429 }),
        ),
    )

    const result = await searchPlaces('Damascus')

    // Die Suche muss den Fehlercode an unsere Benutzeroberfläche weitergeben.
    expect(result).toEqual({
      ok: false,
      error: 'dailyLimitReached',
    })
  })

  // TEST 4: Ein Benutzer sendet zu viele Anfragen in kurzer Zeit.
  it('recognizes too many requests', async () => {
    // Auch hier erhalten wir HTTP 429.
    // Der JSON-Fehlercode ist diesmal aber "tooManyRequests".
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'tooManyRequests' }), { status: 429 }),
        ),
    )

    const result = await searchPlaces('Aleppo')

    // Der richtige Fehlercode ist wichtig:
    // Später zeigen wir für Rate Limiting eine andere Meldung an
    // als für ein vollständig aufgebrauchtes Tagesbudget.
    expect(result).toEqual({
      ok: false,
      error: 'tooManyRequests',
    })
  })

  // TEST 5: Der Suchdienst ist vorübergehend nicht verfügbar.
  it('handles unavailable search services', async () => {
    // HTTP 503 bedeutet, dass der Dienst momentan nicht verfügbar ist.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'searchUnavailable' }), { status: 503 }),
        ),
    )

    const result = await searchPlaces('Berlin')

    expect(result).toEqual({
      ok: false,
      error: 'searchUnavailable',
    })
  })

  // TEST 6: Eine erfolgreiche HTTP-Antwort enthält ungültige Daten.
  it('rejects invalid successful responses', async () => {
    // Der Server liefert HTTP 200, aber suggestions ist ein String.
    // Unsere Anwendung erwartet hier ein Array mit Suchvorschlägen.
    //
    // Dieser Test überprüft also nicht den HTTP-Status,
    // sondern die tatsächliche Struktur der Antwortdaten.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ suggestions: 'invalid' }))),
    )

    const result = await searchPlaces('Berlin')

    // Eine ungültige Antwort darf nicht als erfolgreiche Suche gelten.
    expect(result).toEqual({
      ok: false,
      error: 'searchUnavailable',
    })
  })

  // TEST 7: Ein AbortSignal wird korrekt an fetch weitergegeben.
  it('passes an abort signal to fetch', async () => {
    // Simuliert eine erfolgreiche Suche mit einer leeren Ergebnisliste.
    const fakeFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ suggestions: [] })))

    vi.stubGlobal('fetch', fakeFetch)

    // SCHRITT 1: Wir erstellen einen AbortController.
    //
    // Ein AbortController kann asynchrone Vorgänge abbrechen,
    // beispielsweise eine laufende HTTP-Anfrage.
    //
    // controller.signal ist das zugehörige AbortSignal.
    // Dieses Signal kann an fetch weitergegeben werden.
    const controller = new AbortController()

    // SCHRITT 2: Wir übergeben das Signal an searchPlaces.
    //
    // Der erste Parameter ist der Suchtext.
    // Der zweite Parameter ist unser AbortSignal.
    //
    // searchPlaces soll dieses Signal an fetch weiterreichen.
    await searchPlaces('Damascus', controller.signal)

    // SCHRITT 3: Wir prüfen die Argumente des fetch-Aufrufs.
    //
    // Erwartet wird die richtige Such-URL und genau unser Signal.
    // Dadurch können wir erkennen, ob searchPlaces das Signal vergisst.
    expect(fakeFetch).toHaveBeenCalledWith('/api/search?q=Damascus', { signal: controller.signal })
  })
})
