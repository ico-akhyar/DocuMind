import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // CHANGE: Rename prop to moderatorOnly
  moderatorOnly?: boolean;
}

export default function ProtectedRoute({ children, moderatorOnly = false }: ProtectedRouteProps) {
  // CHANGE: Destructure isModerator from useAuth
  const { currentUser, isModerator } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // CHANGE: Check for moderator access instead of admin
  if (moderatorOnly && !isModerator) {
    return <Navigate to="/documind" replace />;
  }

  return <>{children}</>;
}
