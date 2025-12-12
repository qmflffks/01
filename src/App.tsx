import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { NewReviewForm } from './components/NewReviewForm';
import { SettingsPage } from './components/SettingsPage';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import type { Review, Comment } from './types';
import {
  fetchReviews,
  addReview,
  deleteReview,
  addComment,
  deleteComment,
} from './utils/storage';

function AppContent() {
  const { isAdmin } = useAdmin();
  const { settings } = useSettings();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const data = await fetchReviews();
    setReviews(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleAddReview = async (review: Review) => {
    const success = await addReview(review);
    if (success) {
      await loadReviews(); // 새로고침
      setShowNewReviewForm(false);
    } else {
      alert('리뷰 등록에 실패했습니다.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
      const success = await deleteReview(reviewId);
      if (success) {
        await loadReviews();
      } else {
        alert('리뷰 삭제에 실패했습니다.');
      }
    }
  };

  const handleAddComment = async (reviewId: string, comment: Comment) => {
    const success = await addComment(reviewId, comment);
    if (success) {
      await loadReviews();
    } else {
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (_reviewId: string, commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      await loadReviews();
    } else {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  const blogTitle = settings?.blog_title || '파이의 웹툰 리뷰';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onOpenSettings={() => setShowSettings(true)} />

      {/* 설정 페이지 모달 */}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 관리자 전용: 새 리뷰 작성 */}
        {isAdmin && (
          <>
            {showNewReviewForm ? (
              <div className="mb-6">
                <NewReviewForm
                  onSubmit={handleAddReview}
                  onCancel={() => setShowNewReviewForm(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewReviewForm(true)}
                className="w-full mb-6 p-4 card hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">새 리뷰 작성</span>
              </button>
            )}
          </>
        )}

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAdmin={isAdmin}
                onAddComment={handleAddComment}
                onDeleteReview={handleDeleteReview}
                onDeleteComment={handleDeleteComment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              아직 리뷰가 없어요
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {isAdmin ? '첫 번째 웹툰 리뷰를 작성해보세요!' : '곧 리뷰가 올라올 예정이에요!'}
            </p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{blogTitle} 블로그</p>
          <p className="mt-1">캡쳐 이미지에는 자동으로 노이즈와 워터마크가 적용됩니다.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AdminProvider>
  );
}

export default App;
