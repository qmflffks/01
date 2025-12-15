import { supabase } from '../lib/supabase';
import type { Review, Comment, BlogSettings } from '../types';

// Supabase Storage에 이미지 업로드
export async function uploadImage(dataUrl: string, fileName: string): Promise<string | null> {
  try {
    // data URL을 Blob으로 변환
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // 파일명 생성 (충돌 방지를 위해 타임스탬프 추가)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExtension = 'jpg'; // JPEG로 통일
    const storagePath = `${timestamp}-${randomString}-${fileName}.${fileExtension}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('images') // 'images' 버킷 사용 (미리 생성되어 있어야 함)
      .upload(storagePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Failed to upload image to storage:', error);
      return null;
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to process image for upload:', error);
    return null;
  }
}

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

      // image_urls가 JSON 배열이면 파싱, 문자열이면 단일 이미지로 처리 (하위 호환성)
      let imageUrls: string[] = [];
      if (review.image_urls) {
        imageUrls = typeof review.image_urls === 'string'
          ? JSON.parse(review.image_urls)
          : review.image_urls;
      } else if (review.image_url) {
        // 기존 단일 이미지 필드 지원 (하위 호환성)
        imageUrls = [review.image_url];
      }

      return {
        id: review.id,
        webtoonTitle: review.webtoon_title,
        episode: review.episode,
        imageUrls,
        authorNickname: review.author_nickname || '익명',
        authorEmail: review.author_email || '',
        createdAt: new Date(review.created_at),
        parentReviewId: review.parent_review_id || undefined,
        isSpoiler: review.is_spoiler || false,
        comments: (comments || []).map((c) => {
          // image_url이 JSON 배열이면 파싱, 문자열이면 단일 이미지로 처리 (하위 호환성)
          let imageUrls: string[] | undefined;
          if (c.image_url) {
            try {
              // JSON 배열인지 확인
              const parsed = JSON.parse(c.image_url);
              imageUrls = Array.isArray(parsed) ? parsed : [c.image_url];
            } catch {
              // JSON이 아니면 단일 이미지
              imageUrls = [c.image_url];
            }
          }

          return {
            id: c.id,
            text: c.text,
            imageUrls,
            authorNickname: c.author_nickname || '익명',
            authorEmail: c.author_email || '',
            createdAt: new Date(c.created_at),
            reactions: [],
          };
        }),
      } as Review;
    })
  );

  return reviewsWithComments;
}

// 리뷰 추가
export async function addReview(review: Review): Promise<boolean> {
  console.log('Adding review with imageUrls:', review.imageUrls);

  const { error } = await supabase.from('reviews').insert({
    id: review.id,
    webtoon_title: review.webtoonTitle,
    episode: review.episode || null,
    image_urls: review.imageUrls.length > 0 ? JSON.stringify(review.imageUrls) : null, // 빈 배열이면 null
    image_url: review.imageUrls[0] || null, // 첫 번째 이미지 (하위 호환성)
    author_nickname: review.authorNickname,
    author_email: review.authorEmail,
    created_at: review.createdAt.toISOString(),
    parent_review_id: review.parentReviewId || null, // 스레드 기능
    is_spoiler: review.isSpoiler || false, // 스포일러 여부
  });

  if (error) {
    console.error('Failed to add review:', error);
    alert(`리뷰 등록 실패: ${error.message}`);
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
    image_url: comment.imageUrls && comment.imageUrls.length > 0 ? JSON.stringify(comment.imageUrls) : null,
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
