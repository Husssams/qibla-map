import type { PlaceSuggestion } from './geoapify'

// SCHRITT 1: Wir erweitern unsere bisherigen Suchergebnisse.
// PlaceSuggestion enthält bereits label, latitude und longitude.
// Mit & fügen wir weitere Eigenschaften für die Bewertung hinzu.
// Das ? bedeutet, dass eine Eigenschaft optional ist.
export type RankablePlace = PlaceSuggestion & {
  name?: string // Eigentliche Bezeichnung des Ortes
  confidence?: number // Wie sicher Geoapify bei diesem Treffer ist
  importance?: number // Bedeutung des Ortes laut Geoapify
  popularity?: number // Bekanntheit des Ortes laut Geoapify
}

// SCHRITT 2: Wir bereiten Geoapifys Bewertungszahlen vor.
// Fehlende oder ungültige Werte bekommen 0 Punkte.
// Gültige Werte werden auf einen erlaubten Bereich begrenzt.
function safeScore(value: number | undefined, maximum: number): number {
  // undefined bedeutet: Geoapify hat keinen Wert geliefert.
  // isFinite prüft, ob es sich um eine endliche Zahl handelt.
  if (value === undefined || !Number.isFinite(value)) return 0

  // Math.min begrenzt den Wert nach oben.
  // Math.max verhindert Werte unter 0.
  return Math.max(0, Math.min(value, maximum))
}

// SCHRITT 3: Wir vereinheitlichen Texte für den Vergleich.
// So behandeln wir z. B. "BERLIN" und "berlin" gleich.
function normalizeText(text: string): string {
  // normalize vereinheitlicht bestimmte Unicode-Schreibweisen.
  // trim entfernt Leerzeichen am Anfang und Ende.
  // toLocaleLowerCase wandelt Großbuchstaben in Kleinbuchstaben um.
  return text.normalize('NFKC').trim().toLocaleLowerCase()
}

// SCHRITT 4: Diese Hauptfunktion erhält den Suchtext und die Treffer.
// Beispiel: query = "Berlin", places = fünf Geoapify-Ergebnisse.
// Am Ende gibt sie dieselben Treffer in einer besseren Reihenfolge zurück.
export function rankPlaceSuggestions(query: string, places: RankablePlace[]): RankablePlace[] {
  // Bereitet den Suchtext für die Vergleiche vor.
  const searchText = normalizeText(query)

  // SCHRITT 5: Wir berechnen für jeden Treffer eine Punktzahl.
  // Je höher die Punktzahl, desto relevanter bewerten wir den Ort.
  function calculateScore(place: RankablePlace): number {
    // Bereitet den eigentlichen Ortsnamen vor.
    // ?? '' verwendet einen leeren Text, falls name fehlt.
    const name = normalizeText(place.name ?? '')

    // Bereitet auch die vollständige Adresse vor.
    const label = normalizeText(place.label)

    // Zunächst bekommt der Treffer keine Punkte für den Text.
    let textScore = 0

    // Vergleicht den eingegebenen Suchtext mit dem Ortsnamen.
    if (name === searchText) {
      // Ortsname stimmt vollständig überein.
      textScore = 30
    } else if (name.startsWith(searchText)) {
      // Ortsname beginnt mit unserem Suchtext.
      textScore = 15
    } else if (name.includes(searchText)) {
      // Suchtext kommt irgendwo im Ortsnamen vor.
      textScore = 8
    } else if (label.startsWith(searchText)) {
      // Vollständige Adresse beginnt mit dem Suchtext.
      textScore = 6
    } else if (label.includes(searchText)) {
      // Suchtext kommt irgendwo in der Adresse vor.
      textScore = 3
    }

    // SCHRITT 6: Wir berechnen die gesamte Relevanz.
    // Textübereinstimmung und Geoapify-Bewertungen werden addiert.
    // Die Zahlen 35, 15 und 3 sind unsere eigenen Gewichtungen.
    return (
      textScore +
      safeScore(place.confidence, 1) * 35 + // Sicherheit des Treffers
      safeScore(place.importance, 2) * 15 + // Bedeutung des Ortes
      safeScore(place.popularity, 10) * 3 // Bekanntheit des Ortes
    )
  }

  // SCHRITT 7: Wir sortieren alle Treffer nach ihrer Punktzahl.
  // [...places] erstellt eine Kopie der ursprünglichen Liste.
  // sort vergleicht immer zwei Treffer miteinander.
  // second - first bedeutet: Höhere Punktzahlen kommen zuerst.
  return [...places].sort((first, second) => calculateScore(second) - calculateScore(first))
}
