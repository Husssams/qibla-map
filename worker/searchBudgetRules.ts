// Unser freiwilliges Tageslimit unterhalb der 3.000 Geoapify-Credits.
export const DAILY_LIMIT = 2900

// So sieht der gespeicherte Verbrauch eines Tages aus.
export type DailyUsage = {
  date: string
  used: number
}

// Berechnet den aktuellen Status des Tagesbudgets.
export function getDailyStatus(saved: DailyUsage | undefined, today: string) {
  // Alte Werte von gestern zählen heute nicht mehr.
  const used = saved?.date === today ? saved.used : 0

  return {
    date: today,
    used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - used),
    available: used < DAILY_LIMIT,
  }
}

// Entscheidet, ob wir eine weitere Suchanfrage erlauben dürfen.
export function reserveDailySearch(
  saved: DailyUsage | undefined,
  today: string,
): DailyUsage | null {
  const status = getDailyStatus(saved, today)

  // null bedeutet: Keine weitere Anfrage erlaubt.
  if (!status.available) return null

  // Gibt den neuen Zählerstand zurück.
  return {
    date: today,
    used: status.used + 1,
  }
}
