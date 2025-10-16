import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // ADD THIS
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ADD THIS: Redirect non-admin users trying to access admin pages
  if (adminOnly && !isAdmin) {
    return <Navigate to="/documind" replace />;
  }

  return <>{children}</>;
}