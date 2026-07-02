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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([ensureDefaultPerson(), ensureDefaultSettings()])
      .catch((err) => console.error('Failed to seed defaults:', err))
      // Render regardless — views tolerate missing defaults.
      .then(() => setReady(true))
  }, [])

  const handleNavigate = useCallback((route: Route) => {
    setView(route)
  }, [])

  const handleNavigateReview = useCallback(() => {
    setView('review')
  }, [])

  const handleReviewDone = useCallback(() => {
    setView('buzzer')
  }, [])

  if (!ready) return null

  const activeNav: Route = view === 'review' ? 'stats' : view

  return (
    <>
      {view === 'buzzer' && <BuzzerView />}
      {view === 'stats' && <StatsView onNavigateReview={handleNavigateReview} />}
      {view === 'review' && <ReviewView onDone={handleReviewDone} />}
      {view === 'journal' && <JournalView />}
      {view === 'settings' && <SettingsView />}
      <NavBar active={activeNav} onNavigate={handleNavigate} />
    </>
  )
}
