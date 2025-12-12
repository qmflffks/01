import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';

export function AdminLogin() {
  const { isAdmin, login, logout } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (login(password)) {
      setShowModal(false);
      setPassword('');
      setError('');
    } else {
      setError('비밀번호가 틀렸습니다');
    }
  };

  if (isAdmin) {
    return (
      <button
        onClick={logout}
        className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
      >
        관리자 로그아웃
      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              관리자 로그인
            </h3>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호 입력"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none mb-2"
              autoFocus
            />

            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                className="flex-1 btn-primary"
              >
                로그인
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
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
