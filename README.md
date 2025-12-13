# 파이의 웹툰 리뷰 블로그

React + TypeScript + Vite + Supabase로 만든 SNS 스타일의 웹툰 리뷰 블로그입니다.

## 주요 기능

- 📸 이미지 업로드 (자르기 선택 가능)
- 🔒 자동 워터마크 + 노이즈 추가 (저작권 보호)
- 💬 리뷰 작성 및 댓글 기능
- ⚙️ 관리자 설정 페이지 (블로그 제목, 닉네임 변경)
- 👤 다중 사용자 닉네임 관리 (Supabase users 테이블)
- 📱 모바일 친화적 UI
- 🌙 다크모드 지원

## Supabase 설정

### 1. 환경변수 설정

`.env` 파일을 생성하고 Supabase 정보를 입력하세요:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 파일들을 실행하세요:

1. **users 테이블**: `supabase_users_table.sql` 실행
2. **reviews, comments, settings 테이블**: 기존 마이그레이션 파일 실행

### 3. Storage 설정 (중요!)

**이미지 업로드를 위해 반드시 필요합니다.**

Supabase SQL Editor에서 `supabase_storage_setup.sql` 파일을 실행하세요.

이 파일은 다음을 설정합니다:
- `images` 버킷 생성 (public 버킷)
- 모든 사용자가 이미지 업로드 가능
- 모든 사용자가 이미지 읽기 가능

또는 Supabase Dashboard에서 수동 설정:
1. Storage → Create bucket
2. Bucket name: `images`
3. Public bucket: **체크 ✓**

### 4. 관리자 설정

`src/contexts/AdminContext.tsx` 파일에서 관리자 이메일을 변경하세요:

```typescript
const ADMIN_EMAIL = 'your-email@example.com'; // 여기를 수정
```

## 개발 환경 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## GitHub Pages 배포

이 프로젝트는 GitHub Pages 배포를 위해 구성되어 있습니다.

- Base path: `/01/`
- SPA 라우팅 지원 (404.html 리다이렉트)
- 자동 배포 워크플로우 포함

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
