import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppNavLink } from './AppNavigationLinks'

import './NavigationMenu.css'

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
          {/* Kamera ist die Hauptfunktion unserer Qibla-App.
    Deshalb steht sie an erster Stelle im Menü. */}
          <AppNavLink to="/camera" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.arCamera')}
          </AppNavLink>

          {/* Der Live-Kompass steht an zweiter Stelle.
    Nach dem Anklicken schließen wir das Hamburger-Menü. */}
          <AppNavLink to="/compass" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.compass')}
          </AppNavLink>

          {/* Die Karte ist unser drittes Hauptwerkzeug.
    Sie bleibt weiterhin unter /map erreichbar. */}
          <AppNavLink to="/map" end className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.map')}
          </AppNavLink>

          {/* Die Hilfeseite ist bereits verfügbar. */}
          <AppNavLink to="/help" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.help')}
          </AppNavLink>
          {/* Erklärungen über Qibla und Kaaba. */}
          <AppNavLink to="/qibla-faq" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.qiblaFaq')}
          </AppNavLink>

          {/* Rechtliche Seiten sind über das Menü erreichbar. */}
          <AppNavLink to="/privacy" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.privacy')}
          </AppNavLink>

          <AppNavLink to="/imprint" className="qm-nav__link" onClick={() => setIsOpen(false)}>
            {t('navigation.imprint')}
          </AppNavLink>
        </nav>
      )}
    </div>
  )
}
