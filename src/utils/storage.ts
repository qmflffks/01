import { supabase } from '../lib/supabase';
import type { Review, Comment, BlogSettings } from '../types';

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
        authorNickname: review.author_nickname || '익명',
        authorEmail: review.author_email || '',
        createdAt: new Date(review.created_at),
        comments: (comments || []).map((c) => ({
          id: c.id,
          text: c.text,
          authorNickname: c.author_nickname || '익명',
          authorEmail: c.author_email || '',
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
    author_nickname: review.authorNickname,
    author_email: review.authorEmail,
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

// 리뷰 수정
export async function updateReview(reviewId: string, webtoonTitle: string, episode?: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({
      webtoon_title: webtoonTitle,
      episode: episode || null,
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Failed to update review:', error);
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
    author_nickname: comment.authorNickname,
    author_email: comment.authorEmail,
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

// 댓글 수정
export async function updateComment(commentId: string, text: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .update({ text })
    .eq('id', commentId);

  if (error) {
    console.error('Failed to update comment:', error);
    return false;
  }

  return true;
}

// 블로그 설정 불러오기
export async function fetchSettings(): Promise<BlogSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();

  if (error || !data) {
    // 기본값 반환
    return {
      blogTitle: '파이의 웹툰 리뷰',
    };
  }

  return {
    blogTitle: data.blog_title,
  };
}

// 블로그 설정 업데이트
export async function updateSettings(settings: BlogSettings): Promise<boolean> {
  // settings 테이블에 데이터가 있는지 확인
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .single();

  if (existing) {
    // 업데이트
    const { error } = await supabase
      .from('settings')
      .update({
        blog_title: settings.blogTitle,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  } else {
    // 삽입
    const { error } = await supabase
      .from('settings')
      .insert({
        blog_title: settings.blogTitle,
      });

    if (error) {
      console.error('Failed to insert settings:', error);
      return false;
    }
  }

  return true;
}

// 사용자 닉네임 조회 (users 테이블)
export async function fetchUserNickname(email: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('nickname')
    .eq('email', email)
    .single();

  if (error || !data) {
    // 기본 닉네임: 이메일 @ 앞부분
    return email.split('@')[0];
  }

  return data.nickname;
}

// 사용자 닉네임 업데이트 (없으면 생성)
export async function updateUserNickname(email: string, nickname: string): Promise<boolean> {
  // 기존 사용자 확인
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();

  if (existing) {
    // 업데이트
    const { error } = await supabase
      .from('users')
      .update({ nickname })
      .eq('email', email);

    if (error) {
      console.error('Failed to update user nickname:', error);
      return false;
    }
  } else {
    // 삽입 (새 사용자)
    const { error } = await supabase
      .from('users')
      .insert({ email, nickname });

    if (error) {
      console.error('Failed to insert user:', error);
      return false;
    }
  }

  return true;
}
