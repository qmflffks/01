-- ============================================
-- 이미지 없는 리뷰 작성을 위한 제약조건 제거
-- ============================================

-- 1. image_url 컬럼의 NOT NULL 제약조건 제거
ALTER TABLE reviews
ALTER COLUMN image_url DROP NOT NULL;

-- 2. image_urls 컬럼의 NOT NULL 제약조건 제거 (있다면)
ALTER TABLE reviews
ALTER COLUMN image_urls DROP NOT NULL;

-- ============================================
-- 확인용 쿼리
-- ============================================

-- 컬럼 제약조건 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('image_url', 'image_urls');
