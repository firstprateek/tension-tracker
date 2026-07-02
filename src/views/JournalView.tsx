import { useLiveQuery } from '../hooks/useLiveQuery.ts'
import { db } from '../db/index.ts'
import type { WeeklyReview } from '../db/index.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { formatWeekRange } from '../lib/week.ts'
import styles from './JournalView.module.css'

interface JournalViewProps {
  onOpenWeek?: (weekId: string) => void
}

export function JournalView({ onOpenWeek }: JournalViewProps) {
  const reviews = useLiveQuery(
    () => db.reviews.toArray().then((r) => r.filter((rev) => rev.completedAt).sort((a, b) => b.weekId.localeCompare(a.weekId))),
    [],
    [] as WeeklyReview[],
  )
  const persons = usePersons()

  const getPersonName = (id: string) => persons.find((p) => p.id === id)?.name ?? 'Unknown'

  return (
    <div class={styles.container}>
      <div class={styles.title}>Journal</div>
      <div class={styles.subtitle}>Your weekly reviews and countermeasures</div>

      {reviews.length === 0 ? (
        <div class={styles.empty}>
          <div class={styles.emptyIcon}>&#9998;</div>
          <div class={styles.emptyText}>No reviews yet</div>
          <div class={styles.emptySub}>Complete your first weekly review to see it here</div>
        </div>
      ) : (
        reviews.map((review) => {
          const totalEvents = review.personSummaries.reduce((sum, ps) => sum + ps.totalEvents, 0)
          const allTopTags = review.personSummaries
            .flatMap((ps) => ps.topTags)
            .reduce(
              (acc, t) => {
                const existing = acc.find((a) => a.tag === t.tag)
                if (existing) existing.count += t.count
                else acc.push({ ...t })
                return acc
              },
              [] as { tag: string; count: number }[],
            )
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

          return (
            <button
              class={styles.reviewCard}
              key={review.weekId}
              onClick={() => onOpenWeek?.(review.weekId)}
              aria-label={`Open stats for ${formatWeekRange(review.weekId)}`}
            >
              <div class={styles.reviewHeader}>
                <span class={styles.weekLabel}>{formatWeekRange(review.weekId)}</span>
                <span class={styles.eventCount}>
                  {totalEvents} event{totalEvents !== 1 ? 's' : ''} ›
                </span>
              </div>

              {review.personSummaries.length > 1 && (
                <div class={styles.statsRow}>
                  {review.personSummaries.map((ps) => (
                    <div class={styles.statItem} key={ps.personId}>
                      <span class={styles.statValue}>{ps.totalEvents}</span>
                      <span class={styles.statLabel}>{getPersonName(ps.personId)}</span>
                    </div>
                  ))}
                </div>
              )}

              {allTopTags.length > 0 && (
                <div class={styles.tagsRow}>
                  {allTopTags.map((t) => (
                    <span class={styles.tag} key={t.tag}>
                      {t.tag} ({t.count})
                    </span>
                  ))}
                </div>
              )}

              {review.countermeasures && (
                <>
                  <div class={styles.divider} />
                  <div class={styles.countermeasuresLabel}>Countermeasures</div>
                  <div class={styles.countermeasuresText}>{review.countermeasures}</div>
                </>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
