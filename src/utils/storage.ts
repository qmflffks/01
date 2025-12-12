import { supabase } from '../lib/supabase';
import type { Review, Comment } from '../types';

// Supabase에서 리뷰 + 댓글 불러오기
export async function fetchReviews(): Promise<Review[]> {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !reviews) {
    console.error('Failed to fetch reviews:', error);
    return [];
  }

  // 각 리뷰의 댓글도 불러오기
  const reviewsWithComments = await Promise.all(
    reviews.map(async (review) => {
      const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .eq('review_id', review.id)
        .order('created_at', { ascending: true });

      return {
        id: review.id,
        webtoonTitle: review.webtoon_title,
        episode: review.episode,
        imageUrl: review.image_url,
        createdAt: new Date(review.created_at),
        comments: (comments || []).map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: new Date(c.created_at),
          reactions: [],
        })),
      } as Review;
    })
  );

  return reviewsWithComments;
}

// 리뷰 추가
export async function addReview(review: Review): Promise<boolean> {
  const { error } = await supabase.from('reviews').insert({
    id: review.id,
    webtoon_title: review.webtoonTitle,
    episode: review.episode || null,
    image_url: review.imageUrl,
    created_at: review.createdAt.toISOString(),
  });

  if (error) {
    console.error('Failed to add review:', error);
    return false;
  }

  // 첫 번째 댓글이 있으면 추가
  if (review.comments.length > 0) {
    const comment = review.comments[0];
    await addComment(review.id, comment);
  }

  return true;
}

// 리뷰 삭제
export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) {
    console.error('Failed to delete review:', error);
    return false;
  }

  return true;
}

// 댓글 추가
export async function addComment(reviewId: string, comment: Comment): Promise<boolean> {
  const { error } = await supabase.from('comments').insert({
    id: comment.id,
    review_id: reviewId,
    text: comment.text,
    created_at: comment.createdAt.toISOString(),
  });

  if (error) {
    console.error('Failed to add comment:', error);
    return false;
  }

  return true;
}

// 댓글 삭제
export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }

  return true;
}
