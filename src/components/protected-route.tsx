import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.email !== 'dgonzalezuy@hotmail.com') {
    return <Navigate to="/superadmin" replace />;
  }

  return <>{children}</>;
}