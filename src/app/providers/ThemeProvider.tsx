import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // 1. Check local storage
    const saved = localStorage.getItem('app-theme-mode');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // 3. Default to light
    return 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const nextMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme-mode', nextMode);
      return nextMode;
    });
  };

  useEffect(() => {
    // Apply a class to the body for any global CSS overrides (optional, but good practice)
    if (mode === 'dark') {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#141414'; // Antd dark layout bg
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#fafafa'; // Antd light layout bg
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
