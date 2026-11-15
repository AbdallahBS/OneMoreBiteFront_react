import { Link, useNavigate } from 'react-router-dom';
import { FALLBACK_DEAL_IMAGE } from '../data/fallbackDeals';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatDT(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return `${number.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

export default function DealCard({ deal, onReserve, pending = false }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const soldOut = deal.quantite !== null && deal.quantite !== undefined && deal.quantite <= 0;

  const handleAction = (e) => {
    e.stopPropagation();
    if (soldOut) return;
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate('/auth?mode=login');
      return;
    }
    if (onReserve) {
      onReserve(deal);
    } else {
      addItem(deal, 1);
      navigate('/panier');
    }
  };

  const productUrl = `/produits/${deal.id}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group h-full">
      {/* Card Header & Media */}
      <Link to={productUrl} className="relative w-full h-56 overflow-hidden bg-gray-100 block">
        <img
          alt={deal.nom}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_DEAL_IMAGE;
          }}
          src={deal.images?.[0] || deal.imageUrl || deal.photoUrl || FALLBACK_DEAL_IMAGE}
        />

        {/* Discount Badge */}
        {deal.discount ? (
          <span className="absolute top-3 left-3 bg-primary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{deal.discount}%
          </span>
        ) : null}

        {/* Pickup Time Window */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-green-400">schedule</span>
          <span>Retrait: {deal.pickup || '18h30 - 20h00'}</span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Merchant & Stock Row */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-[12px] font-bold text-secondary flex items-center gap-1 truncate">
            <span className="material-symbols-outlined text-[14px] shrink-0">store</span>
            <span className="truncate">{deal.merchantName}</span>
          </span>
          {deal.quantite !== null && deal.quantite !== undefined && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                deal.quantite <= 2
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {deal.quantite <= 0
                ? 'Épuisé'
                : deal.quantite <= 2
                ? `Plus que ${deal.quantite} !`
                : `Reste ${deal.quantite} paniers`}
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={productUrl}>
          <h3 className="text-[17px] font-bold text-[#231F20] mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {deal.nom}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-[13px] text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
          {deal.description}
        </p>

        {/* Bottom Pricing & Reserve CTA */}
        <div className="mt-auto pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
          <div className="flex flex-col">
            {deal.prixOriginal ? (
              <span className="text-[12px] text-gray-400 line-through leading-tight">
                {formatDT(deal.prixOriginal)}
              </span>
            ) : null}
            <span className="text-[19px] font-extrabold text-primary leading-tight">
              {formatDT(deal.prix)}
            </span>
          </div>

          <button
            onClick={handleAction}
            disabled={pending || soldOut}
            type="button"
            className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-xs hover:shadow transition-all active:scale-95"
          >
            {pending ? 'En cours…' : soldOut ? 'Épuisé' : 'Réserver'}
          </button>
        </div>
      </div>
    </div>
  );
}
