import { db } from './index.ts'
import type { WeeklyReview } from './index.ts'

export async function getReview(weekId: string): Promise<WeeklyReview | undefined> {
  return db.reviews.get(weekId)
}

export async function saveReview(review: WeeklyReview): Promise<void> {
  await db.reviews.put(review)
}

export async function getAllReviews(): Promise<WeeklyReview[]> {
  return db.reviews.toArray()
}

export async function deleteAllReviews(): Promise<void> {
  await db.reviews.clear()
}
