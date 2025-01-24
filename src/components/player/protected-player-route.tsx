import { Navigate } from 'react-router-dom';

interface ProtectedPlayerRouteProps {
  children: React.ReactNode;
}

export function ProtectedPlayerRoute({ children }: ProtectedPlayerRouteProps) {
  const playerId = sessionStorage.getItem('playerId');

  if (!playerId) {
    return <Navigate to="/player" replace />;
  }

  return <>{children}</>;
}