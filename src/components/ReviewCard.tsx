import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useReader } from '../contexts/ReaderContext';
import type { Review, Comment } from '../types';
import { generateId } from '../utils/imageProcessor';
import { CommentImageUploader } from './CommentImageUploader';

interface ReviewCardProps {
  review: Review;
  onAddComment: (reviewId: string, comment: Comment) => void;
  onDeleteReview: (reviewId: string) => void;
  onDeleteComment: (reviewId: string, commentId: string) => void;
  onUpdateReview: (reviewId: string, webtoonTitle: string, episode?: string) => void;
  onUpdateComment: (reviewId: string, commentId: string, text: string) => void;
  onContinueReview: (reviewId: string, webtoonTitle: string, nextEpisode?: string) => void;
  isInThread?: boolean; // 스레드 내부 리뷰인지 여부
}

export function ReviewCard({
  review,
  onAddComment,
  onDeleteReview,
  onDeleteComment,
  onUpdateReview,
  onUpdateComment,
  onContinueReview,
  isInThread = false,
}: ReviewCardProps) {
  const { userNickname, user, isAdmin } = useAdmin();
  const { readerMode, fontSize } = useReader();
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentImages, setCommentImages] = useState<string[]>([]); // 댓글 이미지 (최대 2개)
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false); // Reader Mode 이미지 로딩 상태
  const [commentImagesLoaded, setCommentImagesLoaded] = useState<Set<string>>(new Set()); // 댓글 이미지 로딩 상태

  // 현재 사용자가 리뷰 작성자인지 확인
  const isReviewAuthor = user?.email === review.authorEmail;
  // 현재 사용자가 관리자이거나 리뷰 작성자인 경우 수정/삭제 가능
  const canEditReview = isAdmin || isReviewAuthor;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % review.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + review.imageUrls.length) % review.imageUrls.length);
  };

  // 리뷰 수정 상태
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editWebtoonTitle, setEditWebtoonTitle] = useState(review.webtoonTitle);
  const [editEpisode, setEditEpisode] = useState(review.episode || '');

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // 스포일러 표시 상태
  const [showSpoiler, setShowSpoiler] = useState(false);

  const handleAddComment = () => {
    if (!newComment.trim() && commentImages.length === 0) return;

    const comment: Comment = {
      id: generateId(),
      text: newComment.trim(),
      imageUrls: commentImages.length > 0 ? commentImages : undefined,
      authorNickname: userNickname || '익명',
      authorEmail: user?.email || '',
      createdAt: new Date(),
      reactions: [],
    };

    onAddComment(review.id, comment);
    setNewComment('');
    setCommentImages([]);
    setShowCommentInput(false);
  };

  const handleUpdateReview = () => {
    if (!editWebtoonTitle.trim()) return;
    onUpdateReview(review.id, editWebtoonTitle.trim(), editEpisode.trim() || undefined);
    setIsEditingReview(false);
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editCommentText.trim()) return;
    onUpdateComment(review.id, commentId, editCommentText.trim());
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleImagesProcessed = (storageUrls: string[]) => {
    setCommentImages(storageUrls);
    setShowImageUploader(false);
  };

  const loadCommentImage = (commentId: string) => {
    setCommentImagesLoaded((prev) => new Set(prev).add(commentId));
  };

  const handleContinueReview = () => {
    // 에피소드 번호를 추출하고 +1
    let nextEpisode: string | undefined;
    if (review.episode) {
      const episodeNum = parseInt(review.episode);
      if (!isNaN(episodeNum)) {
        nextEpisode = String(episodeNum + 1);
      }
    }
    onContinueReview(review.id, review.webtoonTitle, nextEpisode);
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
    <article
      className={`${isInThread ? '' : 'card'} ${
        readerMode ? 'reader-mode-card' : 'overflow-hidden'
      }`}
      style={readerMode ? { fontSize: `${fontSize}px` } : undefined}
    >
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
        {canEditReview && (
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditingReview(!isEditingReview)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="수정"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
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
        )}
      </div>

      {/* 웹툰 정보 */}
      <div className="px-4 pb-2">
        {isEditingReview ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editWebtoonTitle}
              onChange={(e) => setEditWebtoonTitle(e.target.value)}
              placeholder="웹툰 제목"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="text"
              value={editEpisode}
              onChange={(e) => setEditEpisode(e.target.value)}
              placeholder="에피소드 (선택)"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateReview}
                disabled={!editWebtoonTitle.trim()}
                className="flex-1 btn-primary py-2 disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditingReview(false);
                  setEditWebtoonTitle(review.webtoonTitle);
                  setEditEpisode(review.episode || '');
                }}
                className="btn-secondary py-2"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
            <span className="emoji-hide">📚 </span>{review.webtoonTitle}
            {review.episode && <span className="text-primary-500">EP.{review.episode}</span>}
          </span>
        )}
      </div>

      {/* 스포일러 경고 및 블러 처리 */}
      <div className={review.isSpoiler && !showSpoiler ? 'relative' : ''}>
        {review.isSpoiler && !showSpoiler && (
          <div
            onClick={() => setShowSpoiler(true)}
            className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-md cursor-pointer flex flex-col items-center justify-center gap-3"
          >
            <div className="text-6xl emoji-hide">⚠️</div>
            <div className="text-white text-xl font-bold">스포일러 주의</div>
            <div className="text-gray-300 text-sm">클릭해서 보기</div>
          </div>
        )}

        {/* 이미지 캐러셀 */}
        {review.imageUrls.length > 0 && (
          <div className={`relative bg-black ${review.isSpoiler && !showSpoiler ? 'filter blur-lg' : ''}`}>
            {readerMode && !imagesLoaded ? (
              <button
                onClick={() => setImagesLoaded(true)}
                className="w-full py-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  이미지 {review.imageUrls.length}개 보기
                </span>
              </button>
            ) : (
              <img
                src={review.imageUrls[currentImageIndex]}
                alt={`${review.webtoonTitle} 캡쳐 ${currentImageIndex + 1}`}
                className="w-full object-contain"
                style={{ maxHeight: readerMode ? '40vh' : '70vh' }}
              />
            )}

          {/* 이미지가 여러 장일 때만 네비게이션 표시 */}
          {review.imageUrls.length > 1 && (!readerMode || imagesLoaded) && (
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
        )}

        {/* 댓글 섹션 */}
        <div className={`p-4 space-y-3 ${review.isSpoiler && !showSpoiler ? 'filter blur-lg' : ''}`}>
        {/* 기존 댓글들 */}
        {review.comments.length > 0 && (
          <div className="space-y-2">
            {review.comments.map((comment) => (
              <div
                key={comment.id}
                className="group flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-lg emoji-hide">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                    @{comment.authorNickname}
                  </p>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={!editCommentText.trim()}
                          className="flex-1 btn-primary py-1.5 text-sm disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditComment}
                          className="btn-secondary py-1.5 text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {comment.text && (
                        <p className="text-gray-800 dark:text-gray-200 break-words mb-2 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      )}
                      {comment.imageUrls && comment.imageUrls.length > 0 && (
                        readerMode && !commentImagesLoaded.has(comment.id) ? (
                          <button
                            onClick={() => loadCommentImage(comment.id)}
                            className="mt-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-sm"
                          >
                            <span className="emoji-hide">🖼️ </span>이미지 {comment.imageUrls.length}개 보기
                          </button>
                        ) : (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {comment.imageUrls.map((imageUrl, idx) => (
                              <img
                                key={idx}
                                src={imageUrl}
                                alt={`댓글 이미지 ${idx + 1}`}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-600"
                                style={{ maxHeight: readerMode ? '200px' : '300px', objectFit: 'cover' }}
                              />
                            ))}
                          </div>
                        )
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(comment.createdAt)}
                      </p>
                    </>
                  )}
                </div>
                {(isAdmin || user?.email === comment.authorEmail) && editingCommentId !== comment.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEditComment(comment)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="수정"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteComment(review.id, comment.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 댓글 입력 */}
        {user && (
          <>
            {showCommentInput ? (
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey && !e.nativeEvent.isComposing) {
                      handleAddComment();
                    }
                  }}
                  placeholder="리뷰 코멘트를 입력하세요... (Ctrl+Enter로 등록)"
                  className="w-full px-3 py-3 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none resize-y min-h-[80px]"
                  autoFocus
                />

                {/* 이미지 업로더 */}
                {showImageUploader ? (
                  <CommentImageUploader
                    userNickname={userNickname || '익명'}
                    onImagesProcessed={handleImagesProcessed}
                    onCancel={() => setShowImageUploader(false)}
                  />
                ) : (
                  <>
                    {/* 이미지 미리보기 */}
                    {commentImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {commentImages.map((imageUrl, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={imageUrl}
                              alt={`첨부 이미지 ${idx + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 이미지 첨부 버튼 */}
                    {commentImages.length === 0 && (
                      <button
                        onClick={() => setShowImageUploader(true)}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <span className="emoji-hide">📎 </span>이미지 첨부 (최대 2장)
                      </button>
                    )}

                    {/* 이미지 재선택 버튼 */}
                    {commentImages.length > 0 && (
                      <button
                        onClick={() => setShowImageUploader(true)}
                        className="px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        이미지 다시 선택
                      </button>
                    )}
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() && commentImages.length === 0}
                    className="flex-1 btn-primary py-2.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    등록
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentInput(false);
                      setNewComment('');
                      setCommentImages([]);
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
      </div>

      {/* 이어서 작성 버튼 */}
      {canEditReview && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleContinueReview}
            className="w-full mt-3 py-2.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors rounded-lg border border-primary-200 dark:border-primary-800 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            이어서 작성하기
            {review.episode && <span className="text-gray-400">({review.webtoonTitle} EP.{parseInt(review.episode) + 1})</span>}
          </button>
        </div>
      )}

    </article>
  );
}
