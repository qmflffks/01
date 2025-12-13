-- ============================================
-- 리뷰 스레드 기능 추가 (트위터 스레드 스타일)
-- ============================================

-- 1. reviews 테이블에 parent_review_id 컬럼 추가
-- reviews.id가 TEXT 타입이므로 parent_review_id도 TEXT로 생성
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS parent_review_id TEXT REFERENCES reviews(id) ON DELETE CASCADE;

-- 2. parent_review_id 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_reviews_parent_review_id ON reviews(parent_review_id);

-- 3. 스레드 순서를 위한 인덱스 (parent_id와 created_at 조합)
CREATE INDEX IF NOT EXISTS idx_reviews_thread ON reviews(parent_review_id, created_at);

-- ============================================
-- 확인용 쿼리
-- ============================================

-- 모든 스레드 확인 (부모 리뷰와 자식 리뷰들)
SELECT
  COALESCE(parent_review_id, 'ROOT') as thread_root,
  id,
  webtoon_title,
  episode,
  created_at
FROM reviews
ORDER BY
  COALESCE(parent_review_id, id),
  created_at ASC;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews' AND column_name = 'parent_review_id';
