import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import './NavigationMenu.css'

// Diese Seiten werden in späteren Issues implementiert.
// Bis dahin erscheinen sie nur als geplante Funktionen.
const plannedPages = ['compass', 'arCamera', 'about', 'privacy', 'imprint', 'settings'] as const

export default function NavigationMenu() {
  const { t } = useTranslation()

  // Merkt sich, ob das Hamburger-Menü geöffnet ist.
  const [isOpen, setIsOpen] = useState(false)

  // Eindeutige ID für die Verbindung zwischen Button und Menü.
  const menuId = useId()

  // Referenzen für Klicks außerhalb und Tastaturbedienung.
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Escape schließt das Menü und setzt den Fokus zurück.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    // Ein Klick außerhalb des Menüs schließt es ebenfalls.
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  return (
    <div className="qm-nav" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="qm-nav__button"
        aria-label={t(isOpen ? 'navigation.close' : 'navigation.open')}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
      </button>

      {isOpen && (
        <nav id={menuId} className="qm-nav__panel" aria-label={t('navigation.title')}>
          {/* Die Karten-Hauptseite ist bereits verfügbar. */}
          <NavLink to="/" end className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.map')}
          </NavLink>

          {/* Noch nicht implementierte Seiten sind keine Links. */}
          {plannedPages.map((page) => (
            <div className="qm-nav__planned" key={page}>
              <span>{t(`navigation.${page}`)}</span>
              <small>{t('navigation.comingSoon')}</small>
            </div>
          ))}
        </nav>
      )}
    </div>
  )
}
