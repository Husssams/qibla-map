export type Theme = 'light' | 'dark'

// Wir lesen die gespeicherte Einstellung aus dem Browser.
const savedTheme = localStorage.getItem('qibla-map-theme')

// Ohne gespeicherte Einstellung verwenden wir das System-Theme.
const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light'

// Nur gültige gespeicherte Werte werden übernommen.
export const initialTheme: Theme =
  savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : systemTheme

// Wir aktivieren das Theme bereits vor der React-Darstellung.
document.documentElement.dataset.theme = initialTheme

// Diese Funktion wechselt das Theme und speichert die Auswahl.
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('qibla-map-theme', theme)
}
