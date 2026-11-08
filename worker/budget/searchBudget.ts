import { DurableObject } from 'cloudflare:workers'
import { getDailyStatus, reserveDailySearch, type DailyUsage } from './searchBudgetRules'

// Dieser Zähler wird von allen QiblaMap-Benutzern gemeinsam verwendet.
export class SearchBudget extends DurableObject {
  // Liest den aktuellen Verbrauch, ohne eine Anfrage zu verbrauchen.
  getStatus() {
    // Beispiel: "2026-10-31", immer nach UTC.
    const today = new Date().toISOString().slice(0, 10)

    // Liest die gespeicherten Daten aus dem Durable Object.
    const saved = this.ctx.storage.kv.get<DailyUsage>('usage')

    // Unsere ausgelagerte Regel berechnet den aktuellen Status.
    return getDailyStatus(saved, today)
  }

  // Reserviert eine Suchanfrage im gemeinsamen, dauerhaften Speicher.
  reserve(): boolean {
    const today = new Date().toISOString().slice(0, 10)
    const saved = this.ctx.storage.kv.get<DailyUsage>('usage')

    // Unsere Geschäftsregel entscheidet, ob noch Budget vorhanden ist.
    const nextUsage = reserveDailySearch(saved, today)

    // Wenn kein Budget vorhanden ist, verändern wir nichts.
    if (nextUsage === null) return false

    // Speichert den neuen Zählerstand dauerhaft.
    this.ctx.storage.kv.put('usage', nextUsage)

    return true
  }
}
