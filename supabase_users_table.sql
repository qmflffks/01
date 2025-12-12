-- users 테이블 생성 (사용자별 닉네임 저장)
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 관리자 사용자 추가 (이미 있으면 무시)
INSERT INTO users (email, nickname)
VALUES ('zuika1508@gmail.com', '파이')
ON CONFLICT (email) DO NOTHING;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Row Level Security (RLS) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 users 테이블 읽기 가능
CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);

-- 자기 자신의 닉네임만 업데이트 가능 (추후 확장용)
CREATE POLICY "Users can update their own nickname"
  ON users FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- 새 사용자 추가 가능
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);
