import { useState, useCallback } from 'preact/hooks'
import { StatCard } from '../components/StatCard.tsx'
import { WeekChart } from '../components/WeekChart.tsx'
import { useWeekEvents } from '../hooks/useWeekEvents.ts'
import { useWeekStats } from '../hooks/useWeekStats.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { getCurrentWeekId, formatWeekRange } from '../lib/week.ts'
import { saveReview } from '../db/reviews.ts'
import { computeWeekStats } from '../hooks/useWeekStats.ts'
import styles from './ReviewView.module.css'

interface ReviewViewProps {
  onDone: () => void
}

export function ReviewView({ onDone }: ReviewViewProps) {
  const weekId = getCurrentWeekId()
  const events = useWeekEvents(weekId)
  const stats = useWeekStats(events, weekId)
  const persons = usePersons()
  const [step, setStep] = useState(0)
  const [countermeasures, setCountermeasures] = useState('')

  const recurringThemes = stats.tagCounts.filter((t) => t.count >= 2)

  const handleComplete = useCallback(async () => {
    const personSummaries = persons.map((p) => {
      const personEvents = events.filter((e) => e.personId === p.id)
      const pStats = computeWeekStats(personEvents, weekId)
      return {
        personId: p.id,
        totalEvents: pStats.totalEvents,
        tensionPerHour: pStats.tensionPerHour,
        topTags: pStats.tagCounts.slice(0, 5),
      }
    })
    await saveReview({
      weekId,
      completedAt: Date.now(),
      personSummaries,
      countermeasures: countermeasures.trim(),
    })
    onDone()
  }, [weekId, events, persons, countermeasures, onDone])

  return (
    <div class={styles.container}>
      <div class={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} class={`${styles.dot} ${i === step ? styles.active : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div class={styles.stepTitle}>Your Week</div>
          <div class={styles.stepContent}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
              {formatWeekRange(weekId)}
            </p>
            <StatCard label="Tension / Hour" value={stats.tensionPerHour.toFixed(2)} sub={`${stats.totalEvents} events`} />
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <WeekChart dailyCounts={stats.dailyCounts} />
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.nextBtn} onClick={() => setStep(1)}>
              Next
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div class={styles.stepTitle}>Recurring Themes</div>
          <div class={styles.stepContent}>
            {recurringThemes.length > 0 ? (
              recurringThemes.map((t) => (
                <div class={styles.themeItem} key={t.tag}>
                  <span class={styles.themeName}>{t.tag}</span>
                  <span class={styles.themeCount}>{t.count}x</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-text-muted)' }}>
                No recurring themes this week. Try tagging your tensions for better insights.
              </p>
            )}
            <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-lg)' }}>Notice any patterns?</p>
          </div>
          <div class={styles.actions}>
            <button class={styles.backBtn} onClick={() => setStep(0)}>
              Back
            </button>
            <button class={styles.nextBtn} onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div class={styles.stepTitle}>Countermeasures</div>
          <div class={styles.stepContent}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
              What could help next week?
            </p>
            <textarea
              class={styles.textarea}
              placeholder="e.g., Set boundaries at work, take walks after lunch..."
              value={countermeasures}
              onInput={(e) => setCountermeasures((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div class={styles.actions}>
            <button class={styles.backBtn} onClick={() => setStep(1)}>
              Back
            </button>
            <button class={styles.nextBtn} onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div class={styles.stepTitle}>Review Complete</div>
          <div class={styles.stepContent}>
            <div class={styles.doneMessage}>
              <div class={styles.doneIcon}>&#10003;</div>
              <div class={styles.doneText}>
                You logged {stats.totalEvents} tension{stats.totalEvents !== 1 ? 's' : ''} and reflected on your patterns.
              </div>
              <div class={styles.doneSub}>Keep going. Awareness is the first step.</div>
            </div>
          </div>
          <div class={styles.actions}>
            <button class={styles.backBtn} onClick={() => setStep(2)}>
              Back
            </button>
            <button class={styles.nextBtn} onClick={handleComplete}>
              Back to Buzzer
            </button>
          </div>
        </>
      )}
    </div>
  )
}
