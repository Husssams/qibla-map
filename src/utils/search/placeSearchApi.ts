// Ein Suchvorschlag enthält den Ortsnamen und seine Koordinaten.
export type PlaceSuggestion = {
  label: string
  latitude: number
  longitude: number
}

// Diese Fehler kann unsere Benutzeroberfläche unterschiedlich anzeigen.
export type PlaceSearchError = 'dailyLimitReached' | 'tooManyRequests' | 'searchUnavailable'

// Unterscheidet erfolgreiche Suchen von fehlgeschlagenen Anfragen.
export type PlaceSearchResult =
  { ok: true; suggestions: PlaceSuggestion[] } | { ok: false; error: PlaceSearchError }

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSearchResult> {
  // Ruft unseren Worker mit korrekt kodiertem Suchtext auf.
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal })

  // API-Antworten sind fremde Daten und werden deshalb überprüft.
  const data: unknown = await response.json()

  // Prüft, ob die Antwort ein JSON-Objekt ist.
  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'searchUnavailable' }
  }

  // Bei einem HTTP-Fehler lesen wir den Fehlercode des Workers.
  if (!response.ok) {
    if ('error' in data) {
      if (data.error === 'dailyLimitReached') {
        return { ok: false, error: 'dailyLimitReached' }
      }

      if (data.error === 'tooManyRequests') {
        return { ok: false, error: 'tooManyRequests' }
      }
    }

    return { ok: false, error: 'searchUnavailable' }
  }

  // Eine erfolgreiche Antwort muss eine Ergebnisliste enthalten.
  if (!('suggestions' in data) || !Array.isArray(data.suggestions)) {
    return { ok: false, error: 'searchUnavailable' }
  }

  // Übernimmt ausschließlich Suchvorschläge mit gültigen Daten.
  const suggestions: PlaceSuggestion[] = data.suggestions.filter(
    (item: unknown): item is PlaceSuggestion => {
      if (typeof item !== 'object' || item === null) return false

      const place = item as Record<string, unknown>

      return (
        typeof place.label === 'string' &&
        typeof place.latitude === 'number' &&
        Number.isFinite(place.latitude) &&
        place.latitude >= -90 &&
        place.latitude <= 90 &&
        typeof place.longitude === 'number' &&
        Number.isFinite(place.longitude) &&
        place.longitude >= -180 &&
        place.longitude <= 180
      )
    },
  )

  return { ok: true, suggestions }
}
