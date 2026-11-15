import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/roles';

export default function RoleRedirect() {
  const { booting, isAuthenticated, user } = useAuth();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  return <Navigate replace to={dashboardPath(user?.role)} />;
}
