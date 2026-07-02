import { useState, useCallback, useEffect } from 'preact/hooks'
import { StatCard } from '../components/StatCard.tsx'
import { WeekChart } from '../components/WeekChart.tsx'
import { useWeekEvents } from '../hooks/useWeekEvents.ts'
import { useWeekStats } from '../hooks/useWeekStats.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { useCurrentWeekId } from '../hooks/useCurrentWeekId.ts'
import { getPreviousWeekId, getNextWeekId, formatWeekRange } from '../lib/week.ts'
import { useLiveQuery } from '../hooks/useLiveQuery.ts'
import { db } from '../db/index.ts'
import styles from './StatsView.module.css'

interface StatsViewProps {
  onNavigateReview?: () => void
}

export function StatsView({ onNavigateReview }: StatsViewProps) {
  const currentWeekId = useCurrentWeekId()
  const [weekId, setWeekId] = useState(currentWeekId)
  const [personFilter, setPersonFilter] = useState<string | null>(null)
  const events = useWeekEvents(weekId)
  const persons = usePersons()

  // If the filtered person is deleted, fall back to "All" instead of a
  // permanently empty week.
  useEffect(() => {
    if (personFilter && persons.length > 0 && !persons.some((p) => p.id === personFilter)) {
      setPersonFilter(null)
    }
  }, [personFilter, persons])
  const stats = useWeekStats(
    personFilter ? events.filter((e) => e.personId === personFilter) : events,
    weekId,
  )

  const review = useLiveQuery(() => db.reviews.get(weekId), [weekId], undefined)
  const isCurrentWeek = weekId === currentWeekId
  const showReviewBanner = isCurrentWeek && !review?.completedAt

  const handlePrev = useCallback(() => setWeekId((w) => getPreviousWeekId(w)), [])
  const handleNext = useCallback(() => {
    setWeekId((w) => {
      const next = getNextWeekId(w)
      return next <= currentWeekId ? next : w
    })
  }, [currentWeekId])

  const maxTagCount = Math.max(1, ...stats.tagCounts.map((t) => t.count))

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <button class={styles.navBtn} onClick={handlePrev} aria-label="Previous week">
          ‹
        </button>
        <div class={styles.weekLabel}>{formatWeekRange(weekId)}</div>
        <button class={styles.navBtn} onClick={handleNext} disabled={isCurrentWeek} aria-label="Next week">
          ›
        </button>
      </div>

      {persons.length > 1 && (
        <div class={styles.personToggle}>
          <button
            class={`${styles.personBtn} ${personFilter === null ? styles.active : ''}`}
            onClick={() => setPersonFilter(null)}
          >
            All
          </button>
          {persons.map((p) => (
            <button
              key={p.id}
              class={`${styles.personBtn} ${personFilter === p.id ? styles.active : ''}`}
              onClick={() => setPersonFilter(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {events.length === 0 ? (
        <div class={styles.empty}>No tension events this week. Keep going!</div>
      ) : (
        <>
          <div class={styles.statsRow}>
            <StatCard label="Tension / Hour" value={stats.tensionPerHour.toFixed(2)} sub={`${stats.totalEvents} total`} />
          </div>

          <div class={styles.section}>
            <div class={styles.sectionTitle}>Daily breakdown</div>
            <WeekChart dailyCounts={stats.dailyCounts} />
          </div>

          {stats.tagCounts.length > 0 && (
            <div class={styles.section}>
              <div class={styles.sectionTitle}>Top themes</div>
              {stats.tagCounts.map((t) => (
                <div class={styles.tagBar} key={t.tag}>
                  <span class={styles.tagName}>{t.tag}</span>
                  <div
                    class={styles.tagBarFill}
                    style={{ width: `${(t.count / maxTagCount) * 100}%`, maxWidth: '200px' }}
                  />
                  <span class={styles.tagCount}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showReviewBanner && onNavigateReview && (
        <button class={styles.reviewBanner} onClick={onNavigateReview}>
          <span class={styles.reviewBannerText}>Time to review your week</span>
        </button>
      )}
    </div>
  )
}
