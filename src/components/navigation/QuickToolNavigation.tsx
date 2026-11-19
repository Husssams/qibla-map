import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import './QuickToolNavigation.css'

type Tool = 'camera' | 'compass' | 'map'

type Props = {
  currentTool?: Tool
}

// Einheitliche Symbole für alle drei Werkzeuge.
function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === 'camera') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h4l2-2h4l2 2h4v12H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    )
  }

  if (tool === 'compass') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  )
}

export default function QuickToolNavigation({ currentTool }: Props) {
  const { t } = useTranslation()

  const links: { tool: Tool; to: string; label: string }[] = [
    { tool: 'camera', to: '/camera', label: t('quickNavigation.goToCamera') },
    { tool: 'compass', to: '/compass', label: t('quickNavigation.goToCompass') },
    { tool: 'map', to: '/map', label: t('quickNavigation.goToMap') },
  ]

  return (
    <nav className="qm-quick-navigation" aria-label={t('quickNavigation.label')}>
      {links
        .filter((link) => link.tool !== currentTool)
        .map((link) => (
          <Link key={link.tool} to={link.to} className="qm-quick-navigation__link">
            <ToolIcon tool={link.tool} />
            <span>{link.label}</span>
          </Link>
        ))}
    </nav>
  )
}
