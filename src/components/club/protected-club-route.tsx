import { Navigate } from 'react-router-dom';
import { useClubAuth } from '@/hooks/use-club-auth';

interface ProtectedClubRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedClubRoute({ children, requireAdmin = false }: ProtectedClubRouteProps) {
  const { user, clubId, isAdmin, loading } = useClubAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  // Si no hay usuario o clubId, redirigir al login
  if (!user || !clubId) {
    return <Navigate to="/club" replace />;
  }

  // Si se requiere admin y el usuario no lo es, redirigir al dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/club/dashboard" replace />;
  }

  // Verificar si hay datos del club en sessionStorage
  const storedClubId = sessionStorage.getItem('clubId');
  const storedIsAdmin = sessionStorage.getItem('isAdmin') === 'true';

  if (!storedClubId || storedClubId !== clubId || storedIsAdmin !== isAdmin) {
    // Si no hay datos o no coinciden, actualizar sessionStorage
    sessionStorage.setItem('clubId', clubId);
    sessionStorage.setItem('isAdmin', isAdmin.toString());
  }

  return <>{children}</>;
}