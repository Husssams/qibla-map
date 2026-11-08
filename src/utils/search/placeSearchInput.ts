// Beschreibt das Ergebnis einer Eingabeprüfung.
export type SearchInputResult =
  { valid: true; query: string } | { valid: false; reason: 'invalidInput' | 'tooShort' | 'tooLong' }

// Prüft einen Suchtext, bevor eine API-Anfrage vorbereitet wird.
export function validatePlaceSearchInput(rawQuery: unknown): SearchInputResult {
  // Auch Daten von außen könnten einen unerwarteten Typ enthalten.
  if (typeof rawQuery !== 'string') {
    return { valid: false, reason: 'invalidInput' }
  }

  // Steuerzeichen wie Zeilenumbrüche oder Nullbytes sind nicht erlaubt.
  if (/[\p{Cc}]/u.test(rawQuery)) {
    return { valid: false, reason: 'invalidInput' }
  }

  // Entfernt überflüssige Leerzeichen und vereinheitlicht Unicode-Text.
  const query = rawQuery.normalize('NFC').trim().replace(/\s+/gu, ' ')

  // Array.from zählt Unicode-Zeichen statt nur UTF-16-Codeeinheiten.
  const length = Array.from(query).length

  if (length < 3) {
    return { valid: false, reason: 'tooShort' }
  }

  if (length > 120) {
    return { valid: false, reason: 'tooLong' }
  }

  // Gibt den geprüften Suchtext unabhängig von der Sprache zurück.
  return { valid: true, query }
}
