
import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { searchPlaces, type PlaceSearchError, type PlaceSuggestion } from '../../utils/search/placeSearchApi'
import { validatePlaceSearchInput } from '../../utils/search/placeSearchInput'

import './PlaceSearch.css'

type PlaceSearchTexts = {
  label: string
  placeholder: string
  loading: string
  noResults: string
  dailyLimitReached: string
  tooManyRequests: string
  searchUnavailable: string
}

type PlaceSearchProps = {
  texts: PlaceSearchTexts
  onSelect: (place: PlaceSuggestion) => void
}

export function PlaceSearch({ texts, onSelect }: PlaceSearchProps) {
  const { i18n } = useTranslation()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])

  // Verhindert eine erneute Suche, nachdem ein Vorschlag übernommen wurde.
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  // -1 bedeutet, dass noch kein Vorschlag per Tastatur markiert ist.
  const [activeIndex, setActiveIndex] = useState(-1)

  const [isLoading, setIsLoading] = useState(false)

  // Unterscheidet "noch nicht gesucht" von "keine Ergebnisse gefunden".
  const [hasSearched, setHasSearched] = useState(false)

  const [error, setError] = useState<PlaceSearchError | null>(null)

  const inputId = useId()

  // Sucht nach gültigen Eingaben und bricht veraltete Anfragen ab.
  useEffect(() => {
    const validation = validatePlaceSearchInput(query)

    // Eine Auswahl darf nicht sofort eine neue Suche nach ihrem Namen auslösen.
    if (!validation.valid || selectedLabel === query) return

    const controller = new AbortController()

    // Debouncing: Erst 500 ms nach der letzten Eingabe wird gesucht.
    const timer = setTimeout(async () => {
      setIsLoading(true)

      try {
        const result = await searchPlaces(validation.query, controller.signal)

        // Eine abgebrochene Anfrage darf keine neueren Ergebnisse überschreiben.
        if (controller.signal.aborted) return

        if (result.ok) {
          setSuggestions(result.suggestions)
          setError(null)
        } else {
          setSuggestions([])
          setError(result.error)
        }

        setHasSearched(true)
      } catch {
        // Auch Netzwerkfehler werden als übersetzbarer Fehlercode angezeigt.
        if (!controller.signal.aborted) {
          setSuggestions([])
          setError('searchUnavailable')
          setHasSearched(true)
        }
      } finally {
        // Nur die noch gültige Anfrage darf den Ladezustand beenden.
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 500)

    // Bei neuer Eingabe: Timer entfernen und laufende Anfrage abbrechen.
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, selectedLabel])

  function handleQueryChange(value: string) {
    setQuery(value)

    // Alte Ergebnisse und Meldungen gehören nicht zur neuen Eingabe.
    setSuggestions([])
    setSelectedLabel(null)
    setActiveIndex(-1)
    setIsLoading(false)
    setHasSearched(false)
    setError(null)
  }

  function selectPlace(place: PlaceSuggestion) {
    setQuery(place.label)
    setSelectedLabel(place.label)
    setSuggestions([])
    setActiveIndex(-1)

    // App.tsx übernimmt die Koordinaten und aktualisiert Karte und Qibla.
    onSelect(place)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setSuggestions([])
      setActiveIndex(-1)
      return
    }

    if (suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()

      // Nach dem letzten Vorschlag beginnt die Auswahl wieder beim ersten.
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()

      // Vom ersten Vorschlag springt die Auswahl zurück zum letzten.
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()

      // Ohne vorherige Pfeiltastenauswahl wird der erste Treffer übernommen.
      const index = activeIndex >= 0 ? activeIndex : 0

      selectPlace(suggestions[index])
    }
  }

  return (
    <div className="place-search">
      <label htmlFor={inputId} className="place-search__label">
        {texts.label}
      </label>

      <div className="place-search__combobox">
        <input
          id={inputId}
          className={
            suggestions.length > 0
              ? 'place-search__input place-search__input--open'
              : 'place-search__input'
          }
          type="search"
          value={query}
          placeholder={texts.placeholder}
          // Der Platzhalter folgt der App-Sprache, Suchtext seiner eigenen Schreibrichtung.
          dir={query.trim() ? 'auto' : i18n.dir()}
          autoComplete="off"
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        {suggestions.length > 0 && (
          <ul className="place-search__suggestions" dir={i18n.dir()}>
            {suggestions.map((place, index) => (
              <li key={`${place.latitude}-${place.longitude}-${index}`}>
                <button
                  type="button"
                  // Icon und Text folgen gemeinsam der Sprache des jeweiligen Ortsnamens.
                  dir="auto"
                  className="place-search__suggestion"
                  data-active={activeIndex === index}
                  onClick={() => selectPlace(place)}
                >
                  <svg
                    className="place-search__suggestion-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>

                  <span className="place-search__suggestion-text">
                    {place.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isLoading && <p role="status">{texts.loading}</p>}

      {/* Fehlercodes dienen als Schlüssel unserer vorhandenen Übersetzungen. */}
      {error && <p role="alert">{texts[error]}</p>}

      {!isLoading &&
        !error &&
        hasSearched &&
        suggestions.length === 0 &&
        selectedLabel !== query && <p>{texts.noResults}</p>}
    </div>
  )
}
