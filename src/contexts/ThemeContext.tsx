import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    if (theme === 'dark') {
      // Dark theme colors - improved contrast
      root.style.setProperty('--color-background', '#111827');
      root.style.setProperty('--color-surface', '#1F2937');
      root.style.setProperty('--color-primary', '#374151');
      root.style.setProperty('--color-secondary', '#4B5563');
      root.style.setProperty('--color-accent', '#6B7280');
      root.style.setProperty('--color-text-primary', '#F9FAFB');
      root.style.setProperty('--color-text-secondary', '#E5E7EB');
    } else {
      // Light theme colors - improved contrast
      root.style.setProperty('--color-background', '#FFFFFF');
      root.style.setProperty('--color-surface', '#F8F9FA');
      root.style.setProperty('--color-primary', '#E5E7EB');
      root.style.setProperty('--color-secondary', '#D1D5DB');
      root.style.setProperty('--color-accent', '#9CA3AF');
      root.style.setProperty('--color-text-primary', '#111827');
      root.style.setProperty('--color-text-secondary', '#374151');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};