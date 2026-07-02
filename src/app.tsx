import { useState, useCallback, useEffect } from 'preact/hooks'
import { NavBar, type Route } from './components/NavBar.tsx'
import { BuzzerView } from './views/BuzzerView.tsx'
import { StatsView } from './views/StatsView.tsx'
import { ReviewView } from './views/ReviewView.tsx'
import { SettingsView } from './views/SettingsView.tsx'
import { JournalView } from './views/JournalView.tsx'
import { ensureDefaultPerson } from './db/persons.ts'
import { ensureDefaultSettings } from './db/settings.ts'

type AppView = Route | 'review'

export function App() {
  const [view, setView] = useState<AppView>('buzzer')
  const [statsWeek, setStatsWeek] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([ensureDefaultPerson(), ensureDefaultSettings()])
      .catch((err) => console.error('Failed to seed defaults:', err))
      // Render regardless — views tolerate missing defaults.
      .then(() => setReady(true))
  }, [])

  const handleNavigate = useCallback((route: Route) => {
    setStatsWeek(null)
    setView(route)
  }, [])

  const handleNavigateReview = useCallback(() => {
    setView('review')
  }, [])

  const handleReviewDone = useCallback(() => {
    setView('buzzer')
  }, [])

  // Journal cards deep-link into that week's stats.
  const handleOpenWeek = useCallback((weekId: string) => {
    setStatsWeek(weekId)
    setView('stats')
  }, [])

  if (!ready) return null

  return (
    <>
      {view === 'buzzer' && <BuzzerView />}
      {view === 'stats' && (
        <StatsView
          key={statsWeek ?? 'current'}
          initialWeekId={statsWeek ?? undefined}
          onNavigateReview={handleNavigateReview}
        />
      )}
      {view === 'review' && <ReviewView onDone={handleReviewDone} />}
      {view === 'journal' && <JournalView onOpenWeek={handleOpenWeek} />}
      {view === 'settings' && <SettingsView />}
      {/* The review is a focused full-screen flow — no tab bar, so no
          falsely-highlighted tab and no accidental mid-review exits. */}
      {view !== 'review' && <NavBar active={view} onNavigate={handleNavigate} />}
    </>
  )
}
