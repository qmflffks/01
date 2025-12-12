import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const { settings, loading, updateSettings } = useSettings();
  const [blogTitle, setBlogTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setBlogTitle(settings.blog_title);
      setNickname(settings.nickname);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!blogTitle.trim() || !nickname.trim()) {
      setMessage({ type: 'error', text: '블로그 제목과 닉네임을 입력해주세요.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const result = await updateSettings({
      blog_title: blogTitle.trim(),
      nickname: nickname.trim(),
    });

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: '설정이 저장되었습니다.' });
      setTimeout(() => {
        onClose();
      }, 1000);
    }

    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            블로그 설정
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 블로그 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              블로그 제목
            </label>
            <input
              type="text"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="블로그 제목을 입력하세요"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              헤더와 푸터에 표시됩니다
            </p>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              리뷰 작성자와 워터마크에 표시됩니다
            </p>
          </div>

          {/* 미리보기 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              미리보기
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">
                  {nickname.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  @{nickname || '닉네임'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {blogTitle || '블로그 제목'}
                </p>
              </div>
            </div>
          </div>

          {/* 메시지 */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
