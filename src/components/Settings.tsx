import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useSettings } from '../contexts/SettingsContext';

export function Settings() {
  const { userNickname, setUserNickname, user } = useAdmin();
  const { blogTitle, loading: settingsLoading, updateSettings } = useSettings();
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 설정값 로드 완료 시 초기화
  useEffect(() => {
    if (!settingsLoading && blogTitle) {
      setNewBlogTitle(blogTitle);
    }
  }, [blogTitle, settingsLoading]);

  useEffect(() => {
    setNickname(userNickname);
  }, [userNickname]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    // 블로그 제목 저장
    const blogSuccess = await updateSettings({ blogTitle: newBlogTitle });

    // 개인 닉네임 저장 (Supabase users 테이블)
    await setUserNickname(nickname);

    if (blogSuccess) {
      setMessage('설정이 저장되었습니다!');
    } else {
      setMessage('설정 저장에 실패했습니다.');
    }

    setSaving(false);

    // 3초 후 메시지 제거
    setTimeout(() => setMessage(''), 3000);
  };

  // blogTitle이 로드될 때까지 로딩 표시
  if (settingsLoading || !newBlogTitle) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            블로그 설정
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            블로그 제목과 내 닉네임을 설정할 수 있습니다.
          </p>
        </div>

        {/* 블로그 제목 (전역 설정) */}
        <div className="card space-y-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              블로그 전역 설정
            </h2>
            <label
              htmlFor="blogTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              블로그 제목
            </label>
            <input
              type="text"
              id="blogTitle"
              value={newBlogTitle}
              onChange={(e) => setNewBlogTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="예: 파이의 웹툰 리뷰"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              블로그 헤더와 푸터에 표시됩니다.
            </p>
          </div>
        </div>

        {/* 내 닉네임 (개인 설정) */}
        <div className="card space-y-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              내 개인 설정
            </h2>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              내 닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="예: 파이"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              내가 작성하는 리뷰와 댓글, 그리고 이미지 워터마크에 표시됩니다.
            </p>
            {user?.email && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                현재 로그인: {user.email}
              </p>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장'}
          </button>

          {message && (
            <p
              className={`text-sm ${
                message.includes('실패')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {message}
            </p>
          )}
        </div>

        {/* 뒤로가기 */}
        <div>
          <a
            href="./"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400
              transition-colors text-sm font-medium"
          >
            ← 블로그로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
