// Legt fest, welche Informationen ein Suchvorschlag enthält.
export type PlaceSuggestion = {
  label: string // Name oder vollständige Adresse
  latitude: number // Breitengrad
  longitude: number // Längengrad
}

// async: Die Funktion führt eine asynchrone API-Anfrage aus.
// Promise<PlaceSuggestion[]>: Sie liefert später eine Liste von Suchvorschlägen.
export async function searchGeoapify(query: string, apiKey: string): Promise<PlaceSuggestion[]> {
  // Erstellt die Adresse des Geoapify-Suchdienstes.
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')

  // Fügt Suchtext, Antwortformat, maximale Trefferzahl und API-Schlüssel hinzu.
  // searchParams kodiert auch arabische Zeichen und Sonderzeichen korrekt.
  url.searchParams.set('text', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('apiKey', apiKey)

  // fetch sendet die HTTP-Anfrage. await wartet auf die Antwort.
  // Nach 8 Sekunden wird die Anfrage automatisch abgebrochen.
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8000),
  })

  // response.ok ist bei erfolgreichen HTTP-Statuscodes true.
  // Bei einem Fehler brechen wir mit throw ab.
  if (!response.ok) {
    throw new Error('Geoapify request failed')
  }

  // Wandelt die JSON-Antwort in JavaScript-Daten um.
  // unknown bedeutet: Wir müssen die fremden Daten erst überprüfen.
  const data: unknown = await response.json()

  // Prüft, ob data ein Objekt mit einer Ergebnisliste namens results ist.
  if (
    typeof data !== 'object' ||
    data === null ||
    !('results' in data) ||
    !Array.isArray(data.results)
  ) {
    throw new Error('Invalid Geoapify response')
  }

  // Hier sammeln wir ausschließlich gültige Suchergebnisse.
  const suggestions: PlaceSuggestion[] = []

  // Durchläuft jedes Ergebnis, das Geoapify zurückgegeben hat.
  for (const item of data.results) {
    // Ungültige Ergebnisse überspringen wir mit continue.
    if (typeof item !== 'object' || item === null) continue

    // Record<string, unknown> erlaubt den Zugriff auf Eigenschaften,
    // ohne deren Datentypen bereits als vertrauenswürdig anzusehen.
    const place = item as Record<string, unknown>

    // Prüft die Adresse und Koordinaten eines Geoapify-Suchergebnisses.
    if (
      typeof place.formatted !== 'string' || // Adresse muss ein Text sein.
      !place.formatted.trim() || // Adresse darf nicht leer sein.
      typeof place.lat !== 'number' || // Breitengrad muss eine Zahl sein.
      typeof place.lon !== 'number' || // Längengrad muss eine Zahl sein.
      !Number.isFinite(place.lat) || // Breitengrad darf nicht NaN oder Infinity sein.
      !Number.isFinite(place.lon) || // Längengrad darf nicht NaN oder Infinity sein.
      place.lat < -90 || // Breitengrad darf nicht kleiner als -90° sein.
      place.lat > 90 || // Breitengrad darf nicht größer als 90° sein.
      place.lon < -180 || // Längengrad darf nicht kleiner als -180° sein.
      place.lon > 180 // Längengrad darf nicht größer als 180° sein.
    ) {
      // Überspringt dieses Ergebnis, falls eine der Bedingungen zutrifft.
      continue
    }

    // Übernimmt den gültigen Treffer in unsere eigene Ergebnisliste.
    // trim() entfernt äußere Leerzeichen, slice() begrenzt die Textlänge.
    suggestions.push({
      label: place.formatted.trim().slice(0, 200),
      latitude: place.lat,
      longitude: place.lon,
    })

    // break beendet die Schleife, sobald wir fünf Treffer gesammelt haben.
    if (suggestions.length === 5) break
  }

  // Gibt die geprüften Suchvorschläge an unseren Worker zurück.
  return suggestions
}
