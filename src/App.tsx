import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ReviewCard } from './components/ReviewCard';
import { NewReviewForm } from './components/NewReviewForm';
import { Settings } from './components/Settings';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ReaderProvider } from './contexts/ReaderContext';
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
  const { user } = useAdmin();
  const { blogTitle } = useSettings();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefillWebtoonTitle, setPrefillWebtoonTitle] = useState<string | undefined>();
  const [prefillEpisode, setPrefillEpisode] = useState<string | undefined>();
  const [parentReviewId, setParentReviewId] = useState<string | undefined>();
  const [expandedCounts, setExpandedCounts] = useState<Map<string, number>>(new Map()); // threadId -> 표시할 중간 리뷰 개수
  const [displayCount, setDisplayCount] = useState(10); // 표시할 스레드 개수
  const [searchQuery, setSearchQuery] = useState(''); // 검색어

  // 브라우저 제목을 블로그 제목으로 업데이트
  useEffect(() => {
    if (blogTitle) {
      document.title = blogTitle;
    }
  }, [blogTitle]);

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

    // 커스텀 이벤트 리스너 추가 (버튼 클릭 등으로 인한 경로 변경)
    const handleRouteChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.path) {
        setCurrentPath(customEvent.detail.path);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePathChange);
    window.addEventListener('route-change', handleRouteChange);

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
      window.removeEventListener('route-change', handleRouteChange);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // 설정 페이지 라우팅
  if (relativePath === '/settings') {
    return (
      <>
        <Header />
        {user ? (
          <Settings />
        ) : (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">로그인이 필요합니다.</p>
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

    // 3개 이상의 리뷰를 가진 스레드를 자동으로 접힌 상태로 설정
    const threads = groupReviewsByThread(data);
    const newExpandedCounts = new Map<string, number>();
    threads.forEach((thread) => {
      if (thread.length > 2) {
        newExpandedCounts.set(thread[0].id, 0); // 0 = 완전히 접힌 상태
      }
    });
    setExpandedCounts(newExpandedCounts);

    // 리뷰 로드 시 표시 개수 초기화
    setDisplayCount(10);

    setLoading(false);
  }, []);

  // 검색어로 리뷰 필터링
  const filterReviewsBySearch = (reviews: Review[]): Review[] => {
    if (!searchQuery.trim()) return reviews;

    const query = searchQuery.toLowerCase();
    return reviews.filter((review) => {
      // 웹툰 제목 검색
      if (review.webtoonTitle.toLowerCase().includes(query)) return true;

      // 에피소드 검색
      if (review.episode && review.episode.toLowerCase().includes(query)) return true;

      // 작성자 닉네임 검색
      if (review.authorNickname.toLowerCase().includes(query)) return true;

      // 댓글 텍스트 검색
      if (review.comments.some((comment) => comment.text.toLowerCase().includes(query))) return true;

      // 댓글 작성자 검색
      if (review.comments.some((comment) => comment.authorNickname.toLowerCase().includes(query))) return true;

      return false;
    });
  };

  // 리뷰를 스레드별로 그룹화하는 함수 (다단계 스레드 지원)
  const groupReviewsByThread = (reviews: Review[]): Review[][] => {
    const threads: Review[][] = [];
    const processedIds = new Set<string>();

    // 특정 리뷰의 모든 자손을 재귀적으로 찾는 함수
    const collectDescendants = (parentId: string, allReviews: Review[]): Review[] => {
      const directChildren = allReviews.filter((r) => r.parentReviewId === parentId);
      directChildren.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const descendants: Review[] = [];
      directChildren.forEach((child) => {
        descendants.push(child);
        // 재귀적으로 자식의 자식들도 수집
        descendants.push(...collectDescendants(child.id, allReviews));
      });

      return descendants;
    };

    reviews.forEach((review) => {
      // 이미 처리된 리뷰는 건너뛰기
      if (processedIds.has(review.id)) return;

      // 부모 리뷰가 아닌 경우 건너뛰기 (나중에 부모와 함께 처리됨)
      if (review.parentReviewId) return;

      // 스레드 시작 (루트 리뷰)
      const thread: Review[] = [review];
      processedIds.add(review.id);

      // 모든 자손 리뷰들 재귀적으로 찾기
      const descendants = collectDescendants(review.id, reviews);
      descendants.forEach((descendant) => {
        thread.push(descendant);
        processedIds.add(descendant.id);
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

  const expandThread = (threadId: string, totalMiddleCount: number) => {
    setExpandedCounts((prev) => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(threadId) || 0;
      const newCount = currentCount + 5;

      // 모든 중간 리뷰를 표시하면 Map에서 제거 (완전히 펼침)
      if (newCount >= totalMiddleCount) {
        newMap.delete(threadId);
      } else {
        newMap.set(threadId, newCount);
      }
      return newMap;
    });
  };

  const collapseThread = (threadId: string) => {
    setExpandedCounts((prev) => {
      const newMap = new Map(prev);
      newMap.set(threadId, 0); // 0 = 완전히 접힌 상태
      return newMap;
    });
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
        {/* 새 리뷰 작성 (로그인 필요) */}
        {user && (
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

        {/* 검색 바 */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="웹툰 제목, 에피소드, 작성자, 댓글로 검색..."
                className="w-full px-4 py-3 pl-11 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          <>
            <div className="space-y-6">
              {groupReviewsByThread(filterReviewsBySearch(reviews)).slice(0, displayCount).map((thread) => {
                const threadId = thread[0].id;
                const middleCount = thread.length - 2; // 첫/마지막 제외한 중간 리뷰 개수
                const expandedCount = expandedCounts.get(threadId);
                const isCollapsible = middleCount > 0;
                const isFullyExpanded = expandedCount === undefined;

                // 표시해야 할 중간 리뷰 개수
                const visibleMiddleCount = isFullyExpanded ? middleCount : (expandedCount || 0);
                const remainingCount = middleCount - visibleMiddleCount;

                return (
                  <div key={threadId} className="card overflow-hidden">
                    {thread.map((review, index) => {
                      const isFirst = index === 0;
                      const isLast = index === thread.length - 1;
                      const isMiddle = !isFirst && !isLast;

                      // 중간 리뷰 처리
                      if (isMiddle) {
                        const middleIndex = index - 1; // 중간 리뷰의 인덱스 (0부터 시작)

                        // 표시해야 할 중간 리뷰 범위를 벗어나면 건너뛰기
                        if (middleIndex >= visibleMiddleCount) {
                          // 첫 번째 숨겨진 리뷰 위치에 "더 보기" 버튼 표시
                          if (middleIndex === visibleMiddleCount) {
                            return (
                              <div key={`expand-${review.id}`}>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">이어지는 리뷰</span>
                                </div>
                                <button
                                  onClick={() => expandThread(threadId, middleCount)}
                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    ... {Math.min(5, remainingCount)}개 더 보기 ({remainingCount}개 남음) ...
                                  </span>
                                </button>
                              </div>
                            );
                          }
                          return null;
                        }
                      }

                      return (
                        <div key={review.id}>
                          {index > 0 && (
                            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="text-xs text-gray-500 dark:text-gray-400">이어지는 리뷰</span>
                              </div>
                              {isCollapsible && isFullyExpanded && index === 1 && (
                                <button
                                  onClick={() => collapseThread(threadId)}
                                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                  접기
                                </button>
                              )}
                            </div>
                          )}
                          <ReviewCard
                            review={review}
                            onAddComment={handleAddComment}
                            onDeleteReview={handleDeleteReview}
                            onDeleteComment={handleDeleteComment}
                            onUpdateReview={handleUpdateReview}
                            onUpdateComment={handleUpdateComment}
                            onContinueReview={handleContinueReview}
                            isInThread={thread.length > 1}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* 더 보기 버튼 */}
            {groupReviewsByThread(filterReviewsBySearch(reviews)).length > displayCount && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 10)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  이전 리뷰 더 보기
                </button>
              </div>
            )}

            {/* 검색 결과 없음 */}
            {searchQuery && groupReviewsByThread(filterReviewsBySearch(reviews)).length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  검색 결과가 없어요
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  "{searchQuery}"에 대한 리뷰를 찾을 수 없습니다
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  검색 초기화
                </button>
              </div>
            )}
          </>
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
        <ReaderProvider>
          <AppContent />
        </ReaderProvider>
      </SettingsProvider>
    </AdminProvider>
  );
}

export default App;
