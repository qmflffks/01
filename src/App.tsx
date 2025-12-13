import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { NewReviewForm } from './components/NewReviewForm';
import { Settings } from './components/Settings';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import type { Review, Comment } from './types';
import {
  fetchReviews,
  addReview,
  deleteReview,
  addComment,
  deleteComment,
  updateReview,
  updateComment,
} from './utils/storage';

function AppContent() {
  const { isAdmin } = useAdmin();
  const { blogTitle } = useSettings();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefillWebtoonTitle, setPrefillWebtoonTitle] = useState<string | undefined>();
  const [prefillEpisode, setPrefillEpisode] = useState<string | undefined>();
  const [parentReviewId, setParentReviewId] = useState<string | undefined>();

  // base path 제거한 실제 경로 계산
  const getRelativePath = (pathname: string) => {
    const base = '/01/'; // vite.config.ts의 base와 동일
    if (pathname.startsWith(base)) {
      return pathname.slice(base.length - 1); // '/01/' -> '/', '/01/settings' -> '/settings'
    }
    return pathname;
  };

  const relativePath = getRelativePath(currentPath);

  // URL 변경 감지
  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);

    // 링크 클릭 감지
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && link.href.startsWith(window.location.origin)) {
        // 외부 링크나 다운로드 링크가 아닌 경우에만 처리
        if (!link.target && !link.download) {
          e.preventDefault();
          const url = new URL(link.href);
          const path = url.pathname;
          window.history.pushState({}, '', path);
          setCurrentPath(path);
          window.scrollTo(0, 0); // 페이지 상단으로 스크롤
        }
      }
    };

    document.addEventListener('click', handleClick, true); // capture phase에서 처리

    return () => {
      window.removeEventListener('popstate', handlePathChange);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // 설정 페이지 라우팅
  if (relativePath === '/settings') {
    return (
      <>
        <Header />
        {isAdmin ? (
          <Settings />
        ) : (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">접근 권한이 없습니다.</p>
              <a href="./" className="text-primary-500 hover:text-primary-600 mt-4 inline-block">
                홈으로 돌아가기
              </a>
            </div>
          </div>
        )}
      </>
    );
  }

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const data = await fetchReviews();
    setReviews(data);
    setLoading(false);
  }, []);

  // 리뷰를 스레드별로 그룹화하는 함수
  const groupReviewsByThread = (reviews: Review[]): Review[][] => {
    const threads: Review[][] = [];
    const processedIds = new Set<string>();

    reviews.forEach((review) => {
      // 이미 처리된 리뷰는 건너뛰기
      if (processedIds.has(review.id)) return;

      // 부모 리뷰가 아닌 경우 건너뛰기 (나중에 부모와 함께 처리됨)
      if (review.parentReviewId) return;

      // 스레드 시작 (부모 리뷰)
      const thread: Review[] = [review];
      processedIds.add(review.id);

      // 이 리뷰를 부모로 하는 자식 리뷰들 찾기
      const children = reviews.filter((r) => r.parentReviewId === review.id);
      children.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      children.forEach((child) => {
        thread.push(child);
        processedIds.add(child.id);
      });

      threads.push(thread);
    });

    // 스레드를 최신 활동 기준으로 정렬 (스레드의 마지막 리뷰 시간)
    threads.sort((a, b) => {
      const lastA = a[a.length - 1].createdAt.getTime();
      const lastB = b[b.length - 1].createdAt.getTime();
      return lastB - lastA;
    });

    return threads;
  };

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  const handleUpdateReview = async (reviewId: string, webtoonTitle: string, episode?: string) => {
    const success = await updateReview(reviewId, webtoonTitle, episode);
    if (success) {
      await loadReviews();
    } else {
      alert('리뷰 수정에 실패했습니다.');
    }
  };

  const handleUpdateComment = async (_reviewId: string, commentId: string, text: string) => {
    const success = await updateComment(commentId, text);
    if (success) {
      await loadReviews();
    } else {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleContinueReview = (reviewId: string, webtoonTitle: string, nextEpisode?: string) => {
    setParentReviewId(reviewId);
    setPrefillWebtoonTitle(webtoonTitle);
    setPrefillEpisode(nextEpisode);
    setShowNewReviewForm(true);
    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelNewReview = () => {
    setShowNewReviewForm(false);
    setPrefillWebtoonTitle(undefined);
    setPrefillEpisode(undefined);
    setParentReviewId(undefined);
  };

  const handleSubmitNewReview = async (review: Review) => {
    // parentReviewId를 리뷰에 추가
    const reviewWithParent = { ...review, parentReviewId };
    const success = await addReview(reviewWithParent);
    if (success) {
      await loadReviews();
      setShowNewReviewForm(false);
      setPrefillWebtoonTitle(undefined);
      setPrefillEpisode(undefined);
      setParentReviewId(undefined);
    } else {
      alert('리뷰 등록에 실패했습니다.');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 관리자 전용: 새 리뷰 작성 */}
        {isAdmin && (
          <>
            {showNewReviewForm ? (
              <div className="mb-6">
                <NewReviewForm
                  onSubmit={handleSubmitNewReview}
                  onCancel={handleCancelNewReview}
                  prefillWebtoonTitle={prefillWebtoonTitle}
                  prefillEpisode={prefillEpisode}
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
            {groupReviewsByThread(reviews).map((thread) => (
              <div key={thread[0].id} className="space-y-3">
                {thread.map((review, index) => (
                  <div
                    key={review.id}
                    className={index > 0 ? 'ml-4 border-l-2 border-primary-300 dark:border-primary-700 pl-4' : ''}
                  >
                    <ReviewCard
                      review={review}
                      isAdmin={isAdmin}
                      onAddComment={handleAddComment}
                      onDeleteReview={handleDeleteReview}
                      onDeleteComment={handleDeleteComment}
                      onUpdateReview={handleUpdateReview}
                      onUpdateComment={handleUpdateComment}
                      onContinueReview={handleContinueReview}
                    />
                  </div>
                ))}
              </div>
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
          <p>{blogTitle}</p>
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
