-- ============================================
-- 스포일러 기능을 위한 컬럼 추가
-- ============================================

-- 1. reviews 테이블에 is_spoiler 컬럼 추가
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT FALSE;

-- 2. comments 테이블에 is_spoiler 컬럼 추가 (선택사항)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT FALSE;

-- ============================================
-- 확인용 쿼리
-- ============================================

-- 컬럼 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('reviews', 'comments')
AND column_name = 'is_spoiler';
