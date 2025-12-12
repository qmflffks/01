import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { NewReviewForm } from './components/NewReviewForm';
import type { Review, Comment } from './types';
import {
  getReviews,
  addReview as saveReview,
  deleteReview as removeReview,
  addComment as saveComment,
  deleteComment as removeComment,
} from './utils/storage';

function App() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  const handleAddReview = (review: Review) => {
    const updated = saveReview(review);
    setReviews(updated);
    setShowNewReviewForm(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
      const updated = removeReview(reviewId);
      setReviews(updated);
    }
  };

  const handleAddComment = (reviewId: string, comment: Comment) => {
    const updated = saveComment(reviewId, comment);
    setReviews(updated);
  };

  const handleDeleteComment = (reviewId: string, commentId: string) => {
    const updated = removeComment(reviewId, commentId);
    setReviews(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 새 리뷰 작성 버튼/폼 */}
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

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
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
              첫 번째 웹툰 리뷰를 작성해보세요!
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

export default App;
