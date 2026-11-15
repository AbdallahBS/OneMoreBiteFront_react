import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../lib/roles';

export default function DashboardShell({ eyebrow, title, description, icon, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden bg-primary-container py-12 text-on-primary">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-tertiary-container/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 lg:grid-cols-12 lg:px-12">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/15 px-4 py-1.5 font-label-sm text-label-sm uppercase tracking-wider backdrop-blur-md">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {eyebrow}
              </span>
              <h1 className="mt-4 font-headline-lg text-headline-lg tracking-tight md:text-display-xl-mobile">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-primary-container">
                {description}
              </p>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-xl bg-surface-container-lowest/10 p-5 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest font-headline-sm text-headline-sm uppercase text-primary">
                    {(user?.nom || '?').trim().charAt(0) || '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-label-lg text-label-lg text-on-primary">
                      {user?.nom || 'Membre'}
                    </p>
                    <p className="truncate font-body-sm text-body-sm text-on-primary/75">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container">
                    {roleLabel(user?.role)}
                  </span>
                  {user?.statut ? (
                    <span className="rounded-full bg-surface-container-lowest/15 px-3 py-1 font-label-sm text-label-sm text-on-primary">
                      Statut : {user.statut}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-surface-container-lowest font-label-md text-label-md text-primary transition-colors hover:bg-surface-bright"
                    to="/#featured-deals"
                  >
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    Découvrir les paniers
                  </Link>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-transparent font-label-md text-label-md text-on-primary transition-colors hover:bg-on-primary/10 disabled:opacity-60"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-12">{children}</section>
      </main>

      <Footer />
    </div>
  );
}
