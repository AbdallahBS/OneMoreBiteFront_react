import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/roles';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
        <p className="font-label-lg text-label-lg text-on-surface-variant">
          Vérification de votre session…
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate replace to={`/auth?next=${next}`} />;
  }

  if (role && user?.role !== role) {
    return <Navigate replace to={dashboardPath(user?.role)} />;
  }

  return children;
}
