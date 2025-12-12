import type { Review } from '../types';

const STORAGE_KEY = 'webtoon-reviews';

export function getReviews(): Review[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  try {
    const reviews = JSON.parse(data);
    return reviews.map((r: Review) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      comments: r.comments.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
    }));
  } catch {
    return [];
  }
}

export function saveReviews(reviews: Review[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function addReview(review: Review): Review[] {
  const reviews = getReviews();
  reviews.unshift(review);
  saveReviews(reviews);
  return reviews;
}

export function deleteReview(reviewId: string): Review[] {
  const reviews = getReviews().filter(r => r.id !== reviewId);
  saveReviews(reviews);
  return reviews;
}

export function addComment(
  reviewId: string,
  comment: Review['comments'][0]
): Review[] {
  const reviews = getReviews();
  const review = reviews.find(r => r.id === reviewId);

  if (review) {
    review.comments.push(comment);
    saveReviews(reviews);
  }

  return reviews;
}

export function deleteComment(reviewId: string, commentId: string): Review[] {
  const reviews = getReviews();
  const review = reviews.find(r => r.id === reviewId);

  if (review) {
    review.comments = review.comments.filter(c => c.id !== commentId);
    saveReviews(reviews);
  }

  return reviews;
}
