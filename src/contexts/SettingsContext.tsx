import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Settings {
  id: string;
  blog_title: string;
  nickname: string;
  created_at: string;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (updates: Partial<Pick<Settings, 'blog_title' | 'nickname'>>) => Promise<{ error: string | null }>;
}

const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'created_at'> = {
  blog_title: '파이의 웹툰 리뷰',
  nickname: '파이',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        // 데이터가 없는 경우 기본값 사용
        if (fetchError.code === 'PGRST116') {
          console.log('No settings found, using defaults');
          setSettings(null);
        } else {
          throw fetchError;
        }
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (
    updates: Partial<Pick<Settings, 'blog_title' | 'nickname'>>
  ): Promise<{ error: string | null }> => {
    try {
      if (settings?.id) {
        // 기존 설정 업데이트
        const { data, error: updateError } = await supabase
          .from('settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setSettings(data);
      } else {
        // 새 설정 생성
        const { data, error: insertError } = await supabase
          .from('settings')
          .insert({
            blog_title: updates.blog_title || DEFAULT_SETTINGS.blog_title,
            nickname: updates.nickname || DEFAULT_SETTINGS.nickname,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(data);
      }

      return { error: null };
    } catch (err) {
      console.error('Failed to update settings:', err);
      return { error: '설정 저장에 실패했습니다.' };
    }
  };

  // 설정값 또는 기본값 반환
  const effectiveSettings: Settings | null = settings || {
    id: '',
    blog_title: DEFAULT_SETTINGS.blog_title,
    nickname: DEFAULT_SETTINGS.nickname,
    created_at: '',
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: effectiveSettings,
        loading,
        error,
        refetch: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// 닉네임의 첫 글자 반환 (아바타용)
export function getInitial(nickname: string): string {
  return nickname.charAt(0);
}
