-- ============================================
-- 리뷰 및 댓글 수정 기능을 위한 RLS 정책
-- ============================================

-- 1. 리뷰 수정 정책 추가
-- 관리자(인증된 사용자)가 자신의 리뷰를 수정할 수 있도록 허용
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.email() = author_email)
WITH CHECK (auth.email() = author_email);

-- 2. 댓글 수정 정책 추가
-- 관리자(인증된 사용자)가 자신의 댓글을 수정할 수 있도록 허용
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.email() = author_email)
WITH CHECK (auth.email() = author_email);

-- ============================================
-- 정책 확인용 쿼리 (실행 후 확인)
-- ============================================

-- reviews 테이블의 모든 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reviews';

-- comments 테이블의 모든 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'comments';
