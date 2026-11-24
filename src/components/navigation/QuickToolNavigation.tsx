import { AppLink } from './AppNavigationLinks'
import { useTranslation } from 'react-i18next'
import './QuickToolNavigation.css'
import NavigationIcon from './NavigationIcon'

type Tool = 'camera' | 'compass' | 'map'

type Props = {
  currentTool?: Tool
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
          <AppLink key={link.tool} to={link.to} className="qm-quick-navigation__link">
            <NavigationIcon name={link.tool} />
            <span>{link.label}</span>
          </AppLink>
        ))}
    </nav>
  )
}
