import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/preact'
import { StatsView } from './StatsView.tsx'
import { ReviewView } from './ReviewView.tsx'
import { JournalView } from './JournalView.tsx'
import { db } from '../db/index.ts'
import { ensureDefaultPerson } from '../db/persons.ts'
import { ensureDefaultSettings } from '../db/settings.ts'
import { addEvent, updateEvent } from '../db/events.ts'
import { saveReview } from '../db/reviews.ts'
import { formatTrend } from '../hooks/useWeekStats.ts'
import { getCurrentWeekId, getPreviousWeekId } from '../lib/week.ts'

beforeEach(async () => {
  await Promise.all([db.events.clear(), db.persons.clear(), db.reviews.clear(), db.settings.clear()])
  await ensureDefaultPerson()
  await ensureDefaultSettings()
})

describe('formatTrend', () => {
  it('reports a drop as good', () => {
    expect(formatTrend(0.5, 1)).toEqual({ text: '↓ 50% vs last week', good: true })
  })
  it('reports a rise as bad', () => {
    expect(formatTrend(1.5, 1)).toEqual({ text: '↑ 50% vs last week', good: false })
  })
  it('reports parity', () => {
    expect(formatTrend(1, 1)).toEqual({ text: '≈ same as last week', good: true })
  })
  it('returns undefined without a baseline', () => {
    expect(formatTrend(1, 0)).toBeUndefined()
    expect(formatTrend(Infinity, 1)).toBeUndefined()
  })
})

describe('StatsView', () => {
  it('shows a helpful empty state with guidance', async () => {
    render(<StatsView />)
    expect(await screen.findByText('No tensions logged this week')).toBeInTheDocument()
    expect(screen.getByText(/Tap the Buzzer/)).toBeInTheDocument()
    // No review banner when there is nothing to review.
    expect(screen.queryByText(/review your week/i)).toBeNull()
  })

  it('shows totals, peak day, and the review banner once events exist', async () => {
    await addEvent('default')
    await addEvent('default')
    render(<StatsView onNavigateReview={() => {}} />)

    const tensionsLabel = await screen.findByText('Tensions')
    expect(within(tensionsLabel.parentElement as HTMLElement).getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/Peak day:/)).toBeInTheDocument()
    expect(screen.getByText('Time to review your week')).toBeInTheDocument()
  })

  it('switches the banner to edit mode after the review is completed', async () => {
    await addEvent('default')
    await saveReview({
      weekId: getCurrentWeekId(),
      completedAt: Date.now(),
      personSummaries: [],
      countermeasures: '',
    })
    render(<StatsView onNavigateReview={() => {}} />)
    expect(await screen.findByText('Edit this week’s review')).toBeInTheDocument()
  })

  it('honors initialWeekId for journal deep-links', async () => {
    render(<StatsView initialWeekId="2026-W01" />)
    expect(await screen.findByText('Dec 29, 2025 – Jan 4, 2026')).toBeInTheDocument()
  })
})

describe('ReviewView', () => {
  it('pre-fills countermeasures from an existing review instead of wiping them', async () => {
    await saveReview({
      weekId: getCurrentWeekId(),
      completedAt: Date.now(),
      personSummaries: [],
      countermeasures: 'Keep taking walks',
    })
    render(<ReviewView onDone={() => {}} />)

    // Walk to the countermeasures step.
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Countermeasures/ })).toHaveValue('Keep taking walks')
    })
  })

  it('surfaces recent event notes and cross-week themes in the reflection step', async () => {
    const id = await addEvent('default')
    await updateEvent(id, { tags: ['work'], note: 'deadline slipped' })
    // "work" also appeared in last week's review → recurring across weeks.
    await saveReview({
      weekId: getPreviousWeekId(getCurrentWeekId()),
      completedAt: Date.now(),
      personSummaries: [
        { personId: 'default', totalEvents: 3, tensionPerHour: 0.02, topTags: [{ tag: 'work', count: 3 }] },
      ],
      countermeasures: '',
    })
    render(<ReviewView onDone={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))

    expect(await screen.findByText('work')).toBeInTheDocument()
    expect(screen.getByText('also last week')).toBeInTheDocument()
    expect(screen.getByText('“deadline slipped”')).toBeInTheDocument()
  })

  it('saves the review with Save & Finish', async () => {
    const onDone = vi.fn()
    await addEvent('default')
    render(<ReviewView onDone={onDone} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    fireEvent.input(screen.getByRole('textbox', { name: /Countermeasures/ }), {
      target: { value: 'Morning runs' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Save & Finish' }))

    await waitFor(async () => {
      const review = await db.reviews.get(getCurrentWeekId())
      expect(review?.completedAt).toBeTruthy()
      expect(review?.countermeasures).toBe('Morning runs')
    })
    expect(onDone).toHaveBeenCalled()
  })
})

describe('JournalView', () => {
  it('shows completed reviews and deep-links into that week', async () => {
    await saveReview({
      weekId: '2026-W20',
      completedAt: Date.now(),
      personSummaries: [
        { personId: 'default', totalEvents: 4, tensionPerHour: 0.02, topTags: [{ tag: 'money', count: 2 }] },
      ],
      countermeasures: 'Budget review on Sundays',
    })
    const onOpenWeek = vi.fn()
    render(<JournalView onOpenWeek={onOpenWeek} />)

    const card = await screen.findByRole('button', { name: /Open stats for/ })
    expect(screen.getByText('Budget review on Sundays')).toBeInTheDocument()
    expect(screen.getByText('money (2)')).toBeInTheDocument()

    fireEvent.click(card)
    expect(onOpenWeek).toHaveBeenCalledWith('2026-W20')
  })

  it('hides incomplete reviews', async () => {
    await saveReview({
      weekId: '2026-W21',
      completedAt: null,
      personSummaries: [],
      countermeasures: '',
    })
    render(<JournalView />)
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument()
  })
})
