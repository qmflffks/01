import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { fetchSettings, updateSettings as updateSettingsAPI } from '../utils/storage';
import type { Settings } from '../types';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSettings: (blogTitle: string, nickname: string) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await fetchSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (blogTitle: string, nickname: string): Promise<boolean> => {
    const success = await updateSettingsAPI(blogTitle, nickname);
    if (success) {
      // 업데이트 후 새로고침
      await loadSettings();
    }
    return success;
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
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
