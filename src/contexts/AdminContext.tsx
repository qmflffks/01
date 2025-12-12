import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// 관리자 이메일 (이 이메일만 관리자로 인정)
const ADMIN_EMAIL = 'zuika1508@gmail.com';

interface AdminContextType {
  isAdmin: boolean;
  user: User | null;
  userNickname: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  setUserNickname: (nickname: string) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNickname, setUserNicknameState] = useState<string>('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 사용자 닉네임 localStorage에서 불러오기
  useEffect(() => {
    if (user?.email) {
      const savedNickname = localStorage.getItem(`nickname_${user.email}`);
      if (savedNickname) {
        setUserNicknameState(savedNickname);
      } else {
        // 기본 닉네임 설정 (이메일에서 @ 앞부분)
        const defaultNickname = user.email.split('@')[0];
        setUserNicknameState(defaultNickname);
      }
    } else {
      setUserNicknameState('');
    }
  }, [user]);

  const setUserNickname = (nickname: string) => {
    if (user?.email) {
      localStorage.setItem(`nickname_${user.email}`, nickname);
      setUserNicknameState(nickname);
    }
  };

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AdminContext.Provider value={{ isAdmin, user, userNickname, loading, login, logout, setUserNickname }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
