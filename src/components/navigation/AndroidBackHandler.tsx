
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

// Steuert die Android-Zurück-Taste unabhängig von der Browserhistorie.
export default function AndroidBackHandler() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Speichert den aktuellen Pfad für den Android-Listener.
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    // Im Browser bleibt die normale Zurück-Navigation erhalten.
    if (Capacitor.getPlatform() !== 'android') {
      return
    }

    let cancelled = false

    // Reagiert auf die native Android-Zurück-Taste.
    const registration = CapacitorApp.addListener(
      'backButton',
      () => {
        if (cancelled) return

        // Zuerst einen geöffneten Informationsdialog schließen.
        const openDialog =
          document.querySelector<HTMLDialogElement>('dialog[open]')

        if (openDialog) {
          openDialog.close()
          return
        }

        // Geöffnete Sprachauswahl schließen.
        const openLanguageDropdown =
          document.querySelector<HTMLDetailsElement>(
            '.qm-language-dropdown[open]',
          )

        if (openLanguageDropdown) {
          openLanguageDropdown.open = false
          return
        }

        // Hamburger-Menü über seine bestehende Klickfunktion schließen.
        const menuButton =
          document.querySelector<HTMLButtonElement>(
            '.qm-nav__button[aria-expanded="true"]',
          )

        if (menuButton) {
          menuButton.click()
          menuButton.focus()
          return
        }

        // Auf der Kamera oder Startseite beendet Zurück die App.
        if (
          pathnameRef.current === '/camera' ||
          pathnameRef.current === '/'
        ) {
          void CapacitorApp.exitApp().catch((error: unknown) => {
            console.error('Android app exit failed:', error)
          })
          return
        }

        // Von allen anderen Seiten direkt zur Kamera wechseln.
        // replace verhindert einen zusätzlichen History-Eintrag.
        navigate('/camera', {
          replace: true,
          state: null,
        })
      },
    )

    // Fehler bei der Registrierung protokollieren.
    void registration.catch((error: unknown) => {
      console.error('Android back listener failed:', error)
    })

    // Listener entfernen, wenn React den Effekt aufräumt.
    return () => {
      cancelled = true

      void registration
        .then((listener) => listener.remove())
        .catch((error: unknown) => {
          console.error('Android back listener cleanup failed:', error)
        })
    }
  }, [navigate])

  // Keine sichtbare Oberfläche erforderlich.
  return null
}
