
import type { MouseEvent } from 'react'

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  type LinkProps,
  type NavLinkProps,
} from 'react-router'

// Unsere Navigation verwendet derzeit feste interne URL-Pfade.
type AppLinkProps = Omit<LinkProps, 'to' | 'replace' | 'state'> & {
  to: string
}

type AppNavLinkProps = Omit<
  NavLinkProps,
  'to' | 'replace' | 'state'
> & {
  to: string
}

/*
 * Gemeinsame Navigationsregel:
 *
 * Kamera -> andere Seite: Neuen History-Eintrag erzeugen.
 * Unterseite -> Unterseite: Aktuelle Unterseite ersetzen.
 * Unterseite -> Kamera: Zum vorhandenen Kamera-Eintrag zurück.
 *
 * So entsteht kein langer Stapel besuchter Unterseiten.
 */
function useAppNavigation(to: string) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    // Standardverhalten für bereits behandelte Klicks,
    // neue Tabs und Klicks mit Sondertasten erhalten.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event.currentTarget.target !== '' &&
        event.currentTarget.target !== '_self')
    ) {
      return
    }

    event.preventDefault()

    // Auf derselben Seite müssen wir nichts verändern.
    if (location.pathname === to) return

    // Prüfen, ob ein Kamera-Eintrag hinter dieser Seite liegt.
    const historyState = location.state as {
      cameraBase?: boolean
    } | null

    const hasCameraBase = historyState?.cameraBase === true

    // Wenn die Kamera bereits in der History liegt,
    // kehren wir zu diesem Eintrag zurück.
    if (to === '/camera') {
      if (hasCameraBase) {
        navigate(-1)
      } else {
        navigate('/camera', { replace: true })
      }

      return
    }

    // Ein Wechsel von der Kamera erzeugt einen Rückkehrpunkt.
    const fromCamera = location.pathname === '/camera'

    navigate(to, {
      // Weitere Seitenwechsel ersetzen nur die Unterseite.
      replace: !fromCamera,

      // Merken, dass wir zur Kamera zurückkehren können.
      state: {
        cameraBase: fromCamera || hasCameraBase,
      },
    })
  }

  return handleNavigation
}

/*
 * Ersatz für normale interne Link-Komponenten.
 * Aussehen und CSS-Klassen bleiben unverändert.
 */
export function AppLink({ to, onClick, ...props }: AppLinkProps) {
  const handleNavigation = useAppNavigation(to)

  return (
    <Link
      {...props}
      to={to}
      onClick={(event) => {
        onClick?.(event)
        handleNavigation(event)
      }}
    />
  )
}

/*
 * Ersatz für NavLink im Hamburger-Menü.
 * Die Hervorhebung der aktiven Seite bleibt erhalten.
 */
export function AppNavLink({
  to,
  onClick,
  ...props
}: AppNavLinkProps) {
  const handleNavigation = useAppNavigation(to)

  return (
    <NavLink
      {...props}
      to={to}
      onClick={(event) => {
        onClick?.(event)
        handleNavigation(event)
      }}
    />
  )
}
