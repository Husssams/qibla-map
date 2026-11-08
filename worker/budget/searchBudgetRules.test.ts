import { describe, expect, it } from 'vitest'
import { getDailyStatus, reserveDailySearch } from './searchBudgetRules'

describe('daily search budget', () => {
  const today = '2026-10-31'

  it('starts with 2900 available searches', () => {
    const status = getDailyStatus(undefined, today)

    expect(status.used).toBe(0)
    expect(status.remaining).toBe(2900)
    expect(status.available).toBe(true)
  })

  it('allows the 2900th search but rejects the 2901st', () => {
    // Es wurden bereits 2.899 Anfragen verbraucht.
    const saved = { date: today, used: 2899 }

    // Die nächste Anfrage wird noch erlaubt.
    const afterLastSearch = reserveDailySearch(saved, today)

    expect(afterLastSearch).toEqual({
      date: today,
      used: 2900,
    })

    // Danach ist keine weitere Anfrage mehr erlaubt.
    expect(reserveDailySearch(afterLastSearch ?? undefined, today)).toBeNull()
  })

  it('resets the budget on the next UTC day', () => {
    const yesterday = { date: '2026-10-30', used: 2900 }

    const status = getDailyStatus(yesterday, today)

    expect(status.used).toBe(0)
    expect(status.remaining).toBe(2900)
    expect(status.available).toBe(true)
  })

  it('reports zero remaining searches when the limit is reached', () => {
    const status = getDailyStatus({ date: today, used: 2900 }, today)

    expect(status.remaining).toBe(0)
    expect(status.available).toBe(false)
  })
})
