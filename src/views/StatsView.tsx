import { useState, useCallback, useEffect } from 'preact/hooks'
import { StatCard } from '../components/StatCard.tsx'
import { WeekChart } from '../components/WeekChart.tsx'
import { useWeekEvents } from '../hooks/useWeekEvents.ts'
import { useWeekStats, formatTrend } from '../hooks/useWeekStats.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { useCurrentWeekId } from '../hooks/useCurrentWeekId.ts'
import { getPreviousWeekId, getNextWeekId, formatWeekRange } from '../lib/week.ts'
import { useLiveQuery } from '../hooks/useLiveQuery.ts'
import { db } from '../db/index.ts'
import styles from './StatsView.module.css'

interface StatsViewProps {
  onNavigateReview?: () => void
  initialWeekId?: string
}

export function StatsView({ onNavigateReview, initialWeekId }: StatsViewProps) {
  const currentWeekId = useCurrentWeekId()
  const [weekId, setWeekId] = useState(initialWeekId ?? currentWeekId)
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

  // Previous week, same person filter — for the week-over-week trend.
  const prevWeekId = getPreviousWeekId(weekId)
  const prevEvents = useWeekEvents(prevWeekId)
  const prevStats = useWeekStats(
    personFilter ? prevEvents.filter((e) => e.personId === personFilter) : prevEvents,
    prevWeekId,
  )
  const trend =
    stats.totalEvents > 0 ? formatTrend(stats.tensionPerHour, prevStats.tensionPerHour) : undefined

  const peakDay = stats.dailyCounts.reduce(
    (best, d) => (d.count > best.count ? d : best),
    stats.dailyCounts[0],
  )

  const review = useLiveQuery(() => db.reviews.get(weekId), [weekId], undefined)
  const isCurrentWeek = weekId === currentWeekId
  // Persistent entry point: invite a review once there is something to
  // review, and allow editing after completion.
  const showReviewBanner = isCurrentWeek && events.length > 0

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
        <div class={styles.empty}>
          <div class={styles.emptyHeadline}>No tensions logged this week</div>
          <div class={styles.emptySub}>
            Tap the Buzzer whenever you feel tension — your patterns will build up here.
          </div>
        </div>
      ) : (
        <>
          <div class={styles.statsRow}>
            <StatCard
              label="Tensions"
              value={String(stats.totalEvents)}
              sub={peakDay.count > 0 ? `Peak day: ${peakDay.day}` : undefined}
            />
            <StatCard label="Tension / Hour" value={stats.tensionPerHour.toFixed(2)} trend={trend} />
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
          <span class={styles.reviewBannerText}>
            {review?.completedAt ? 'Edit this week’s review' : 'Time to review your week'}
          </span>
        </button>
      )}
    </div>
  )
}
