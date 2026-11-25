
import { describe, expect, it } from 'vitest'

// Alle vorhandenen Übersetzungsdateien automatisch laden.
const translationFiles = import.meta.glob<Record<string, unknown>>('./*/translation.json', {
  eager: true,
  import: 'default',
})

// Verschachtelte Übersetzungsschlüssel in vollständige Pfade umwandeln.
function flattenTranslations(
  translation: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(translation)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenTranslations(value as Record<string, unknown>, path),
      )
    } else {
      result[path] = value
    }
  }

  return result
}

describe('translation completeness', () => {
  // Englisch dient als Referenz für alle Übersetzungsschlüssel.
  const english = translationFiles['./en/translation.json']
  const referenceKeys = english
    ? Object.keys(flattenTranslations(english)).sort()
    : []

  it('has an English reference translation', () => {
    expect(english).toBeDefined()
    expect(referenceKeys.length).toBeGreaterThan(0)
  })

  // Jede vorhandene Sprache muss alle englischen Schlüssel enthalten.
  for (const [filePath, translation] of Object.entries(translationFiles)) {
    const languageCode = filePath.split('/')[1]

    it(`${languageCode} has complete and non-empty translations`, () => {
      const flattened = flattenTranslations(translation)
      const actualKeys = Object.keys(flattened).sort()

      // Fehlende oder zusätzliche Schlüssel erkennen.
      expect(actualKeys).toEqual(referenceKeys)

      // Jeder Übersetzungswert muss ein nicht leerer Text sein.
      for (const [key, value] of Object.entries(flattened)) {
        expect(
          typeof value,
          `${languageCode}: ${key} must be a string`,
        ).toBe('string')

        if (typeof value === 'string') {
          expect(
            value.trim(),
            `${languageCode}: ${key} must not be empty`,
          ).not.toBe('')
        }
      }
    })
  }
})
