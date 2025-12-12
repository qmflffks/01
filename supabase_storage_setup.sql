-- Supabase Storage 설정: images 버킷 생성 및 정책 설정

-- 1. images 버킷 생성 (public 버킷)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 버킷 정책: 모든 사용자가 이미지 업로드 가능
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- 3. 버킷 정책: 모든 사용자가 이미지 읽기 가능
CREATE POLICY "Anyone can read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- 4. 버킷 정책: 자기가 업로드한 이미지만 삭제 가능 (추후 확장용)
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.uid() = owner);

-- 5. 버킷 정책: 자기가 업로드한 이미지만 업데이트 가능 (추후 확장용)
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND auth.uid() = owner);
