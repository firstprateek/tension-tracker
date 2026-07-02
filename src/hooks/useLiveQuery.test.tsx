import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/preact'
import { useLiveQuery } from './useLiveQuery.ts'
import { db } from '../db/index.ts'

function WeekProbe({ weekId }: { weekId: string }) {
  const events = useLiveQuery(() => db.events.where('weekId').equals(weekId).toArray(), [weekId], [])
  return <div data-testid="probe">{events.map((e) => e.note).join(',') || 'empty'}</div>
}

beforeEach(async () => {
  await db.events.clear()
  await db.events.bulkAdd([
    { id: 'a1', personId: 'p', timestamp: 1, tags: [], note: 'week-a-event', weekId: '2026-W01' },
    { id: 'b1', personId: 'p', timestamp: 2, tags: [], note: 'week-b-event', weekId: '2026-W02' },
  ])
})

describe('useLiveQuery', () => {
  it('resolves data for the initial deps', async () => {
    render(<WeekProbe weekId="2026-W01" />)
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('week-a-event'))
  })

  // Pins the stale-data fix: when deps change, the hook must reset to the
  // default value instead of showing the previous query's rows while the
  // new subscription resolves.
  it('never shows the previous deps’ data while the new query resolves', async () => {
    const { rerender } = render(<WeekProbe weekId="2026-W01" />)
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('week-a-event'))

    rerender(<WeekProbe weekId="2026-W02" />)
    expect(screen.getByTestId('probe')).not.toHaveTextContent('week-a-event')

    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('week-b-event'))
  })

  it('reflects live inserts', async () => {
    render(<WeekProbe weekId="2026-W01" />)
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('week-a-event'))

    await db.events.add({ id: 'a2', personId: 'p', timestamp: 3, tags: [], note: 'another', weekId: '2026-W01' })
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('week-a-event,another'))
  })
})
