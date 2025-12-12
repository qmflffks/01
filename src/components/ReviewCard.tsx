import { useState } from 'react';
import type { Review, Comment } from '../types';
import { generateId } from '../utils/imageProcessor';

interface ReviewCardProps {
  review: Review;
  onAddComment: (reviewId: string, comment: Comment) => void;
  onDeleteReview: (reviewId: string) => void;
  onDeleteComment: (reviewId: string, commentId: string) => void;
}

export function ReviewCard({
  review,
  onAddComment,
  onDeleteReview,
  onDeleteComment,
}: ReviewCardProps) {
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: generateId(),
      text: newComment.trim(),
      createdAt: new Date(),
      reactions: [],
    };

    onAddComment(review.id, comment);
    setNewComment('');
    setShowCommentInput(false);
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
            <span className="text-primary-600 dark:text-primary-400 font-bold">파</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">@파이</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDeleteReview(review.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="삭제"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* 웹툰 정보 */}
      <div className="px-4 pb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
          📚 {review.webtoonTitle}
          {review.episode && <span className="text-primary-500">EP.{review.episode}</span>}
        </span>
      </div>

      {/* 이미지 */}
      <div className="relative">
        <img
          src={review.imageUrl}
          alt={`${review.webtoonTitle} 캡쳐`}
          className="w-full"
        />
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
                  <p className="text-gray-800 dark:text-gray-200 break-words">
                    {comment.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteComment(review.id, comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 입력 */}
        {showCommentInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="리뷰 코멘트를 입력하세요..."
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              등록
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false);
                setNewComment('');
              }}
              className="btn-secondary"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCommentInput(true)}
            className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            댓글 추가
          </button>
        )}
      </div>
    </article>
  );
}
