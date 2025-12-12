import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import type { Review, Comment } from '../types';
import { generateId } from '../utils/imageProcessor';
import { CommentImageUploader } from './CommentImageUploader';

interface ReviewCardProps {
  review: Review;
  isAdmin: boolean;
  onAddComment: (reviewId: string, comment: Comment) => void;
  onDeleteReview: (reviewId: string) => void;
  onDeleteComment: (reviewId: string, commentId: string) => void;
}

export function ReviewCard({
  review,
  isAdmin,
  onAddComment,
  onDeleteReview,
  onDeleteComment,
}: ReviewCardProps) {
  const { userNickname, user } = useAdmin();
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % review.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + review.imageUrls.length) % review.imageUrls.length);
  };

  const handleAddComment = () => {
    if (!newComment.trim() && !commentImage) return;

    const comment: Comment = {
      id: generateId(),
      text: newComment.trim(),
      imageUrl: commentImage || undefined,
      authorNickname: userNickname || '익명',
      authorEmail: user?.email || '',
      createdAt: new Date(),
      reactions: [],
    };

    onAddComment(review.id, comment);
    setNewComment('');
    setCommentImage(null);
    setShowCommentInput(false);
  };

  const handleImageProcessed = (storageUrl: string) => {
    setCommentImage(storageUrl);
    setShowImageUploader(false);
  };

  const removeCommentImage = () => {
    setCommentImage(null);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <article className="card overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 font-bold">
              {review.authorNickname.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              @{review.authorNickname}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => onDeleteReview(review.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="삭제"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 웹툰 정보 */}
      <div className="px-4 pb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
          📚 {review.webtoonTitle}
          {review.episode && <span className="text-primary-500">EP.{review.episode}</span>}
        </span>
      </div>

      {/* 이미지 캐러셀 */}
      <div className="relative bg-black">
        <img
          src={review.imageUrls[currentImageIndex]}
          alt={`${review.webtoonTitle} 캡쳐 ${currentImageIndex + 1}`}
          className="w-full object-contain"
          style={{ maxHeight: '70vh' }}
        />

        {/* 이미지가 여러 장일 때만 네비게이션 표시 */}
        {review.imageUrls.length > 1 && (
          <>
            {/* 이전 버튼 */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="이전 이미지"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 다음 버튼 */}
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="다음 이미지"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 인디케이터 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {review.imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`이미지 ${index + 1}`}
                />
              ))}
            </div>

            {/* 이미지 카운터 */}
            <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
              {currentImageIndex + 1} / {review.imageUrls.length}
            </div>
          </>
        )}
      </div>

      {/* 댓글 섹션 */}
      <div className="p-4 space-y-3">
        {/* 기존 댓글들 */}
        {review.comments.length > 0 && (
          <div className="space-y-2">
            {review.comments.map((comment) => (
              <div
                key={comment.id}
                className="group flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-lg">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                    @{comment.authorNickname}
                  </p>
                  {comment.text && (
                    <p className="text-gray-800 dark:text-gray-200 break-words mb-2">
                      {comment.text}
                    </p>
                  )}
                  {comment.imageUrl && (
                    <img
                      src={comment.imageUrl}
                      alt="댓글 이미지"
                      className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600 mt-2"
                      style={{ maxHeight: '300px' }}
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onDeleteComment(review.id, comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 관리자 전용: 댓글 입력 */}
        {isAdmin && (
          <>
            {showCommentInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && !commentImage && handleAddComment()}
                  placeholder="리뷰 코멘트를 입력하세요..."
                  className="w-full px-3 py-3 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
                  autoFocus
                />

                {/* 이미지 첨부 */}
                {!showImageUploader && !commentImage && (
                  <button
                    onClick={() => setShowImageUploader(true)}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    📎 이미지 첨부
                  </button>
                )}

                {/* 이미지 미리보기 */}
                {commentImage && (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={commentImage}
                        alt="첨부 이미지"
                        className="max-w-full rounded-lg border border-gray-200 dark:border-gray-600"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                    <button
                      onClick={removeCommentImage}
                      className="px-3 py-2 text-sm text-red-500 hover:text-red-600"
                    >
                      ✕ 이미지 제거
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() && !commentImage}
                    className="flex-1 btn-primary py-2.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    등록
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentInput(false);
                      setNewComment('');
                      setCommentImage(null);
                      setShowImageUploader(false);
                    }}
                    className="btn-secondary py-2.5 sm:py-2"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCommentInput(true)}
                className="w-full py-3 sm:py-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                댓글 추가
              </button>
            )}
          </>
        )}
      </div>

      {/* 이미지 업로더 모달 */}
      {showImageUploader && (
        <CommentImageUploader
          userNickname={userNickname || '익명'}
          onImageProcessed={handleImageProcessed}
          onCancel={() => setShowImageUploader(false)}
        />
      )}
    </article>
  );
}
