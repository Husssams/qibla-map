/// <reference types="node" />

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Alle vorhandenen Übersetzungsdateien direkt aus dem Dateisystem laden.
const translationFiles: Record<string, Record<string, unknown>> = Object.fromEntries(
  readdirSync(new URL('.', import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = `./${entry.name}/translation.json`
      const fileUrl = new URL(filePath, import.meta.url)

      return { filePath, fileUrl }
    })
    .filter(({ fileUrl }) => existsSync(fileUrl))
    .map(({ filePath, fileUrl }): [string, Record<string, unknown>] => [
      filePath,
      JSON.parse(readFileSync(fileUrl, 'utf8')) as Record<string, unknown>,
    ]),
)

// Verschachtelte Übersetzungsschlüssel in vollständige Pfade umwandeln.
function flattenTranslations(
  translation: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(translation)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, path))
    } else {
      result[path] = value
    }
  }

  return result
}

describe('translation completeness', () => {
  // Englisch dient als Referenz für alle Übersetzungsschlüssel.
  const english = translationFiles['./en/translation.json']
  const referenceKeys = english ? Object.keys(flattenTranslations(english)).sort() : []

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
        expect(typeof value, `${languageCode}: ${key} must be a string`).toBe('string')

        if (typeof value === 'string') {
          expect(value.trim(), `${languageCode}: ${key} must not be empty`).not.toBe('')
        }
      }
    })
  }
})
