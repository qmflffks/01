import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { NewReviewForm } from './components/NewReviewForm';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import type { Review, Comment } from './types';
import {
  fetchPublicReviews,
  getAdminReviews,
  addReview as saveReview,
  deleteReview as removeReview,
  addComment as saveComment,
  deleteComment as removeComment,
  exportReviewsToJson,
} from './utils/storage';

function AppContent() {
  const { isAdmin } = useAdmin();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      if (isAdmin) {
        // 관리자: localStorage에서 로드
        const adminReviews = getAdminReviews();
        if (adminReviews.length > 0) {
          setReviews(adminReviews);
        } else {
          // localStorage가 비어있으면 public에서 로드
          const publicReviews = await fetchPublicReviews();
          setReviews(publicReviews);
        }
      } else {
        // 일반 방문자: public JSON에서 로드
        const publicReviews = await fetchPublicReviews();
        setReviews(publicReviews);
      }
      setLoading(false);
    }
    loadReviews();
  }, [isAdmin]);

  const handleAddReview = (review: Review) => {
    const updated = saveReview(review, reviews);
    setReviews(updated);
    setShowNewReviewForm(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
      const updated = removeReview(reviewId, reviews);
      setReviews(updated);
    }
  };

  const handleAddComment = (reviewId: string, comment: Comment) => {
    const updated = saveComment(reviewId, comment, reviews);
    setReviews(updated);
  };

  const handleDeleteComment = (reviewId: string, commentId: string) => {
    const updated = removeComment(reviewId, commentId, reviews);
    setReviews(updated);
  };

  const handleExport = () => {
    exportReviewsToJson(reviews);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 관리자 전용: 새 리뷰 작성 및 내보내기 */}
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
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setShowNewReviewForm(true)}
                  className="flex-1 p-4 card hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">새 리뷰 작성</span>
                </button>
                <button
                  onClick={handleExport}
                  className="p-4 card hover:shadow-lg transition-shadow text-gray-600 dark:text-gray-300 hover:text-green-500"
                  title="리뷰 데이터 내보내기"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
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
          <p>파이의 웹툰 리뷰 블로그</p>
          <p className="mt-1">캡쳐 이미지에는 자동으로 노이즈와 워터마크가 적용됩니다.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}

export default App;
