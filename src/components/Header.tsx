import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="bg-theme-surface border-b border-theme-secondary shadow-lg transition-all duration-500 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-theme-primary hover:bg-theme-accent transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-theme-primary" />
              ) : (
                <Menu className="h-6 w-6 text-theme-primary" />
              )}
            </button>
            
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <img 
                    src="/logo.png" 
                    alt="DocuMind Logo" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling?.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-8 h-8 items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocuMind
                </h1>
                <p className="text-xs text-theme-secondary font-medium tracking-wide">
                  AI Document Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-theme-primary">
                {currentUser?.email}
              </p>
              <p className="text-xs text-theme-secondary font-medium">Active Session</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="relative p-3 rounded-2xl bg-theme-primary hover:bg-theme-accent shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                aria-label="Toggle theme"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-theme-primary transform transition-transform duration-300 group-hover:rotate-12" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-400 transform transition-transform duration-300 group-hover:rotate-45" />
                )}
              </button>

              <button
                onClick={handleLogout}
                className="relative px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group overflow-hidden"
                aria-label="Logout"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 transform transition-transform duration-300 group-hover:-translate-x-1" />
                  <span className="text-sm font-semibold">Logout</span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-theme-primary hover:bg-theme-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-theme-primary" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-theme-secondary py-4 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-4">
              <div className="text-center py-2">
                <p className="text-sm font-semibold text-theme-primary">
                  {currentUser?.email}
                </p>
                <p className="text-xs text-theme-secondary">Active Session</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}