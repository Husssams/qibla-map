
export type NavigationIconName =
  | 'camera'
  | 'compass'
  | 'map'
  | 'help'
  | 'faq'
  | 'privacy'
  | 'imprint'

// Gemeinsame SVG-Symbole für alle Navigationsbereiche.
// Die Farbe wird über CSS mit currentColor gesteuert.
export default function NavigationIcon({
  name,
}: {
  name: NavigationIconName
}) {
  if (name === 'camera') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    )
  }

  if (name === 'compass') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
      </svg>
    )
  }

  if (name === 'map') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    )
  }

  if (name === 'help') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-1.2.9-1.6 1.4-1.6 2.6" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  if (name === 'faq') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 7c-2.5-2-5-2-9-1v13c4-1 6.5-1 9 1 2.5-2 5-2 9-1V6c-4-1-6.5-1-9 1Z" />
        <path d="M12 7v13" />
      </svg>
    )
  }

  if (name === 'privacy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2 20 5v6c0 5-3.2 8-8 11-4.8-3-8-6-8-11V5Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M15 2v5h4M9 12h7M9 16h7" />
    </svg>
  )
}
