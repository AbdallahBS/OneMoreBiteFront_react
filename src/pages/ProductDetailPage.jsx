import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FALLBACK_DEALS, normalizeBackendDeal } from '../data/fallbackDeals';
import { fetchProduitById, fetchProduits, fetchPublicAvis, createAvis } from '../api/produits';
import DealCard from '../components/DealCard';

function formatDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 DT';
  return `${num.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [productData, setProductData] = useState(null);

  const fallbackProduct = useMemo(() => {
    if (!id) return FALLBACK_DEALS[0];
    const found = FALLBACK_DEALS.find((d) => d.id === id || String(d.id) === String(id));
    return found || FALLBACK_DEALS[0];
  }, [id]);

  const product = productData || fallbackProduct;

  const [quantity, setQuantity] = useState(1);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  // Reviews state - initialized empty, strictly loaded from server
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review Form state
  const [formRating, setFormRating] = useState(5);
  const [formName, setFormName] = useState(user?.nom || '');
  const [formDate, setFormDate] = useState('today');
  const [formComment, setFormComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Related deals from server
  const [relatedDeals, setRelatedDeals] = useState([]);

  // Load product dynamically from backend
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (id && !isNaN(Number(id))) {
          const res = await fetchProduitById(id);
          if (active && res && res.nom) {
            setProductData(normalizeBackendDeal(res));
            return;
          }
        }
        const all = await fetchProduits({ disponible: true });
        if (active && Array.isArray(all) && all.length > 0) {
          const found = id ? all.find((p) => String(p.id) === String(id)) : all[0];
          if (found) {
            setProductData(normalizeBackendDeal(found));
          }
        }
      } catch (err) {
        // Fallback to static deals gracefully if server is starting
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Load related products dynamically
  useEffect(() => {
    let active = true;
    fetchProduits({ disponible: true })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          const others = data
            .filter((p) => String(p.id) !== String(product.id) && String(p.id) !== String(product.backendId))
            .slice(0, 3)
            .map(normalizeBackendDeal);
          setRelatedDeals(others);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product.id, product.backendId]);

  // Load reviews dynamically from backend
  useEffect(() => {
    let active = true;
    const cid = product?.commercantId;
    if (!cid) {
      setReviewsList([]);
      return;
    }

    setReviewsLoading(true);
    fetchPublicAvis(cid)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.avis || [];
        const formatted = list.map((a) => ({
          id: a.id,
          initials:
            (a.clientNom || 'Client')
              .split(' ')
              .map((s) => s[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'CL',
          bg: 'bg-primary text-white',
          name: a.clientNom || 'Client vérifié',
          location: a.commercantNom ? `Chez ${a.commercantNom}` : 'Tunisie',
          rating: Number(a.note) || 5,
          verified: true,
          text: `« ${a.commentaire || ''} »`,
          time: a.dateAvis
            ? new Date(a.dateAvis).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' })
            : 'Récent',
        }));
        setReviewsList(formatted);
      })
      .catch(() => {
        if (active) setReviewsList([]);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product?.commercantId]);

  // Dynamic image list strictly from product data (no fake static URLs)
  const images = useMemo(() => {
    // Prefer the multi-image array coming from the backend
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    // Fall back to single image fields
    const single = product.photoUrl || product.imageUrl;
    return single ? [single] : [];
  }, [product]);

  useEffect(() => {
    setSelectedThumb(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = (goDirect = false) => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      navigate('/auth?mode=login');
      return;
    }

    addItem(product, quantity);
    if (goDirect) {
      navigate('/panier');
    } else {
      setToastMessage(`🎉 ${quantity} panier(s) ajouté(s) à votre panier avec succès !`);
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!formComment.trim()) return;

    if (!token) {
      setReviewError('Veuillez vous connecter avec votre compte Client pour publier un avis.');
      return;
    }

    const authorName = formName.trim() || user?.nom || 'Client';

    const newRev = {
      id: Date.now(),
      initials:
        authorName
          .split(' ')
          .map((s) => s[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'CL',
      bg: 'bg-primary text-white',
      name: authorName,
      location: product.merchantName ? `Chez ${product.merchantName}` : 'Tunisie',
      rating: formRating,
      verified: true,
      text: `« ${formComment.trim()} »`,
      time: "À l'instant",
    };

    setReviewsList((prev) => [newRev, ...prev]);
    setReviewSuccess(true);
    setFormComment('');
    setTimeout(() => setReviewSuccess(false), 5000);

    try {
      await createAvis(
        {
          commercantId: product?.commercantId || 1,
          note: formRating,
          commentaire: formComment.trim(),
        },
        token
      );
    } catch (err) {
      console.warn('Erreur avis backend:', err);
      setReviewError(err?.message || "Impossible d'enregistrer votre avis sur le serveur.");
    }
  };

  const getRatingLabel = (score) => {
    switch (score) {
      case 1:
        return '1 / 5 - Décevant';
      case 2:
        return '2 / 5 - Passable';
      case 3:
        return '3 / 5 - Correct';
      case 4:
        return '4 / 5 - Très bon';
      case 5:
      default:
        return '5 / 5 - Excellent !';
    }
  };

  // Real review metrics computed strictly from reviewsList
  const totalReviews = reviewsList.length;
  const avgRating =
    totalReviews > 0
      ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
      : null;

  const starDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      const score = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      counts[score] = (counts[score] || 0) + 1;
    });
    return counts;
  }, [reviewsList]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8] font-sans text-on-surface antialiased selection:bg-primary-soft selection:text-primary">
      <Header />

      <main className="w-full flex-1">
        {/* Top Breadcrumb & Status Bar */}
        <section className="w-full bg-surface-container-low py-3 border-b border-[#F0E6DE]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-y-2 text-xs sm:text-sm text-on-surface-variant font-medium">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
              <Link className="hover:text-primary transition-colors" to="/">
                Accueil
              </Link>
              <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
              <Link className="hover:text-primary transition-colors" to="/#produits">
                Produits
              </Link>
              <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
              <span className="text-primary font-bold truncate max-w-[220px] md:max-w-none">
                {product.nom}
              </span>
            </nav>
            <div className="flex items-center gap-2 text-secondary font-semibold">
              <span className="inline-flex items-center gap-1.5 bg-secondary-container px-3 py-0.5 rounded-full text-on-secondary-container text-xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Retrait aujourd'hui disponible
              </span>
            </div>
          </div>
        </section>

        {/* Main Product Showcase Grid */}
        <section className="w-full py-8 lg:py-12">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Gallery & Impact */}
              <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
                {/* Main Hero Image */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container shadow-xs border border-[#F0E6DE] group flex items-center justify-center">
                  {images.length > 0 ? (
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={images[selectedThumb] || images[0]}
                      alt={product.nom}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
                      <span className="material-symbols-outlined text-6xl text-primary/40 mb-2">
                        bakery_dining
                      </span>
                      <span className="text-sm font-bold text-on-surface">{product.nom}</span>
                      <span className="text-xs text-outline mt-1">Photo en cours d'actualisation</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
                    <span className="px-3.5 py-1.5 rounded-full bg-primary text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">savings</span>
                      -{product.discount || 50}% Anti-Gaspi
                    </span>
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">eco</span>
                      Sauvé aujourd'hui
                    </span>
                  </div>

                  {/* Stock urgency alert badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-primary text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-error">alarm</span>
                      {product.quantite ? `${product.quantite} disponibles` : 'Disponible'}
                    </span>
                  </div>
                </div>

                {/* Thumbnails (only shown if multiple images exist) */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedThumb(idx)}
                        className={`aspect-square rounded-xl overflow-hidden bg-surface-container relative transition-all hover:opacity-90 border-2 ${
                          selectedThumb === idx ? 'border-primary ring-2 ring-primary/30' : 'border-[#F0E6DE]'
                        }`}
                      >
                        <img src={img} alt="Aperçu" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Environmental Impact Widget */}
                <div className="rounded-2xl bg-white border border-[#F0E6DE] p-4 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[26px]">compost</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base font-bold text-on-surface">
                        {product.co2 || '1,8 kg de CO₂e évités'}
                      </span>
                      <span className="text-xs text-on-surface-variant leading-snug">
                        En sauvant ce panier, vous préservez les ressources alimentaires et l'énergie du commerce.
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                      Anti-Gaspi
                    </span>
                    <span className="text-sm font-bold text-primary">Tunisie Verte</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Commercial Details & Instant Booking */}
              <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
                {/* Merchant Card Snippet */}
                <div className="rounded-2xl bg-white border border-[#F0E6DE] p-4 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">storefront</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-on-surface">
                          {product.merchantName || product.commercantNom || 'Commerçant Partenaire'}
                        </span>
                        <span className="inline-flex items-center text-secondary text-xs font-bold gap-0.5">
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          Partenaire
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {product.commercantLocalisation || product.distance || 'Tunis, Tunisie'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-primary">
                      <span className="text-amber-500">★</span>
                      <span className="font-bold text-sm">{avgRating || product.rating || '5.0'}</span>
                    </div>
                    <a href="#avis-section" className="text-[11px] text-on-surface-variant underline hover:text-primary">
                      {totalReviews} avis
                    </a>
                  </div>
                </div>

                {/* Product Title and Tagline */}
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
                    {product.nom}
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price & Savings Display */}
                <div className="rounded-2xl bg-white border border-[#F0E6DE] p-4 shadow-2xs flex flex-col gap-2">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-primary tracking-tight">
                        {formatDT(product.prix)}
                      </span>
                      
                    </div>
                  
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-3/4" />
                  </div>
                </div>

                {/* Pickup Logistics Alert Box */}
                <div className="rounded-2xl bg-secondary-container/30 border border-[#CDE5CB] p-4 flex flex-col gap-3 shadow-2xs">
                  
                  <div className="flex items-start gap-3 pt-2 border-t border-[#CDE5CB]/60">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">
                      payments
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface">
                        Paiement 100% sur place en espèces
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Aucun paiement en ligne requis. Réglez en espèces directement lors du retrait.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Controls */}
                <div className="rounded-2xl bg-white border border-[#F0E6DE] p-4 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Quantité à réserver</span>
                    <div className="inline-flex items-center bg-surface-container rounded-full p-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-full bg-white text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-full bg-white text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(false)}
                      className="flex-1 py-3 px-5 rounded-full bg-white text-primary hover:bg-primary-soft/60 border border-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                      Ajouter au panier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(true)}
                      className="flex-1 py-3 px-5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>Réserver maintenant</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>

                  {toastMessage && (
                    <div className="p-2.5 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold text-center animate-fade-in">
                      {toastMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION MERCHANT HIGHLIGHT (100% Dynamique) ─── */}
        <section className="w-full py-12 bg-surface">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-surface-container p-6 lg:p-10 shadow-xs border border-[#F0E6DE] flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                    Commerçant Partenaire
                  </span>
                  <span className="text-secondary text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span> Partenaire certifié
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
                  {product.merchantName || product.commercantNom || 'Commerçant Partenaire'}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {product.description || 'Artisan engagé dans la réduction du gaspillage alimentaire.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-on-surface text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                    <span>{product.commercantLocalisation || product.distance || 'Tunis, Tunisie'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
                    <span>Règlement en espèces au retrait</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    to="/#produits"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-xs border border-[#F0E6DE]"
                  >
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                    Voir tous les paniers disponibles
                  </Link>
                </div>
              </div>

              {/* Right: Map / Direction Visual Card */}
              <div className="w-full lg:w-1/2 flex flex-col gap-2">
                <div className="w-full p-8 rounded-2xl bg-white border border-[#F0E6DE] shadow-xs flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px]">pin_drop</span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">
                    {product.merchantName || product.commercantNom || 'Commerçant Partenaire'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {product.commercantLocalisation || 'Tunis, Tunisie'}
                  </p>
                  <a
                    className="mt-2 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-2xs flex items-center gap-1.5"
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      (product.merchantName || '') + ' ' + (product.commercantLocalisation || 'Tunis')
                    )}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[16px]">directions</span>
                    Ouvrir l'itinéraire sur Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION REVIEWS & RATINGS (100% Dynamique & Réel) ─── */}
        <section className="w-full py-12 bg-surface-container-low border-t border-[#F0E6DE]" id="avis-section">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                  Retours d'expérience
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
                  Avis de la Communauté des Gourmets
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Avis réels publiés par les clients ayant sauvé un panier chez {product.merchantName || 'ce commerçant'}.
                </p>
              </div>
              <a
                className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-dark transition-all self-start md:self-auto flex items-center gap-1.5 shadow-xs"
                href="#avis-form-anchor"
              >
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
                Donner mon avis
              </a>
            </div>

            {/* Rating Overview Bento */}
            {totalReviews === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-xs border border-[#F0E6DE]">
                <span className="material-symbols-outlined text-4xl text-amber-500 mb-2 block">
                  star_border
                </span>
                <h3 className="text-base font-bold text-on-surface">Aucun avis pour le moment</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-4">
                  Soyez le premier client à donner votre avis après avoir récupéré votre panier chez {product.merchantName || 'ce commerçant'} !
                </p>
                <a
                  href="#avis-form-anchor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">rate_review</span>
                  Laisser le premier avis
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-2xl bg-white p-6 shadow-xs border border-[#F0E6DE]">
                {/* Big Rating */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-[#F0E6DE]">
                  <span className="text-5xl font-extrabold text-primary tracking-tight font-sans">
                    {avgRating}
                  </span>
                  <div className="flex items-center text-amber-500 gap-1 my-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < Math.floor(Number(avgRating)) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    Basé sur {totalReviews} avis vérifié{totalReviews > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Breakdown Progress Bars */}
                <div className="md:col-span-8 flex flex-col gap-2 px-0 md:px-4">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = starDistribution[stars] || 0;
                    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-on-surface text-xs font-medium">
                        <span className="w-16 shrink-0">{stars} étoile{stars > 1 ? 's' : ''}</span>
                        <div className="flex-1 bg-surface-container rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-on-surface-variant font-bold">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Reviews Grid (No like button, strictly real server avis) */}
            {reviewsList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-white p-5 shadow-xs border border-[#F0E6DE] flex flex-col justify-between gap-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full ${rev.bg} flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {rev.initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-on-surface">
                              {rev.name}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {rev.location}
                            </span>
                          </div>
                        </div>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-secondary text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            Vérifié
                          </span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-500 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>
                            {i < Math.floor(rev.rating) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                        {rev.text}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-[#F5EBE1]">
                      <span>{rev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Form: Leave a Review */}
            <div
              className="rounded-2xl bg-white p-6 lg:p-8 shadow-xs border border-[#F0E6DE] flex flex-col gap-4"
              id="avis-form-anchor"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-primary">
                  Laisser un avis sur ce panier
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Vous avez déjà récupéré ce panier chez {product.merchantName || 'ce commerçant'} ? Partagez vos impressions pour guider la communauté.
                </p>
              </div>

              {!isAuthenticated && (
                <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center justify-between gap-3">
                  <span>Vous devez être connecté avec votre compte Client pour publier un avis.</span>
                  <Link to="/auth?mode=login" className="px-3 py-1 rounded-full bg-primary text-white font-bold text-xs shrink-0">
                    Se connecter
                  </Link>
                </div>
              )}

              {reviewSuccess && (
                <div className="rounded-xl bg-secondary-container text-on-secondary-container p-3 text-center text-xs font-bold animate-fade-in">
                  ✨ Yaâtek essaha ! Votre avis a été enregistré sur le serveur.
                </div>
              )}

              {reviewError && (
                <div className="rounded-xl bg-red-100 text-red-800 p-3 text-center text-xs font-bold">
                  {reviewError}
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                {/* Rating Stars Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface">Votre note globale</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="text-amber-500 hover:scale-110 transition-transform p-0.5"
                      >
                        <span
                          className="material-symbols-outlined text-[28px]"
                          style={{
                            fontVariationSettings: star <= formRating ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                    <span className="ml-3 text-xs font-bold text-primary">
                      {getRatingLabel(formRating)}
                    </span>
                  </div>
                </div>

                {/* User Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface" htmlFor="review-name">
                      Votre nom / pseudo
                    </label>
                    <input
                      id="review-name"
                      required
                      type="text"
                      placeholder="Ex. Yassine G. (Tunis)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm text-on-surface focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary border-0"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface" htmlFor="review-date">
                      Date de votre dernier retrait
                    </label>
                    <select
                      id="review-date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm text-on-surface focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary border-0"
                    >
                      <option value="today">Aujourd'hui</option>
                      <option value="yesterday">Hier</option>
                      <option value="this-week">Cette semaine</option>
                      <option value="earlier">Il y a plus d'une semaine</option>
                    </select>
                  </div>
                </div>

                {/* Review Textarea */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface" htmlFor="review-content">
                    Partagez votre expérience
                  </label>
                  <textarea
                    id="review-content"
                    required
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Qualité des produits, accueil du commerçant... Écrivez en Français ou en Derja !"
                    className="w-full p-3.5 rounded-xl bg-surface-container-low text-xs sm:text-sm text-on-surface focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary border-0 resize-y"
                  />
                </div>

                {/* Form Action & Feedback Notice */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
                    Avis soumis à notre charte anti-gaspi communautaire.
                  </span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Publier mon avis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Related Deals Section (From Server) */}
        {relatedDeals.length > 0 && (
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                D'autres paniers à sauver aux alentours
              </h2>
              <Link to="/#produits" className="text-xs sm:text-sm font-bold text-secondary hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
