import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/preact'
import { BuzzerView } from './BuzzerView.tsx'
import { TaggingModal } from './TaggingModal.tsx'
import { db } from '../db/index.ts'
import { ensureDefaultPerson } from '../db/persons.ts'
import { ensureDefaultSettings } from '../db/settings.ts'
import { addEvent, getAllEvents } from '../db/events.ts'

beforeEach(async () => {
  await Promise.all([db.events.clear(), db.persons.clear(), db.reviews.clear(), db.settings.clear()])
  await ensureDefaultPerson()
  await ensureDefaultSettings()
})

describe('quick-log flow (BuzzerView)', () => {
  it('one tap logs an event and shows the snackbar', async () => {
    render(<BuzzerView />)
    const buzzer = await screen.findByRole('button', { name: 'Log tension for Me' })

    fireEvent.click(buzzer)

    await waitFor(async () => {
      expect(await getAllEvents()).toHaveLength(1)
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Logged')
    // No modal in the way — logging stays one-tap.
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('undo removes the just-logged event', async () => {
    render(<BuzzerView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Log tension for Me' }))
    const undo = await screen.findByRole('button', { name: 'Undo' })

    fireEvent.click(undo)

    await waitFor(async () => {
      expect(await getAllEvents()).toHaveLength(0)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('"Add details" opens the tagging dialog for the logged event', async () => {
    render(<BuzzerView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Log tension for Me' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add details' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('How are you feeling?')
  })

  it('tagging via the dialog persists tags on Done', async () => {
    render(<BuzzerView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Log tension for Me' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add details' }))
    await screen.findByRole('dialog')

    fireEvent.click(screen.getByRole('button', { name: 'work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(async () => {
      const [event] = await getAllEvents()
      expect(event.tags).toEqual(['work'])
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows the first-run hint only when no events exist', async () => {
    render(<BuzzerView />)
    expect(await screen.findByText(/Tap the buzzer to log it/)).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Log tension for Me' }))
    await waitFor(() => {
      expect(screen.queryByText(/Tap the buzzer to log it/)).toBeNull()
    })
  })
})

describe('TaggingModal commit-on-close', () => {
  it('commits selected tags when the overlay is tapped (never discards)', async () => {
    const eventId = await addEvent('default')
    const onClose = vi.fn()
    render(<TaggingModal eventId={eventId} onClose={onClose} />)

    fireEvent.click(await screen.findByRole('button', { name: 'family' }))
    fireEvent.click(screen.getByRole('dialog').parentElement!)

    await waitFor(async () => {
      const [event] = await getAllEvents()
      expect(event.tags).toEqual(['family'])
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('commits note and tags on Escape', async () => {
    const eventId = await addEvent('default')
    const onClose = vi.fn()
    render(<TaggingModal eventId={eventId} onClose={onClose} />)

    fireEvent.click(await screen.findByRole('button', { name: 'health' }))
    fireEvent.input(screen.getByRole('textbox', { name: /What happened/ }), {
      target: { value: '  long day  ' },
    })
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(async () => {
      const [event] = await getAllEvents()
      expect(event.tags).toEqual(['health'])
      expect(event.note).toBe('long day')
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('adding a custom tag selects it and persists it to presets', async () => {
    const eventId = await addEvent('default')
    render(<TaggingModal eventId={eventId} onClose={() => {}} />)

    const input = await screen.findByPlaceholderText('+ Add tag...')
    fireEvent.input(input, { target: { value: 'Commute' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Selected in the picker and stored (lowercased) in settings presets.
    await waitFor(async () => {
      const settings = await db.settings.get('settings')
      expect(settings?.presetTags).toContain('commute')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(async () => {
      const [event] = await getAllEvents()
      expect(event.tags).toEqual(['commute'])
    })
  })

  it('is a proper dialog: role, label, and focus inside', async () => {
    const eventId = await addEvent('default')
    render(<TaggingModal eventId={eventId} onClose={() => {}} />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true)
    })
  })
})
