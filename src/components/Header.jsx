import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { dashboardPath, roleLabel } from '../lib/roles';
import Brand from './Brand';

const NAV_LINKS = [
  { label: 'Accueil', to: '/' },
  { label: 'Produits', to: '/#produits' },
  { label: 'Commerçants', to: '/#commercants' },
  { label: 'À propos', to: '/#a-propos' },
  { label: 'Avis', to: '/#avis' },
  { label: 'FAQ', to: '/#faq' },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/#produits');
    } else {
      const el = document.getElementById('produits');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full bg-[#FFF9F1]/95 py-3 px-4 lg:px-8 border-b border-[#F0E6DE]/60 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Brand />

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-semibold text-[#4A4547]">
          {NAV_LINKS.map((link) => {
            const isHome = link.to === '/' && location.pathname === '/' && !location.hash;
            return (
              <Link
                key={link.label}
                to={link.to}
                className={`px-3.5 py-1.5 rounded-full transition-colors ${
                  isHome
                    ? 'bg-primary text-white shadow-xs'
                    : 'hover:text-primary hover:bg-primary-soft/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-[#EFE9E4] hover:bg-[#E9E2DC] transition-colors rounded-full px-3 py-1.5 w-40 lg:w-52 text-[13px] border border-transparent focus-within:border-primary/40 focus-within:bg-white"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un panier..."
              className="bg-transparent border-0 outline-none w-full text-on-surface placeholder:text-gray-400 p-0 text-[12.5px] focus:ring-0"
            />
            <button type="submit" className="text-gray-500 hover:text-primary ml-1 flex items-center">
              <span className="material-symbols-outlined text-[17px]">search</span>
            </button>
          </form>

          {/* Cart Pill - Only visible for authenticated CLIENT */}
          {isAuthenticated && user?.role === 'CLIENT' && (
            <Link
              to="/panier"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-[#b8e2a6] font-semibold text-[13px] transition-all shadow-2xs"
              title="Voir mon panier"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span className="hidden sm:inline font-medium">Mon Panier</span>
              <span className="bg-secondary text-white text-[11px] rounded-full px-1.5 py-0.2 font-bold ml-0.5">
                {itemCount}
              </span>
            </Link>
          )}

          {/* Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPath(user?.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-[13px] font-medium"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user?.nom || 'Profil'} className="w-full h-full object-cover" />
                  ) : (
                    (user?.nom || user?.prenom || 'U').charAt(0)
                  )}
                </div>
                <span className="hidden sm:inline text-on-surface font-semibold max-w-[100px] truncate">
                  {user?.prenom || user?.nom || 'Mon Espace'}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full hidden md:inline">
                  {roleLabel(user?.role)}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="p-1.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                title="Se déconnecter"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth"
                className="text-[13px] font-bold text-primary border border-primary/80 hover:bg-primary/5 px-3.5 sm:px-4 py-1.5 rounded-full transition-all"
              >
                Se connecter
              </Link>
              <Link
                to="/auth?mode=register"
                className="text-[13px] font-bold text-white bg-primary hover:bg-primary-dark px-3.5 sm:px-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all"
              >
                S'inscrire
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
            className="flex lg:hidden p-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-[#F0E6DE] flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={closeMenu}
              className="px-4 py-2 rounded-xl text-[14px] font-semibold text-on-surface hover:bg-primary-soft hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === 'CLIENT' && (
            <Link
              to="/panier"
              onClick={closeMenu}
              className="px-4 py-2 rounded-xl text-[14px] font-semibold text-secondary flex items-center justify-between bg-secondary-container/40"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Mon Panier
              </span>
              <span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {itemCount}
              </span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
