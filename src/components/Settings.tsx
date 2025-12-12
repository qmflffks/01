import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '../utils/storage';
import type { BlogSettings } from '../types';

export function Settings() {
  const [settings, setSettings] = useState<BlogSettings>({
    blogTitle: '파이의 웹툰 리뷰',
    nickname: '파이',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await fetchSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const success = await updateSettings(settings);

    if (success) {
      setMessage('설정이 저장되었습니다! 변경사항이 적용되려면 페이지를 새로고침해주세요.');
    } else {
      setMessage('설정 저장에 실패했습니다.');
    }

    setSaving(false);

    // 3초 후 메시지 제거
    setTimeout(() => setMessage(''), 3000);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            블로그 설정
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            블로그 제목과 닉네임을 설정할 수 있습니다.
          </p>
        </div>

        <div className="card space-y-6">
          {/* 블로그 제목 */}
          <div>
            <label
              htmlFor="blogTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              블로그 제목
            </label>
            <input
              type="text"
              id="blogTitle"
              value={settings.blogTitle}
              onChange={(e) => setSettings({ ...settings, blogTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="예: 파이의 웹툰 리뷰"
            />
          </div>

          {/* 닉네임 */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={settings.nickname}
              onChange={(e) => setSettings({ ...settings, nickname: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="예: 파이"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              이 닉네임은 워터마크에 표시됩니다.
            </p>
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center gap-4">
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
        </div>

        {/* 뒤로가기 */}
        <div className="mt-6">
          <a
            href="/"
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
