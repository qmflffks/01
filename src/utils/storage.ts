import type { Review } from '../types';

const STORAGE_KEY = 'webtoon-reviews-admin';

// JSON 파일에서 공개 리뷰 로드
export async function fetchPublicReviews(): Promise<Review[]> {
  try {
    const response = await fetch('./data/reviews.json');
    if (!response.ok) return [];

    const reviews = await response.json();
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

// localStorage에서 관리자 리뷰 로드 (관리자 전용)
export function getAdminReviews(): Review[] {
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

export function saveAdminReviews(reviews: Review[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function addReview(review: Review, currentReviews: Review[]): Review[] {
  const reviews = [review, ...currentReviews];
  saveAdminReviews(reviews);
  return reviews;
}

export function deleteReview(reviewId: string, currentReviews: Review[]): Review[] {
  const reviews = currentReviews.filter(r => r.id !== reviewId);
  saveAdminReviews(reviews);
  return reviews;
}

export function addComment(
  reviewId: string,
  comment: Review['comments'][0],
  currentReviews: Review[]
): Review[] {
  const reviews = currentReviews.map(r => {
    if (r.id === reviewId) {
      return { ...r, comments: [...r.comments, comment] };
    }
    return r;
  });
  saveAdminReviews(reviews);
  return reviews;
}

export function deleteComment(
  reviewId: string,
  commentId: string,
  currentReviews: Review[]
): Review[] {
  const reviews = currentReviews.map(r => {
    if (r.id === reviewId) {
      return { ...r, comments: r.comments.filter(c => c.id !== commentId) };
    }
    return r;
  });
  saveAdminReviews(reviews);
  return reviews;
}

// 리뷰 데이터를 JSON으로 내보내기 (관리자용)
export function exportReviewsToJson(reviews: Review[]): void {
  const dataStr = JSON.stringify(reviews, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'reviews.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
