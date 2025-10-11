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
      // Dark theme colors
      root.style.setProperty('--color-background', '#000000');
      root.style.setProperty('--color-surface', '#1A237E');
      root.style.setProperty('--color-primary', '#191970');
      root.style.setProperty('--color-secondary', '#2E1065');
      root.style.setProperty('--color-accent', '#4C1D95');
      root.style.setProperty('--color-text-primary', '#FFFFFF');
      root.style.setProperty('--color-text-secondary', '#E5E7EB');
    } else {
      // Light theme colors
      root.style.setProperty('--color-background', '#FFFFFF');
      root.style.setProperty('--color-surface', '#F8F9FA');
      root.style.setProperty('--color-primary', '#E3F2FD');
      root.style.setProperty('--color-secondary', '#E9ECEF');
      root.style.setProperty('--color-accent', '#BBDEFB');
      root.style.setProperty('--color-text-primary', '#000000');
      root.style.setProperty('--color-text-secondary', '#4B5563');
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