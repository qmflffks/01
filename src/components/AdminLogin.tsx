import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';

export function AdminLogin() {
  const { isAdmin, user, loading, login, logout } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    const result = await login(email, password);

    if (result.error) {
      setError('로그인 실패: 이메일 또는 비밀번호를 확인해주세요');
    } else {
      setShowModal(false);
      setEmail('');
      setPassword('');
    }

    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="text-xs px-2 py-1 text-gray-400">
        ...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
            관리자
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        관리자
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              관리자 로그인
            </h3>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="이메일"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
                autoFocus
              />

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
                className="btn-secondary"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
