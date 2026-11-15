import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProduits, createReservation } from '../api/produits';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FALLBACK_DEALS, normalizeBackendDeal } from '../data/fallbackDeals';
import DealCard from './DealCard';
import Toast from './Toast';

export const DEAL_FILTERS = [
  { key: 'all', label: 'Tous les paniers', term: '' },
  { key: 'bakery', label: '🥐 Pâtisseries & Boulangeries', term: 'patisserie' },
  { key: 'meals', label: '🥪 Plats & Street-Food', term: 'kafteji' },
  { key: 'cafes', label: '☕ Cafés & Salons de thé', term: 'cafe' },
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
  const { isAuthenticated, user, token } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [activeCat, setActiveCat] = useState(selectedCategory || 'all');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [toast, setToast] = useState(null);

  const filterTerm = useMemo(() => {
    return DEAL_FILTERS.find((f) => f.key === activeCat)?.term || '';
  }, [activeCat]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError('');

    fetchProduits({ disponible: true, recherche: filterTerm }, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          setDeals(list.map(normalizeBackendDeal));
          setUsingFallback(false);
        } else {
          setDeals([]);
          setUsingFallback(true);
        }
      })
      .catch((requestError) => {
        if (!active || requestError?.name === 'AbortError') return;
        setDeals([]);
        setUsingFallback(true);
        setError(requestError?.message || '');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [filterTerm]);

  const visibleDeals = useMemo(() => {
    if (deals.length > 0) return deals;
    if (activeCat === 'all') return FALLBACK_DEALS;
    return FALLBACK_DEALS.filter((d) => d.category === activeCat);
  }, [deals, activeCat]);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleReserve = async (deal) => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate('/auth?mode=login');
      return;
    }
    addItem(deal, 1);
    setToast({
      message: `« ${deal.nom} » a été ajouté à votre panier !`,
      type: 'success',
    });
    // Navigate to panier after slight delay or let user view toast
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

      {/* Grid of Product Cards */}
      {loading ? (
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
          <p className="text-[15px] font-bold text-on-surface">Aucun panier disponible dans cette catégorie</p>
          <p className="text-[13px] text-on-surface-variant mt-1">Revenez un peu plus tard ou choisissez une autre catégorie.</p>
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
