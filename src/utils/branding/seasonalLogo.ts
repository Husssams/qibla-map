const STANDARD_LOGO = '/images/logo.png'
const RAMADAN_LOGO = '/images/logoRamadan.png'

// Prüft anhand des islamischen Kalenders, ob Ramadan ist.
export function isRamadan(date: Date = new Date()): boolean {
  for (const calendar of ['islamic-umalqura', 'islamic']) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      calendar,
      month: 'numeric',
    })

    // Nur tatsächlich unterstützte islamische Kalender verwenden.
    if (formatter.resolvedOptions().calendar !== calendar) {
      continue
    }

    const month = formatter.formatToParts(date).find((part) => part.type === 'month')?.value

    return Number(month) === 9
  }

  return false
}

// Wählt das passende Logo ohne Netzwerkabfrage.
export function getSeasonalLogo(date: Date = new Date()): string {
  return isRamadan(date) ? RAMADAN_LOGO : STANDARD_LOGO
}
