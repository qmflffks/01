import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ReaderContextType {
  readerMode: boolean;
  fontSize: number;
  toggleReaderMode: () => void;
  setFontSize: (size: number) => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [readerMode, setReaderMode] = useState(() => {
    const saved = localStorage.getItem('readerMode');
    return saved === 'true';
  });

  const [fontSize, setFontSizeState] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved) : 14; // 기본 14px
  });

  useEffect(() => {
    localStorage.setItem('readerMode', String(readerMode));
  }, [readerMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', String(fontSize));
  }, [fontSize]);

  const toggleReaderMode = () => {
    setReaderMode((prev) => !prev);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
  };

  return (
    <ReaderContext.Provider value={{ readerMode, fontSize, toggleReaderMode, setFontSize }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within ReaderProvider');
  }
  return context;
}
