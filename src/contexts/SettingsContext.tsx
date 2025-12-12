import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { fetchSettings, updateSettings as updateSettingsAPI } from '../utils/storage';
import type { BlogSettings } from '../types';

interface SettingsContextType {
  blogTitle: string;
  loading: boolean;
  updateSettings: (settings: BlogSettings) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [blogTitle, setBlogTitle] = useState('파이의 웹툰 리뷰');
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    const settings = await fetchSettings();
    setBlogTitle(settings.blogTitle);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (settings: BlogSettings): Promise<boolean> => {
    const success = await updateSettingsAPI(settings);
    if (success) {
      setBlogTitle(settings.blogTitle);
    }
    return success;
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider value={{ blogTitle, loading, updateSettings, refreshSettings }}>
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
