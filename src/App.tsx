import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import DocuMind from './pages/DocuMind';
import ApiPage from './pages/ApiPage';
import ProtectedRoute from './components/ProtectedRoute';
// CHANGE: Import the new ModeratorDashboard
import ModeratorDashboard from './pages/ModeratorDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DocuMind />} />
            <Route path="/api" element={<ApiPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/documind"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* CHANGE: Update route, component, and prop for moderator */}
            <Route
              path="/moderator"
              element={
                <ProtectedRoute moderatorOnly={true}>
                  <ModeratorDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
