import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProduits } from '../api/produits';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { normalizeBackendDeal } from '../data/fallbackDeals';
import DealCard from './DealCard';
import Toast from './Toast';

export const DEAL_FILTERS = [
  { key: 'all', label: 'Tous les paniers' },
  { key: 'bakery', label: '🥐 Pâtisseries & Boulangeries' },
  { key: 'meals', label: '🥪 Plats & Street-Food' },
  { key: 'cafes', label: '☕ Cafés & Salons de thé' },
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-[#F0E6DE] shadow-xs">
      <div className="h-56 w-full animate-pulse bg-surface-container" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-container" />
        <div className="h-5 w-full animate-pulse rounded-full bg-surface-container" />
        <div className="h-3 w-full animate-pulse rounded-full bg-surface-container" />
        <div className="mt-4 h-9 w-full animate-pulse rounded-full bg-surface-container" />
      </div>
    </div>
  );
}

export default function FeaturedDeals({ selectedCategory = 'all', onSelectCategory }) {
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [activeCat, setActiveCat] = useState(selectedCategory || 'all');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setActiveCat(selectedCategory || 'all');
  }, [selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError('');

    // The catalogue only comes from the database. No demo/static products are
    // injected when the list is empty or when the API fails.
    fetchProduits({ disponible: true }, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setDeals(list.map(normalizeBackendDeal));
      })
      .catch((requestError) => {
        if (!active || requestError?.name === 'AbortError') return;
        setDeals([]);
        setError(
          requestError?.message ||
            'Impossible de charger les paniers depuis la base de données.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const visibleDeals = useMemo(() => {
    if (activeCat === 'all') return deals;
    return deals.filter((deal) => deal.category === activeCat);
  }, [deals, activeCat]);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleReserve = async (deal) => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate('/auth?mode=login');
      return;
    }
    setPendingId(deal.id);
    addItem(deal, 1);
    setToast({
      message: `« ${deal.nom} » a été ajouté à votre panier !`,
      type: 'success',
    });
    setPendingId(null);
    setTimeout(() => {
      navigate('/panier');
    }, 400);
  };

  const handleCatChange = (catKey) => {
    setActiveCat(catKey);
    if (onSelectCategory) onSelectCategory(catKey);
  };

  return (
    <div className="w-full">
      {/* Categories Filter Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {DEAL_FILTERS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCatChange(cat.key)}
            className={`text-[13px] font-semibold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              activeCat === cat.key
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'bg-[#FAF3EA] hover:bg-[#F2E5D6] text-on-surface'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && !loading ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-[#F0E6DE] p-6 mb-12">
          <span className="material-symbols-outlined text-4xl text-error mb-2">cloud_off</span>
          <p className="text-[15px] font-bold text-on-surface">Catalogue indisponible</p>
          <p className="text-[13px] text-on-surface-variant mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-4 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : visibleDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {visibleDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              pending={pendingId === deal.id}
              onReserve={handleReserve}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#F0E6DE] p-6 mb-12">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">
            production_quantity_limits
          </span>
          <p className="text-[15px] font-bold text-on-surface">
            {deals.length === 0
              ? 'Aucun panier disponible pour le moment'
              : 'Aucun panier dans cette catégorie'}
          </p>
          <p className="text-[13px] text-on-surface-variant mt-1">
            {deals.length === 0
              ? 'Les paniers publiés par vos commerçants apparaîtront ici automatiquement.'
              : 'Choisissez une autre catégorie ou revenez un peu plus tard.'}
          </p>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          onClose={dismissToast}
          type={toast.type}
        />
      )}
    </div>
  );
}
